"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

export default function SystemTwoDeliveryToSellerPage() {
  const router = useRouter();
  const [lockerData, setLockerData] = useState<any>(null);
  const [showQr, setShowQr] = useState<boolean>(false);

  const myLockerNo = "A-01";
  // 這裡的 role 保持叫 seller，讓手機端好辨認這是賣方進櫃流
  const fixedSellerQrValue = `https://save-food-app-homework-train.vercel.app/verify?locker=${myLockerNo}&role=seller`;

  const checkPendingStatus = useCallback(async () => {
    const { data } = await supabase
      .from('food_lockers')
      .select('*')
      .eq('locker_no', myLockerNo)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setLockerData(data);
      setShowQr(true);
    }
  }, []);

  useEffect(() => {
    checkPendingStatus();
    const interval = setInterval(checkPendingStatus, 3000);
    return () => clearInterval(interval);
  }, [checkPendingStatus]);

  const handleConfirm = async () => {
    if (lockerData) {
      await supabase
        .from('food_lockers')
        .update({ status: 'ACTIVE' })
        .eq('id', lockerData.id);
    }
    router.push('/'); 
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0f172a', color: '#ffffff', fontFamily: 'sans-serif', padding: '20px' }}>
      {!showQr ? (
        <div style={{ border: '2px dashed #22c55e', padding: '40px', borderRadius: '16px', textAlign: 'center', color: '#94a3b8' }}>
          <p style={{ fontSize: '20px', fontWeight: 'bold' }}>⏳ 【系統二 - 賣方櫃位介面】</p>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '10px' }}>正在等待系統一商家發布惜食商品...</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#1e293b', border: '4px solid #22c55e', padding: '30px', borderRadius: '16px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ color: '#22c55e', fontSize: '22px', margin: '0 0 15px 0' }}>👨‍🍳 賣方物資準備進櫃</h2>
          <p style={{ color: '#cbd5e1', fontSize: '14px' }}>商品：{lockerData?.title}</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', padding: '15px', backgroundColor: '#ffffff', borderRadius: '12px', margin: '20px 0' }}>
            <QRCodeSVG value={fixedSellerQrValue} size={180} />
          </div>
          
          <button 
            onClick={handleConfirm}
            style={{ width: '100%', padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
          >
            確認按鈕 (返回首頁)
          </button>
        </div>
      )}
    </div>
  );
}