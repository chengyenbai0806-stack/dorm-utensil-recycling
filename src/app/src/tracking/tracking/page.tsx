"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase"; // 確保路徑正確
import { ArrowLeft, Clock, CheckCircle, Truck, User, MapPin, Phone, Lock, DollarSign } from "lucide-react";
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
  const router = useRouter(); // 修正：使用 useRouter
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  
  const [order, setOrder] = useState<Order | null>(null);
  const [showPickupQR, setShowPickupQR] = useState(false);
  const [showReturnQR, setShowReturnQR] = useState(false);
  const [depositPaid, setDepositPaid] = useState(false);
  const [returnDepositPaid, setReturnDepositPaid] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.push("/customer");
      return;
    }

    // 初始載入
    loadOrder();

    // 訂閱 Supabase 即時變更
    const channel = supabase
      .channel('order-status-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload: any) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const loadOrder = async () => {
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
      // 如果資料庫已經有押金紀錄，同步狀態
      if (data.deposit) setDepositPaid(true);
      if (data.returnDeposit) setReturnDepositPaid(true);
    }
  };

  // 模擬支付押金 (更新 Supabase)
  const handlePayDeposit = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ deposit: 100 })
      .eq('id', orderId);

    if (!error) {
      setDepositPaid(true);
      setShowPickupQR(true);
      toast.success("押金支付成功");
    }
  };

  // 模擬取餐確認
  const handlePickupConfirm = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: "picked_up",
        pickedUpAt: new Date().toISOString() 
      })
      .eq('id', orderId);

    if (!error) {
      loadOrder();
      setShowPickupQR(false);
      toast.success("取餐完成");
    }
  };

  const handlePayReturnDeposit = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ returnDeposit: 100 })
      .eq('id', orderId);

    if (!error) {
      setReturnDepositPaid(true);
      setShowReturnQR(true);
      toast.success("歸還押金支付成功");
    }
  };

  const handleReturnConfirm = async () => {
    const { error } = await supabase
      .from('orders')
      .update({ status: "returned" })
      .eq('id', orderId);

    if (!error) {
      loadOrder();
      setShowReturnQR(false);
      toast.success("歸還完成，押金已退還");
    }
  };

  // QR Code 內容
  const pickupQRData = order ? JSON.stringify({ orderId: order.id, locker: order.lockerNumber, action: "pickup" }) : "";
  const returnQRData = order ? JSON.stringify({ orderId: order.id, locker: order.lockerNumber, action: "return" }) : "";

  if (!order) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3"></div>
        <p>載入訂單中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 text-black">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.push("/customer")}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">訂單追蹤</h1>
        </div>

        {/* 狀態卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col items-center justify-center mb-6">
            {order.status === "pending" && (
              <div className="text-center">
                <Clock className="w-16 h-16 text-orange-500 animate-pulse mx-auto mb-4" />
                <h2 className="text-xl font-bold">等待接單中...</h2>
              </div>
            )}
            {order.status === "accepted" && (
              <div className="text-center">
                <Truck className="w-16 h-16 text-blue-500 animate-bounce mx-auto mb-4" />
                <h2 className="text-xl font-bold">外送員送餐中</h2>
              </div>
            )}
            {order.status === "in_locker" && (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold">餐點已送達 {order.lockerNumber} 號櫃</h2>
              </div>
            )}
            {order.status === "picked_up" && (
              <div className="text-center">
                <User className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold">享受美食中</h2>
              </div>
            )}
            {order.status === "returned" && (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold">已歸還餐具</h2>
              </div>
            )}
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">訂單編號</span>
              <span className="font-mono text-sm">{order.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">配送地點</span>
              <span className="font-medium">{order.dorm} {order.room}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">內容物</span>
              <div className="text-right">
                {order.items.map((item, i) => (
                  <div key={i} className="text-sm">{item.name} x {item.count}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 交互按鈕與 QR Code 區域 */}
        {order.status === "in_locker" && (
          <div className="space-y-4">
            {!depositPaid ? (
              <button
                onClick={handlePayDeposit}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg"
              >
                支付取餐押金 (NT$ 100)
              </button>
            ) : (
              <div className="bg-white p-6 rounded-2xl shadow-lg text-center border-2 border-green-500">
                <p className="font-bold mb-4">請掃描開櫃取餐</p>
                <div className="flex justify-center mb-4">
                  <QRCodeSVG value={pickupQRData} size={200} />
                </div>
                <button onClick={handlePickupConfirm} className="text-xs text-gray-400 underline">
                  模擬取餐完成 (測試用)
                </button>
              </div>
            )}
          </div>
        )}

        {order.status === "picked_up" && (
          <div className="space-y-4">
            {!returnDepositPaid ? (
              <button
                onClick={handlePayReturnDeposit}
                className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold shadow-lg"
              >
                預付歸還押金 (NT$ 100)
              </button>
            ) : (
              <div className="bg-white p-6 rounded-2xl shadow-lg text-center border-2 border-purple-500">
                <p className="font-bold mb-4">掃描歸還餐具</p>
                <div className="flex justify-center mb-4">
                  <QRCodeSVG value={returnQRData} size={200} />
                </div>
                <button onClick={handleReturnConfirm} className="text-xs text-gray-400 underline">
                  模擬歸還完成 (測試用)
                </button>
              </div>
            )}
          </div>
        )}

        {/* 進度條 */}
        <div className="mt-8 flex items-center justify-between px-2">
           {[ "pending", "accepted", "in_locker", "picked_up", "returned"].map((s, idx) => (
             <div key={s} className="flex flex-col items-center gap-1">
               <div className={`w-3 h-3 rounded-full ${
                 order.status === s ? "bg-blue-500 scale-125 animate-pulse" : 
                 "bg-gray-300"
               }`} />
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}