"use client";

export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Home, MapPin, Phone, Package, Check, QrCode } from "lucide-react";
import { toast } from "sonner";
import dynamicLoader from 'next/dynamic';

const QRCodeSVG = dynamicLoader(
  () => import('qrcode.react').then((mod) => mod.QRCodeSVG),
  { ssr: false }
);

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
}

function DeliveryContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryName, setDeliveryName] = useState("");
  const [showNameInput, setShowNameInput] = useState(true);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error("抓取失敗:", error);
    } else {
      setOrders(data || []);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedName = localStorage.getItem("deliveryPersonName");
    if (savedName) {
      setDeliveryName(savedName);
      setShowNameInput(false);
    }

    fetchOrders();

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          toast.info(`新訂單來自 ${payload.new.studentName}！`);
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const handleSetName = () => {
    if (!deliveryName.trim()) {
      toast.error("請輸入您的姓名");
      return;
    }
    localStorage.setItem("deliveryPersonName", deliveryName);
    setShowNameInput(false);
    toast.success(`歡迎，${deliveryName}！`);
  };

  const acceptOrder = async (orderId: string) => {
    const usedLockers = orders
      .filter(o => (o.status === "accepted" || o.status === "delivering") && o.lockerNumber)
      .map(o => o.lockerNumber);
    
    let lockerNumber = 1;
    while (usedLockers.includes(lockerNumber) && lockerNumber <= 50) {
      lockerNumber++;
    }

    const { error } = await supabase
      .from('orders')
      .update({
        status: "delivering",
        deliveryPerson: deliveryName,
        lockerNumber: lockerNumber,
        acceptedAt: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('status', 'pending');

    if (error) {
      toast.error("接單失敗，可能已被搶先一步");
    } else {
      toast.success(`已接取訂單，分配櫃子：${lockerNumber}`);
      fetchOrders();
    }
  };

  const deliverToLocker = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({
        status: "in_locker",
        deliveredAt: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      toast.error("更新失敗");
    } else {
      toast.success("已放入櫃子");
      fetchOrders();
    }
  };

  const pendingOrders = orders.filter(o => o.status === "pending");
  const myOrders = orders.filter(o => 
    ["accepted", "delivering", "in_locker"].includes(o.status) && 
    o.deliveryPerson === deliveryName
  );

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-black">
          <h2 className="text-2xl mb-6 text-center font-bold">外送員登入</h2>
          <input
            type="text"
            value={deliveryName}
            onChange={(e) => setDeliveryName(e.target.value)}
            placeholder="請輸入您的姓名"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            onKeyDown={(e) => e.key === "Enter" && handleSetName()}
          />
          <button
            onClick={handleSetName}
            className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-bold"
          >
            開始工作
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 font-sans text-black">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
            >
              <Home className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">配送管理後台</h1>
              <p className="text-gray-600">當前：{deliveryName}</p>
            </div>
          </div>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            手動重新整理
          </button>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-600">
              <Package className="w-6 h-6" />
              待接取訂單 ({pendingOrders.length})
            </h2>
            <div className="space-y-4">
              {pendingOrders.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
                  目前沒有新請求
                </div>
              ) : (
                pendingOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    action={
                      <button
                        onClick={() => acceptOrder(order.id)}
                        className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-md transition-all active:scale-95"
                      >
                        接取訂單
                      </button>
                    }
                  />
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600">
              <Package className="w-6 h-6" />
              我的進行中任務 ({myOrders.length})
            </h2>
            <div className="space-y-4">
              {myOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  showQR={true}
                  action={
                    order.status !== "in_locker" && (
                      <button
                        onClick={() => deliverToLocker(order.id)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        確認放入櫃子
                      </button>
                    )
                  }
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-black font-bold">系統載入中...</div>}>
      <DeliveryContent />
    </Suspense>
  );
}

function OrderCard({ order, action, showQR }: { order: Order; action?: React.ReactNode; showQR?: boolean }) {
  const [showQRCode, setShowQRCode] = useState(false);
  
  // 替換為固定網址
  const FIXED_QR_URL = "https://save-food-app-homework-train.vercel.app/";

  const statusLabel = {
    pending: "新訂單",
    delivering: "配送中",
    in_locker: "待取貨"
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all text-black">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{order.studentName}</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <MapPin className="w-4 h-4 text-red-400" />
              {order.dorm} {order.room}
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Phone className="w-4 h-4 text-blue-400" />
              {order.phone}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-4 py-1 rounded-full text-xs font-bold ${
            order.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
            order.status === 'in_locker' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
          }`}>
            {statusLabel[order.status as keyof typeof statusLabel] || "處理中"}
          </span>
          {showQR && (
             <button onClick={() => setShowQRCode(!showQRCode)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-blue-500 transition-colors">
               <QrCode className="w-6 h-6" />
             </button>
          )}
        </div>
      </div>

      {showQRCode && (
        <div className="my-4 p-4 bg-blue-50 rounded-2xl border-2 border-blue-100 flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <p className="font-bold text-blue-700 mb-2">櫃子：{order.lockerNumber}</p>
          <div className="bg-white p-3 rounded-xl shadow-inner">
            <QRCodeSVG value={FIXED_QR_URL} size={150} />
          </div>
          <p className="text-[10px] text-blue-400 mt-2 break-all">{FIXED_QR_URL}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {order.items?.map((item, i) => (
          <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-medium">
            {item.name} x {item.count}
          </span>
        ))}
      </div>

      {action && <div className="pt-4 border-t border-gray-50 flex justify-end">{action}</div>}
    </div>
  );
}