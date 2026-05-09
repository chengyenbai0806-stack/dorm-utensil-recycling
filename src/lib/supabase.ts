import { createClient } from '@supabase/supabase-js';

// 讀取環境變數
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 增加防呆檢查：如果變數不存在，在控制台印出警告
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ 錯誤：找不到 Supabase 環境變數。\n" +
    "請確認專案根目錄下的 .env.local 檔案包含：\n" +
    "NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

// 匯出實例（如果變數為空，則傳入空字串避免 crash，但會觸發你之前看到的驗證錯誤）
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);