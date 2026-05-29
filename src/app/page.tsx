"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function SystemTwoHomePage() {
  const router = useRouter();

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      minHeight: '100vh', backgroundColor: '#0f172a', color: '#ffffff', fontFamily: 'sans-serif', padding: '20px' 
    }}>
      <div style={{ 
        backgroundColor: '#1e293b', padding: '40px', borderRadius: '16px', textAlign: 'center', 
        maxWidth: '450px', width: '100%', border: '2px solid #334155', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' 
      }}>
        
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '10px', color: '#38bdf8' }}>
          🤖 智慧置物櫃機台端 (分流首頁)
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '35px' }}>
          前身外賣系統已完美轉化為惜食置物櫃雙端介面
        </p>

        {/* 核心賣方按鈕：精準導向 /delivery (借用原本外送端路由) */}
        <button 
          onClick={() => router.push('/delivery')} 
          style={{ 
            width: '100%', padding: '18px', backgroundColor: '#22c55e', color: 'white', 
            border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', 
            cursor: 'pointer', marginBottom: '16px', transition: 'all 0.2s',
            boxShadow: '0 4px 12px 0 rgba(34, 197, 94, 0.3)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#22c55e'}
        >
          👨‍🍳 進入【賣方進櫃介面】
        </button>

        {/* 核心買方按鈕：導向 /customer */}
        <button 
          onClick={() => router.push('/customer')} 
          style={{ 
            width: '100%', padding: '18px', backgroundColor: '#3b82f6', color: 'white', 
            border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', 
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 12px 0 rgba(59, 130, 246, 0.3)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          🛒 進入【顧客取貨介面】
        </button>

        <div style={{ marginTop: '30px', textAlign: 'left', backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
          💡 <strong>Demo 演示提醒：</strong><br/>
          • 點擊<strong>綠色按鈕</strong>前往 `/delivery` 處理賣家放貨。<br/>
          • 點擊<strong>藍色按鈕</strong>前往 `/customer` 處理買家取餐。
        </div>

      </div>
    </div>
  );
}