"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase'; // 對齊你的連線設定檔
import { QRCodeSVG } from 'qrcode.react';

interface LockerData {
  id: number;
  title: string;
  locker_no: string;
  status: string;
  is_ordered: boolean;
}

export default function TrackingContent() {
  const [lockerData, setLockerData] = useState<LockerData | null>(null);
  
  // 核心控制狀態（Step 流程分流）：
  // 0: 機台首頁(等待系統一發布) 
  // 1: 賣方端(系統一發布後，系統二跳出賣方固定二維碼 + 確認按鈕)
  // 2: 買方端(顧客在系統一購買後，系統二跳出顧客固定二維碼 + 取貨按鈕)
  // 3: 已完成取餐頁面(按下取貨後跳轉至此 + 確認取餐按鈕)
  const [step, setStep] = useState<number>(0);

  const myLockerNo = "A-01"; // 固定負責 A-01 櫃位
  
  // 依據你的技術需求：二維碼內容保持完全固定，網址直接死綁櫃號
  const fixedQrValue = `https://save-food-app-homework-train.vercel.app/verify?locker=${myLockerNo}`;

  // 核心動態讀取：系統二持續監聽後端資料庫的訊號變化
  const loadLockerStatus = useCallback(async () => {
    // 只有在首頁(0)或等待顧客購買(1之後)才自動監聽，避免打擾使用者正在操作的按鈕畫面
    if (step !== 0 && step !== 1) return;

    const { data, error } = await supabase
      .from('food_lockers') // 鎖定新隔離表
      .select('*')
      .eq('locker_no', myLockerNo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return;
    }

    setLockerData(data);

    // 狀態核心計算與分流
    if (data.status === 'PENDING' && step === 0) {
      // 功能 A：當系統一發布，系統二立刻讀取並秀出賣方二維碼畫面 (Step 1)
      setStep(1);
    } else if (data.status === 'ACTIVE' && data.is_ordered === true && step === 1) {
      // 功能 B：當顧客在系統一選擇我發布的物品購買後，系統二顧客端出現二維碼 (Step 2)
      setStep(2);
    }
  }, [step]);

  // 每 3 秒自動同步一次後端訊號
  useEffect(() => {
    loadLockerStatus();
    const interval = setInterval(loadLockerStatus, 3000);
    return () => clearInterval(interval);
  }, [loadLockerStatus]);

  // 更新後端狀態並進行畫面跳轉的控制函數
  const handleAction = async (nextStep: number, updateFields?: object) => {
    if (lockerData && updateFields) {
      // 同步變更後端欄位標籤，防止流程衝突
      await supabase
        .from('food_lockers')
        .update(updateFields)
        .eq('id', lockerData.id);
    }

    if (nextStep === 0) {
      // 返回首頁時，清除當前暫存資料
      setLockerData(null);
    }
    
    setStep(nextStep); // 執行跳轉
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      minHeight: '100vh', backgroundColor: '#0f172a', color: '#ffffff', fontFamily: 'sans-serif', padding: '20px' 
    }}>
      
      {/* ================= STEP 0: 系統二機台首頁 (等待訊號) ================= */}
      {step === 0 && (
        <div style={{ border: '2px dashed #475569', padding: '50px', borderRadius: '16px', textAlign: 'center', color: '#94a3b8' }}>
          <p style={{ fontSize: '22px', fontWeight: 'bold' }}>⏳ 智慧置物櫃 ({myLockerNo}) 待命首頁</p>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '10px' }}>正在即時監聽後端... 請至系統一發布物品</p>
        </div>
      )}

      {/* ================= STEP 1: 賣方端 (系統一發布後，秀出二維碼與確認按鈕) ================= */}
      {step === 1 && lockerData && (
        <div style={{ backgroundColor: '#1e293b', border: '4px solid #22c55e', padding: '30px', borderRadius: '16px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ color: '#22c55e', fontSize: '22px', margin: '0 0 10px 0' }}>👨‍🍳 賣方進櫃畫面</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>已偵測到系統一最新發布商品：<strong>{lockerData.title}</strong></p>
          
          {/* 固定二維碼 */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '15px', backgroundColor: '#ffffff', borderRadius: '12px', margin: '15px 0' }}>
            <QRCodeSVG value={fixedQrValue} size={180} />
          </div>
          
          {/* 按下確認按鈕後：將後端改為 ACTIVE 狀態（代表貨物已在櫃內），並返回首頁 */}
          <button 
            onClick={() => handleAction(0, { status: 'ACTIVE' })}
            style={{ width: '100%', padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', marginTop: '15px' }}
          >
            確認按鈕 (返回首頁)
          </button>
        </div>
      )}

      {/* ================= STEP 2: 買方顧客端 (顧客在系統一購買後，出現固定二維碼與取貨按鈕) ================= */}
      {step === 2 && lockerData && (
        <div style={{ backgroundColor: '#1e293b', border: '4px solid #3b82f6', padding: '30px', borderRadius: '16px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ color: '#3b82f6', fontSize: '22px', margin: '0 0 10px 0' }}>🛒 買方顧客端</h2>
          <p style={{ color: '#cbd5e1', fontSize: '15px' }}>偵測到顧客已在系統一選擇此物品購買</p>
          
          {/* 固定二維碼（保持固定不動） */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '15px', backgroundColor: '#ffffff', borderRadius: '12px', margin: '20px 0' }}>
            <QRCodeSVG value={fixedQrValue} size={180} />
          </div>
          
          {/* 當按下畫面上取貨按鈕時：會跳到下一頁的已完成取餐 (Step 3) */}
          <button 
            onClick={() => handleAction(3)} 
            style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
          >
            取貨按鈕
          </button>
        </div>
      )}

      {/* ================= STEP 3: 已完成取餐頁面 ================= */}
      {step === 3 && (
        <div style={{ backgroundColor: '#1e293b', border: '4px solid #eab308', padding: '40px', borderRadius: '16px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ color: '#eab308', fontSize: '26px', margin: '0 0 15px 0' }}>🎉 已完成取餐</h2>
          <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '30px' }}>實體櫃門已成功解鎖，請拿取您的物品。</p>
          
          {/* 按下確認取餐後：回到首頁 (Step 0) 並且將後端洗成 COMPLETED */}
          <button 
            onClick={() => handleAction(0, { status: 'COMPLETED' })} 
            style={{ width: '100%', padding: '12px', backgroundColor: '#eab308', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
          >
            確認取餐 (回到首頁)
          </button>
        </div>
      )}

    </div>
  );
}