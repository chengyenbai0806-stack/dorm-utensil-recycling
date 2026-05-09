import { useState } from "react";
import { X, Camera } from "lucide-react";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [manualInput, setManualInput] = useState("");

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl">掃描訂單 QR Code</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-100 rounded-xl p-8 mb-4 flex flex-col items-center justify-center min-h-[200px]">
          <Camera className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-600 text-center text-sm">
            請使用手機攝像頭掃描外送員的 QR Code
          </p>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-gray-600 mb-2">或手動輸入訂單編號：</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="輸入訂單編號"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === "Enter" && handleManualSubmit()}
            />
            <button
              onClick={handleManualSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              確認
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
