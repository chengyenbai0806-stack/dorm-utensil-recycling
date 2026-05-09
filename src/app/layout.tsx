
import "../styles/globals.css"; // 或者是你 globals.css 實際存放的路徑
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>
        {/* 這裡會顯示你的 page.tsx 內容 */}
        {children}
      </body>
    </html>
  );
}