import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Home, MapPin, Phone, Package, Check, QrCode } from "lucide-react";
import { toast } from "sonner";
import dynamic from 'next/dynamic';

    // 改用這種方式載入，並設定 ssr: false
    const QRCodeSVG = dynamic(
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
  acceptedAt?: string;
  deliveredAt?: string;
  pickedUpAt?: string;
  deposit?: number;
  returnDeposit?: number;
}

export default function DeliveryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryName, setDeliveryName] = useState("");
  const [showNameInput, setShowNameInput] = useState(true);

  useEffect(() => {
    loadOrders();
    const savedName = localStorage.getItem("deliveryPersonName");
    if (savedName) {
      setDeliveryName(savedName);
      setShowNameInput(false);
    }
  }, []);

  const loadOrders = () => {
    const storedOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    setOrders(storedOrders);
  };

  const handleSetName = () => {
    if (!deliveryName.trim()) {
      toast.error("請輸入您的姓名");
      return;
    }
    localStorage.setItem("deliveryPersonName", deliveryName);
    setShowNameInput(false);
    toast.success(`歡迎，${deliveryName}！`);
  };

  const acceptOrder = (orderId: string) => {
    // 分配柜子编号（1-50号柜子）
    const usedLockers = orders
      .filter(o => o.status === "accepted" && o.lockerNumber)
      .map(o => o.lockerNumber);

    let lockerNumber = 1;
    while (usedLockers.includes(lockerNumber) && lockerNumber <= 50) {
      lockerNumber++;
    }

    const updatedOrders = orders.map(order =>
      order.id === orderId
        ? {
            ...order,
            status: "accepted" as const,
            deliveryPerson: deliveryName,
            lockerNumber: lockerNumber,
            acceptedAt: new Date().toISOString()
          }
        : order
    );
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
    toast.success(`已接取訂單，分配柜子編號：${lockerNumber}`);
  };

  const deliverToLocker = (orderId: string) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId
        ? {
            ...order,
            status: "in_locker" as const,
            deliveredAt: new Date().toISOString()
          }
        : order
    );
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
    toast.success("已放入櫃子，等待顧客取餐");
  };

  const pendingOrders = orders.filter(o => o.status === "pending");
  const myOrders = orders.filter(o => o.status === "accepted" && o.deliveryPerson === deliveryName);
  const deliveredOrders = orders.filter(o => o.status === "in_locker" && o.deliveryPerson === deliveryName);
  const completedOrders = orders.filter(o => o.status === "completed");

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl mb-6 text-center">外送員登入</h2>
          <input
            type="text"
            value={deliveryName}
            onChange={(e) => setDeliveryName(e.target.value)}
            placeholder="請輸入您的姓名"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            onKeyPress={(e) => e.key === "Enter" && handleSetName()}
          />
          <button
            onClick={handleSetName}
            className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors"
          >
            開始工作
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
              title="返回首頁"
            >
              <Home className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl">回收訂單管理</h1>
              <p className="text-gray-600">外送員：{deliveryName}</p>
            </div>
          </div>
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            重新整理
          </button>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              待接取訂單 ({pendingOrders.length})
            </h2>
            {pendingOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">
                目前沒有待接取的訂單
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    action={
                      <button
                        onClick={() => acceptOrder(order.id)}
                        className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                      >
                        接取訂單
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              我的訂單 ({myOrders.length})
            </h2>
            {myOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">
                您目前沒有進行中的訂單
              </div>
            ) : (
              <div className="space-y-3">
                {myOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    showQR={true}
                    action={
                      <button
                        onClick={() => deliverToLocker(order.id)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        已放入櫃子
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-500" />
              已配送 ({deliveredOrders.length})
            </h2>
            {deliveredOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">
                暫無已配送訂單
              </div>
            ) : (
              <div className="space-y-3">
                {deliveredOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              已完成 ({completedOrders.length})
            </h2>
            {completedOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">
                還沒有已完成的訂單
              </div>
            ) : (
              <div className="space-y-3">
                {completedOrders.slice(0, 5).map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, action, showQR }: { order: Order; action?: React.ReactNode; showQR?: boolean }) {
  const [showQRCode, setShowQRCode] = useState(false);

  const qrData = JSON.stringify({
    orderId: order.id,
    lockerNumber: order.lockerNumber,
    action: "delivery_open_locker",
    deliveryPerson: order.deliveryPerson,
    timestamp: new Date().toISOString(),
  });

  return (
    <div className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg mb-1">{order.studentName}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {order.dorm} {order.room}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              {order.phone}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showQR && (
            <button
              onClick={() => setShowQRCode(!showQRCode)}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="顯示 QR Code"
            >
              <QrCode className="w-5 h-5" />
            </button>
          )}
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
      </div>

      {showQRCode && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4 flex flex-col items-center border-2 border-blue-500">
          <div className="bg-green-100 px-4 py-2 rounded-lg mb-3">
            <p className="text-lg font-bold text-green-700">櫃子編號: {order.lockerNumber}</p>
          </div>
          <div className="bg-white p-4 rounded-lg mb-2">
            <QRCodeSVG value={qrData} size={200} />
          </div>
          <p className="text-sm text-gray-600 text-center font-semibold mb-1">開櫃 QR Code</p>
          <p className="text-xs text-gray-500 text-center">掃描此碼打開 {order.lockerNumber} 號櫃子放置餐盒</p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="text-sm text-gray-600 mb-2">回收物品：</div>
        <div className="flex flex-wrap gap-2">
          {order.items.map((item, idx) => (
            <span key={idx} className="bg-white px-3 py-1 rounded-full text-sm">
              {item.name} × {item.count}
            </span>
          ))}
        </div>
      </div>

      {order.deliveryPerson && (
        <div className="text-sm text-gray-600 mb-3">
          外送員：{order.deliveryPerson}
        </div>
      )}

      {action && <div className="flex justify-end">{action}</div>}
    </div>
  );
}
