"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Clock, CheckCircle, Truck, User, Home, PackageCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

interface OrderItem {
  name: string;
  count: number;
}

interface Order {
  id: string;
  studentName: string;
  dorm: string;
  room: string;
  phone: string;
  items: OrderItem[];
  status: "pending" | "accepted" | "delivering" | "in_locker" | "picked_up" | "returned" | "completed";
  createdAt: string;
  deliveryPerson?: string;
  lockerNumber?: number;
  deposit?: number;
  returnDeposit?: number;
}

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams ? searchParams.get("id") : null;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ 這裡是給外送員掃描的固定網址
  const qrValue = "https://save-food-app-homework-train.vercel.app/";

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error("載入失敗:", error);
      toast.error("找不到該訂單");
    } else {
      setOrder(data);
    }
  }, [orderId]);

  useEffect(() => {
    if (typeof window === "undefined" || !orderId) return;

    loadOrder();

    const channel = supabase
      .channel(`track-${orderId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders', 
          filter: `id=eq.${orderId}` 
        },
        (payload) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, loadOrder]);

  const handlePayDeposit = async () => {
    if (!orderId || isProcessing) return;
    setIsProcessing(true);
    
    const { error } = await supabase
      .from('orders')
      .update({
        status: "picked_up",
        deposit: 100,
        pickedUpAt: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      toast.error("支付失敗");
      setIsProcessing(false);
    } else {
      toast.success("押金支付成功，請取餐！");
      setIsProcessing(false);
    }
  };

  const handleReturnConfirm = async () => {
    if (!orderId || isProcessing) return;
    setIsProcessing(true);

    const { error } = await supabase
      .from('orders')
      .update({ 
        status: "returned",
        returnDeposit: 100 
      })
      .eq('id', orderId);

    if (!error) {
      toast.success("歸還成功");
    } else {
      toast.error("更新失敗");
      setIsProcessing(false);
    }
  };

  if (!orderId) return <div className="p-10 text-center text-black">未提供訂單編號</div>;
  if (!order) return <div className="p-10 text-center text-black">載入中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-black p-4 pb-10 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.push("/customer")} className="p-2 bg-white rounded-full shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">訂單追蹤</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center mb-6">
          <div className="mb-6 flex justify-center">
            {order.status === "pending" && <Clock className="w-16 h-16 text-orange-400 animate-pulse" />}
            {order.status === "delivering" && <Truck className="w-16 h-16 text-blue-500 animate-bounce" />}
            {order.status === "in_locker" && <PackageCheck className="w-16 h-16 text-green-500" />}
            {order.status === "picked_up" && <User className="w-16 h-16 text-yellow-500" />}
            {order.status === "returned" && <CheckCircle className="w-16 h-16 text-green-600" />}
          </div>

          <h2 className="text-2xl font-bold mb-2 text-gray-800">
            {order.status === "pending" && "正在尋找外送員"}
            {order.status === "delivering" && "外送員配送中"}
            {order.status === "in_locker" && `請至 ${order.lockerNumber} 號櫃取餐`}
            {order.status === "picked_up" && "餐點使用中"}
            {order.status === "returned" && "歸還流程已完成"}
          </h2>
          
          <p className="text-gray-400 text-[10px] mb-6 uppercase tracking-widest">
            Order ID: {order.id.split("-")[0]}
          </p>

          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-8">
            <div 
              className="h-full bg-blue-500 transition-all duration-700" 
              style={{ width: 
                order.status === "pending" ? "10%" : 
                order.status === "delivering" ? "40%" : 
                order.status === "in_locker" ? "70%" : 
                order.status === "picked_up" ? "90%" : "100%" 
              }} 
            />
          </div>

          <div className="space-y-4">
            {/* ✅ 【接單/取餐畫面】 - 這裡絕對保留 QRCode，讓外送員掃描 */}
            {order.status === "in_locker" && (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="bg-gray-50 p-6 rounded-2xl mb-4 flex flex-col items-center border border-gray-100">
                  <p className="text-sm text-gray-500 mb-3 font-medium">請向外送員/管理員出示此碼接單</p>
                  <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100">
                    <QRCodeSVG value={qrValue} size={180} />
                  </div>
                </div>
                <button
                  onClick={handlePayDeposit}
                  disabled={isProcessing}
                  className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg hover:bg-green-700 transition-all"
                >
                  {isProcessing ? "處理中..." : "支付押金 NT$100 並完成取餐"}
                </button>
              </div>
            )}

            {/* ✅ 【歸還畫面】 - 這裡徹底刪除 QRCode，只需點擊按鈕 */}
            {order.status === "picked_up" && (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="bg-purple-50 p-8 rounded-2xl mb-4 text-center border border-purple-100">
                  <User className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-purple-700 font-bold">餐點使用中</p>
                  <p className="text-purple-500 text-sm">請於用餐完畢後將餐具歸還至指定點</p>
                </div>
                <button
                  onClick={handleReturnConfirm}
                  disabled={isProcessing}
                  className="w-full py-6 bg-purple-600 text-white rounded-2xl font-bold shadow-lg hover:bg-purple-700 transition-all text-lg"
                >
                  {isProcessing ? "處理中..." : "我已完成歸還 (退回押金)"}
                </button>
              </div>
            )}

            {/* ✅ 【完成畫面】 */}
            {order.status === "returned" && (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="bg-green-50 p-6 rounded-2xl mb-6 border border-green-100">
                   <p className="text-green-700 font-bold mb-1">任務完成！</p>
                   <p className="text-green-600 text-sm text-balance">感謝您支持循環餐具，押金已原路退回。</p>
                </div>
                <button
                  onClick={() => router.push("/customer")}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
                >
                  返回首頁
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderTracking() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-black">系統載入中...</div>}>
      <TrackingContent />
    </Suspense>
  );
}