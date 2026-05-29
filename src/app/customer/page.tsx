"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

export default function SystemTwoCustomerPage() {
  const router = useRouter();
  const [lockerData, setLockerData] = useState<any>(null);
  
  // 顧客端內部小狀態分流：2 代表顯示顧客二維碼與取貨鈕，3 代表跳到下一頁的已完成取餐
  const [customerStep, setCustomerStep] = useState<number>(2); 

  const myLockerNo = "A-01";
  const fixedBuyerQrValue = `https://save-food-app-homework-train.vercel.app/verify?locker=${myLockerNo}&role=buyer`;

  // 監聽：當狀態是在櫃架上 (ACTIVE) 且 顧客在系統一已經選購 (is_ordered: true)
  const checkOrderedStatus = useCallback(async () => {
    if (customerStep !== 2) return; // 如果已經去第3步完成頁了，就暫停監聽

    const { data } = await supabase
      .from('food_lockers')
      .select('*')
      .eq('locker_no', myLockerNo)
      .eq('status', 'ACTIVE')
      .eq('is_ordered', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setLockerData(data);
    }
  }, [customerStep]);

  useEffect(() => {
    checkOrderedStatus();
    const interval = setInterval(checkOrderedStatus, 3000);
    return () => clearInterval(interval);
  }, [checkOrderedStatus]);

  // 按下確認取餐：把狀態改為 COMPLETED，並重置回到首頁
  const handleFinalReset = async () => {
    if (lockerData) {
      await supabase
        .from('food_lockers')
        .update({ status: 'COMPLETED' })
        .eq('id', lockerData.id);
    }
    router.push('/'); // 回到系統二首頁
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0f172a', color: '#ffffff', fontFamily: 'sans-serif', padding: '20px' }}>
      
      {/* 步驟 2：顧客取貨主頁（等待購買訊號 vs 秀出固定碼） */}
      {customerStep === 2 && (
        !lockerData ? (
          <div style={{ border: '2px dashed #3b82f6', padding: '40px', borderRadius: '16px', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ fontSize: '20px', fontWeight: 'bold' }}>⏳ 【系統二 - 顧客取貨介面】</p>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '10px' }}>請先在系統一選擇物品並完成購買下單...</p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#1e293b', border: '4px solid #3b82f6', padding: '30px', borderRadius: '16px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
            <h2 style={{ color: '#3b82f6', fontSize: '22px', margin: '0 0 15px 0' }}>🛒 顧客請掃碼取貨</h2>
            <p style={{ color: '#cbd5e1', fontSize: '14px' }}>已購餐點：{lockerData.title}</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', padding: '15px', backgroundColor: '#ffffff', borderRadius: '12px', margin: '20px 0' }}>
              <QRCodeSVG value={fixedBuyerQrValue} size={180} />
            </div>
            
            {/* 按下取貨按鈕，跳到下一頁已完成取餐 */}
            <button 
              onClick={() => setCustomerStep(3)}
              style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
            >
              取貨按鈕
            </button>
          </div>
        )
      )}

      {/* 步驟 3：下一頁的【已完成取餐】頁面 */}
      {customerStep === 3 && (
        <div style={{ backgroundColor: '#1e293b', border: '4px solid #eab308', padding: '40px', borderRadius: '16px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ color: '#eab308', fontSize: '26px', margin: '0 0 15px 0' }}>🎉 已完成取餐</h2>
          <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '30px' }}>智慧置物櫃門已彈開，請拿取您的惜食商品。</p>
          
          {/* 按下確認取餐後回到首頁 */}
          <button 
            onClick={handleFinalReset}
            style={{ width: '100%', padding: '12px', backgroundColor: '#eab308', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
          >
            確認取餐 (回到首頁)
          </button>
        </div>
      )}

    </div>
  );
}