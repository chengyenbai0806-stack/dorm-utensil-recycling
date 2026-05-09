import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
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
  status: "pending" | "accepted" | "completed";
  createdAt: string;
  deliveryPerson?: string;
}

export default function CustomerPage() {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState("");
  const [dorm, setDorm] = useState("");
  const [room, setRoom] = useState("");
  const [phone, setPhone] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<OrderItem[]>([
    { name: "碗", count: 0 },
    { name: "盤子", count: 0 },
    { name: "杯子", count: 0 },
    { name: "筷子", count: 0 },
    { name: "湯匙", count: 0 },
  ]);

  useEffect(() => {
    loadMyOrders();
  }, []);

  const loadMyOrders = () => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    setMyOrders(orders.reverse().slice(0, 10));
  };

  const updateCount = (index: number, delta: number) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index].count = Math.max(0, newItems[index].count + delta);
      return newItems;
    });
  };

  const handleSubmit = () => {
    if (!studentName || !dorm || !room || !phone) {
      toast.error("請填寫完整資料");
      return;
    }

    const selectedItems = items.filter(item => item.count > 0);
    if (selectedItems.length === 0) {
      toast.error("請至少選擇一項餐具");
      return;
    }

    const order = {
      id: Date.now().toString(),
      studentName,
      dorm,
      room,
      phone,
      items: selectedItems,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    localStorage.setItem("orders", JSON.stringify([...existingOrders, order]));

    toast.success("訂單提交成功！");

    navigate(`/tracking?id=${order.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl">預約餐具回收</h1>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <History className="w-4 h-4" />
            {showHistory ? "新訂單" : "歷史訂單"}
          </button>
        </div>

        {showHistory ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl mb-4">我的訂單紀錄</h2>
            {myOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>尚無訂單紀錄</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myOrders.map(order => (
                  <button
                    key={order.id}
                    onClick={() => navigate(`/tracking?id=${order.id}`)}
                    className="w-full bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{order.studentName}</p>
                        <p className="text-sm text-gray-600">{order.dorm} {order.room}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          order.status === "pending"
                            ? "bg-orange-100 text-orange-700"
                            : order.status === "accepted"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {order.status === "pending"
                          ? "待接取"
                          : order.status === "accepted"
                          ? "進行中"
                          : "已完成"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="text-xs bg-white px-2 py-1 rounded-full">
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
              <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <User className="w-4 h-4" />
                學生姓名
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="請輸入姓名"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  宿舍樓棟
                </label>
                <input
                  type="text"
                  value={dorm}
                  onChange={(e) => setDorm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：A棟"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">房號</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：301"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Phone className="w-4 h-4" />
                聯絡電話
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="請輸入電話號碼"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl mb-4">選擇回收餐具</h2>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between bg-gray-50 rounded-xl p-4"
                >
                  <span className="text-lg">{item.name}</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateCount(index, -1)}
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
                      disabled={item.count === 0}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-lg">{item.count}</span>
                    <button
                      onClick={() => updateCount(index, 1)}
                      className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow hover:bg-blue-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              提交訂單
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
