"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Clock, CheckCircle, Truck, User, Home, PackageCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

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

export default function OrderTracking() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
    if (!orderId) {
      router.push("/customer");
      return;
    }
    loadOrder();

    const channel = supabase
      .channel(`track-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, loadOrder, router]);

  const handlePayDeposit = async () => {
    if (!orderId) return;
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
      return;
    } 
    toast.success("押金支付成功，請取餐！");
    await loadOrder(); 
    setIsProcessing(false);
  };

  const handleReturnConfirm = async () => {
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
      await loadOrder();
    } else {
      toast.error("更新失敗");
    }
    setIsProcessing(false);
  };

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
      載入中...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-black p-4 pb-10">
      <div className="max-w-2xl mx-auto">
        {/* 頂部導覽 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push("/customer")}
            className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold">訂單詳細追蹤</h1>
        </div>

        {/* 核心狀態卡片 */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center mb-6">
          <div className="mb-6 flex justify-center">
            {order.status === "pending" && <Clock className="w-16 h-16 text-orange-400 animate-pulse" />}
            {order.status === "delivering" && <Truck className="w-16 h-16 text-blue-500 animate-bounce" />}
            {order.status === "in_locker" && <PackageCheck className="w-16 h-16 text-green-500" />}
            {order.status === "picked_up" && <User className="w-16 h-16 text-yellow-500" />}
            {order.status === "returned" && <CheckCircle className="w-16 h-16 text-green-600 animate-in zoom-in" />}
          </div>

          <h2 className="text-2xl font-bold mb-2">
            {order.status === "pending" && "等待接單中"}
            {order.status === "delivering" && "餐點配送中"}
            {order.status === "in_locker" && `已送達 ${order.lockerNumber || ""} 號櫃`}
            {order.status === "picked_up" && "享受美食中"}
            {order.status === "returned" && "餐具歸還完成"}
          </h2>
          
          <p className="text-gray-500 text-sm mb-6">
            訂單編號: {order.id.split("-")[0].toUpperCase()}
          </p>

          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mb-8">
             <div 
               className="h-full bg-blue-500 transition-all duration-500" 
               style={{ width: 
                 order.status === "pending" ? "20%" : 
                 order.status === "delivering" ? "40%" : 
                 order.status === "in_locker" ? "60%" : 
                 order.status === "picked_up" ? "80%" : "100%" 
               }} 
             />
          </div>

          {/* 交互區域 */}
          <div className="space-y-4">
            {order.status === "in_locker" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-gray-50 p-4 rounded-2xl mb-4 flex justify-center">
                  <QRCodeSVG value={JSON.stringify({ id: order.id, action: 'pickup' })} size={180} />
                </div>
                <button
                  onClick={handlePayDeposit}
                  disabled={isProcessing}
                  className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-md hover:bg-green-700 transition-all disabled:bg-gray-300"
                >
                  {isProcessing ? "處理中..." : "支付押金 NT$100 並取餐"}
                </button>
              </div>
            )}

            {order.status === "picked_up" && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-purple-50 border-2 border-dashed border-purple-100 p-4 rounded-2xl mb-4 flex justify-center">
                  <QRCodeSVG value={JSON.stringify({ id: order.id, action: 'return' })} size={180} />
                </div>
                <button
                  onClick={handleReturnConfirm}
                  disabled={isProcessing}
                  className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-md hover:bg-purple-700 transition-all disabled:bg-gray-300"
                >
                  {isProcessing ? "處理中..." : "確認歸還 (退回押金)"}
                </button>
              </div>
            )}

            {/* 歸還後的返回按鈕 */}
            {order.status === "returned" && (
              <div className="animate-in fade-in zoom-in duration-500">
                <p className="text-green-600 font-medium mb-4">感謝您支持環境永續，押金已退還！</p>
                <button
                  onClick={() => router.push("/customer")}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-lg hover:bg-black flex items-center justify-center gap-2 transition-all"
                >
                  <Home className="w-5 h-5" />
                  返回主介面
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 訂單詳情 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold mb-4 text-gray-800">訂單內容</h3>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{item.name}</span>
                <span className="font-medium">x {item.count}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-50 mt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">配送位置</span>
                <span className="text-gray-800 font-medium">{order.dorm} {order.room}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}