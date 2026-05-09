"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // 確保是從 next/navigation 匯入
import { ArrowLeft, Plus, Minus, MapPin, User, Phone, History } from "lucide-react";
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
  status: "pending" | "accepted" | "in_locker" | "completed";
  createdAt: string;
}

export default function CustomerPage() {
  const router = useRouter(); // 修正點 1：將 navigate 改為 router
  const [studentName, setStudentName] = useState("");
  const [dorm, setDorm] = useState("");
  const [room, setRoom] = useState("");
  const [phone, setPhone] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([
    { name: "碗", count: 0 },
    { name: "盤子", count: 0 },
    { name: "杯子", count: 0 },
    { name: "筷子", count: 0 },
    { name: "湯匙", count: 0 },
  ]);

  useEffect(() => {
    if (showHistory && phone) {
      loadMyOrders();
    }
  }, [showHistory]);

  const loadMyOrders = async () => {
    if (!phone) return;
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('phone', phone)
      .order('createdAt', { ascending: false })
      .limit(10);

    if (error) {
      console.error("抓取失敗:", error);
    } else {
      setMyOrders(data || []);
    }
  };

  const updateCount = (index: number, delta: number) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index].count = Math.max(0, newItems[index].count + delta);
      return newItems;
    });
  };

  const handleSubmit = async () => {
    if (!studentName || !dorm || !room || !phone) {
      toast.error("請填寫完整資料");
      return;
    }

    const selectedItems = items.filter(item => item.count > 0);
    if (selectedItems.length === 0) {
      toast.error("請至少選擇一項餐具");
      return;
    }

    setIsSubmitting(true);

    const newOrder = {
      studentName,
      dorm,
      room,
      phone,
      items: selectedItems,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([newOrder])
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      console.error("提交失敗:", error);
      toast.error("提交失敗，請檢查網路連線");
    } else {
      toast.success("訂單提交成功！");
      // 修正點 2：使用 router.push 導向
      router.push(`/tracking?id=${data.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 text-black">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")} // 修正點 3：使用 router.push
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold">預約餐具回收</h1>
          </div>
          <button
            onClick={() => {
              if(!phone && !showHistory) toast.info("輸入電話後即可查看歷史紀錄");
              setShowHistory(!showHistory);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow text-gray-700"
          >
            <History className="w-4 h-4" />
            {showHistory ? "返回填寫" : "歷史訂單"}
          </button>
        </div>

        {showHistory ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 animate-in slide-in-from-right duration-300">
            <h2 className="text-xl mb-4 font-bold">我的訂單紀錄</h2>
            {!phone ? (
               <p className="text-center py-12 text-gray-400">請先返回輸入電話號碼以查詢紀錄</p>
            ) : myOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>尚無訂單紀錄</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => router.push(`/tracking?id=${order.id}`)}
                    className="w-full bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors text-left border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-800">{new Date(order.createdAt).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">{order.dorm} {order.room}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === "pending" ? "bg-orange-100 text-orange-700" :
                          order.status === "accepted" ? "bg-blue-100 text-blue-700" :
                          "bg-green-100 text-green-700"
                        }`}
                      >
                        {order.status === "pending" ? "待接取" :
                         order.status === "accepted" ? "進行中" : 
                         order.status === "in_locker" ? "待取餐" : "已完成"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="text-xs bg-white px-2 py-1 rounded-full border border-gray-200 text-gray-600">
                          {item.name} × {item.count}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                  <User className="w-4 h-4" />
                  學生姓名
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-black"
                  placeholder="請輸入姓名"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    宿舍樓棟
                  </label>
                  <input
                    type="text"
                    value={dorm}
                    onChange={(e) => setDorm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-black"
                    placeholder="例：A棟"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">房號</label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-black"
                    placeholder="例：301"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                  <Phone className="w-4 h-4" />
                  聯絡電話
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-black"
                  placeholder="請輸入電話號碼"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-bold mb-4">選擇回收餐具</h2>
              <div className="grid grid-cols-1 gap-3">
                {items.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100"
                  >
                    <span className="text-lg font-medium text-gray-700">{item.name}</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => updateCount(index, -1)}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-90 disabled:opacity-30 text-gray-600"
                        disabled={item.count === 0}
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="w-6 text-center text-xl font-bold text-blue-600">{item.count}</span>
                      <button
                        onClick={() => updateCount(index, 1)}
                        className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-600 transition-all active:scale-90"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98] ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "提交中..." : "提交預約"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}