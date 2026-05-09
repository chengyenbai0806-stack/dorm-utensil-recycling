import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Clock, CheckCircle, Truck, User, MapPin, Phone, ScanLine, Lock, DollarSign } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import QRScanner from "./QRScanner";

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

export default function OrderTracking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<Order | null>(null);
  const [showPickupQR, setShowPickupQR] = useState(false);
  const [showReturnQR, setShowReturnQR] = useState(false);
  const [depositPaid, setDepositPaid] = useState(false);
  const [returnDepositPaid, setReturnDepositPaid] = useState(false);

  useEffect(() => {
    if (!orderId) {
      navigate("/customer");
      return;
    }

    loadOrder();
    const interval = setInterval(loadOrder, 2000);
    return () => clearInterval(interval);
  }, [orderId]);

  const loadOrder = () => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    const foundOrder = orders.find((o: Order) => o.id === orderId);
    if (foundOrder) {
      setOrder(foundOrder);
    }
  };

  const handlePayDeposit = () => {
    setDepositPaid(true);
    setShowPickupQR(true);
    const updatedOrders = JSON.parse(localStorage.getItem("orders") || "[]").map((o: Order) =>
      o.id === orderId ? { ...o, deposit: 100 } : o
    );
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
  };

  const handlePickupConfirm = () => {
    const updatedOrders = JSON.parse(localStorage.getItem("orders") || "[]").map((o: Order) =>
      o.id === orderId
        ? { ...o, status: "picked_up", pickedUpAt: new Date().toISOString() }
        : o
    );
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    loadOrder();
    setShowPickupQR(false);
  };

  const handlePayReturnDeposit = () => {
    setReturnDepositPaid(true);
    setShowReturnQR(true);
    const updatedOrders = JSON.parse(localStorage.getItem("orders") || "[]").map((o: Order) =>
      o.id === orderId ? { ...o, returnDeposit: 100 } : o
    );
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
  };

  const handleReturnConfirm = () => {
    const updatedOrders = JSON.parse(localStorage.getItem("orders") || "[]").map((o: Order) =>
      o.id === orderId
        ? { ...o, status: "returned" }
        : o
    );
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
    loadOrder();
    setShowReturnQR(false);
  };

  const pickupQRData = order ? JSON.stringify({
    orderId: order.id,
    lockerNumber: order.lockerNumber,
    action: "customer_pickup",
    deposit: 100,
    customer: order.studentName,
    timestamp: new Date().toISOString(),
  }) : "";

  const returnQRData = order ? JSON.stringify({
    orderId: order.id,
    lockerNumber: order.lockerNumber,
    action: "customer_return",
    returnDeposit: 100,
    customer: order.studentName,
    timestamp: new Date().toISOString(),
  }) : "";

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/customer")}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl">訂單追蹤</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col items-center justify-center mb-6">
            {order.status === "pending" && (
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-orange-600 animate-pulse" />
                </div>
                <h2 className="text-2xl mb-2">等待外送員接取</h2>
                <p className="text-gray-600">您的訂單已提交，請稍候</p>
              </div>
            )}
            {order.status === "accepted" && (
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-10 h-10 text-blue-600 animate-pulse" />
                </div>
                <h2 className="text-2xl mb-2">外送員配送中</h2>
                <p className="text-gray-600">正在前往餐盒櫃</p>
              </div>
            )}
            {order.status === "in_locker" && !depositPaid && (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl mb-2">✓ 訂單已送達</h2>
                <p className="text-gray-600 mb-1">您的餐點已放入 {order.lockerNumber} 號櫃</p>
                <p className="text-sm text-gray-500">請支付押金100元以取餐</p>
              </div>
            )}
            {order.status === "in_locker" && depositPaid && (
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-10 h-10 text-purple-600" />
                </div>
                <h2 className="text-2xl mb-2">請掃描開櫃</h2>
                <p className="text-gray-600">使用下方 QR Code 開啟櫃子</p>
              </div>
            )}
            {order.status === "picked_up" && !returnDepositPaid && (
              <div className="text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-yellow-600" />
                </div>
                <h2 className="text-2xl mb-2">用餐中</h2>
                <p className="text-gray-600">請於用餐完畢後歸還餐具</p>
              </div>
            )}
            {order.status === "picked_up" && returnDepositPaid && (
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-10 h-10 text-purple-600" />
                </div>
                <h2 className="text-2xl mb-2">請掃描開櫃歸還</h2>
                <p className="text-gray-600">使用下方 QR Code 開啟 {order.lockerNumber} 號櫃</p>
              </div>
            )}
            {order.status === "returned" && (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl mb-2">歸還完成</h2>
                <p className="text-gray-600">押金已退還，感謝使用</p>
              </div>
            )}
            {order.status === "completed" && (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl mb-2">訂單完成</h2>
                <p className="text-gray-600">感謝您使用我們的服務</p>
              </div>
            )}
          </div>

          <div className="border-t pt-6 space-y-4">
            <div>
              <h3 className="text-sm text-gray-600 mb-2">訂單編號</h3>
              <p className="font-mono text-sm bg-gray-50 px-3 py-2 rounded">{order.id}</p>
            </div>

            {order.lockerNumber && (
              <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
                <h3 className="text-sm text-gray-600 mb-2">櫃子編號</h3>
                <p className="text-3xl font-bold text-blue-600">{order.lockerNumber}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  姓名
                </h3>
                <p>{order.studentName}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  電話
                </h3>
                <p>{order.phone}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm text-gray-600 mb-2">餐點內容</h3>
              <div className="flex flex-wrap gap-2">
                {order.items.map((item, idx) => (
                  <span key={idx} className="bg-blue-50 px-3 py-1 rounded-full text-sm">
                    {item.name} × {item.count}
                  </span>
                ))}
              </div>
            </div>

            {order.deliveryPerson && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  外送員
                </h3>
                <p className="text-lg">{order.deliveryPerson}</p>
              </div>
            )}

            {(order.deposit || order.returnDeposit) && (
              <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4">
                <h3 className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  押金狀態
                </h3>
                {order.deposit && <p className="text-sm">✓ 取餐押金：NT$ 100</p>}
                {order.returnDeposit && <p className="text-sm">✓ 歸還押金：NT$ 100</p>}
                {order.status === "returned" && (
                  <p className="text-sm text-green-600 mt-2">✓ 押金已全數退還 NT$ {(order.deposit || 0) + (order.returnDeposit || 0)}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 取餐押金和 QR Code */}
        {order.status === "in_locker" && !depositPaid && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl mb-4 text-center">支付取餐押金</h2>
            <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4 mb-4">
              <p className="text-center text-lg mb-2">押金金額：<span className="text-2xl font-bold text-yellow-700">NT$ 100</span></p>
              <p className="text-sm text-gray-600 text-center">歸還餐具後將全額退還</p>
            </div>
            <button
              onClick={handlePayDeposit}
              className="w-full bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 transition-colors text-lg font-semibold"
            >
              支付押金並取餐
            </button>
          </div>
        )}

        {showPickupQR && order.status === "in_locker" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-4 border-green-500">
            <h2 className="text-xl mb-4 text-center font-bold">取餐 QR Code</h2>
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3 mb-4 text-center">
              <p className="text-green-700 font-semibold">掃描此碼開啟 {order.lockerNumber} 號櫃</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white p-6 rounded-xl shadow-md mb-4">
                <QRCodeSVG value={pickupQRData} size={250} />
              </div>
              <button
                onClick={handlePickupConfirm}
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors mb-2"
              >
                已取餐（測試用）
              </button>
              <p className="text-xs text-gray-500 text-center">實際使用時，櫃子會自動確認</p>
            </div>
          </div>
        )}

        {/* 歸還餐具押金和 QR Code */}
        {order.status === "picked_up" && !returnDepositPaid && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl mb-4 text-center">歸還餐具</h2>
            <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4 mb-4">
              <p className="text-center text-lg mb-2">歸還押金：<span className="text-2xl font-bold text-yellow-700">NT$ 100</span></p>
              <p className="text-sm text-gray-600 text-center mb-2">請將餐具放回 {order.lockerNumber} 號櫃</p>
              <p className="text-xs text-red-600 text-center">⚠️ 必須放回原櫃子才能完成歸還</p>
            </div>
            <button
              onClick={handlePayReturnDeposit}
              className="w-full bg-purple-600 text-white py-4 rounded-xl hover:bg-purple-700 transition-colors text-lg font-semibold"
            >
              支付押金並歸還餐具
            </button>
          </div>
        )}

        {showReturnQR && order.status === "picked_up" && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-4 border-purple-500">
            <h2 className="text-xl mb-4 text-center font-bold">歸還 QR Code</h2>
            <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-3 mb-4 text-center">
              <p className="text-purple-700 font-semibold">掃描此碼開啟 {order.lockerNumber} 號櫃歸還</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white p-6 rounded-xl shadow-md mb-4">
                <QRCodeSVG value={returnQRData} size={250} />
              </div>
              <button
                onClick={handleReturnConfirm}
                className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors mb-2"
              >
                已歸還（測試用）
              </button>
              <p className="text-xs text-gray-500 text-center">實際使用時，櫃子會自動確認並退還押金</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-3 h-3 rounded-full ${order.status === "pending" ? "bg-orange-500 animate-pulse" : "bg-orange-500"}`}></div>
          <div className="w-12 h-1 bg-gray-300"></div>
          <div className={`w-3 h-3 rounded-full ${order.status === "accepted" ? "bg-blue-500 animate-pulse" : ["in_locker", "picked_up", "returned", "completed"].includes(order.status) ? "bg-blue-500" : "bg-gray-300"}`}></div>
          <div className="w-12 h-1 bg-gray-300"></div>
          <div className={`w-3 h-3 rounded-full ${order.status === "in_locker" ? "bg-green-500 animate-pulse" : ["picked_up", "returned", "completed"].includes(order.status) ? "bg-green-500" : "bg-gray-300"}`}></div>
          <div className="w-12 h-1 bg-gray-300"></div>
          <div className={`w-3 h-3 rounded-full ${order.status === "picked_up" ? "bg-yellow-500 animate-pulse" : ["returned", "completed"].includes(order.status) ? "bg-yellow-500" : "bg-gray-300"}`}></div>
          <div className="w-12 h-1 bg-gray-300"></div>
          <div className={`w-3 h-3 rounded-full ${order.status === "returned" || order.status === "completed" ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}></div>
        </div>

        <div className="text-center text-sm text-gray-500">
          {order.status === "pending" && "頁面會自動更新訂單狀態"}
          {order.status === "accepted" && "外送員正在配送中"}
          {order.status === "in_locker" && !depositPaid && "請支付押金以取餐"}
          {order.status === "in_locker" && depositPaid && "請使用 QR Code 開櫃取餐"}
          {order.status === "picked_up" && !returnDepositPaid && "用餐完畢請歸還餐具"}
          {order.status === "picked_up" && returnDepositPaid && "請使用 QR Code 開櫃歸還"}
          {order.status === "returned" && "押金已退還，訂單完成"}
          {order.status === "completed" && "感謝使用，期待下次服務"}
        </div>
      </div>
    </div>
  );
}
