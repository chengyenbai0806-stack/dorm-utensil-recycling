import { useNavigate } from "react-router";
import { UtensilsCrossed, Truck } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl mb-4">宿舍餐具回收平台</h1>
          <p className="text-gray-600">選擇您的角色開始使用</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate("/customer")}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <UtensilsCrossed className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl">我是顧客</h2>
              <p className="text-gray-600 text-center">預約餐具回收服務</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/delivery")}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Truck className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl">我是外送員</h2>
              <p className="text-gray-600 text-center">查看並接取回收訂單</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
