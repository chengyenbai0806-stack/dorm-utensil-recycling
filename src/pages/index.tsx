import dynamic from 'next/dynamic';
import { Toaster } from "sonner";

// 使用 dynamic import 並禁用 SSR
// 這會解決 "document is not defined" 的問題
const ClientSideRouter = dynamic(
  async () => {
    const { RouterProvider } = await import("react-router");
    const { router } = await import("../app/routes");
    return () => <RouterProvider router={router} />;
  },
  { ssr: false }
);

export default function App() {
  return (
    <>
      <ClientSideRouter />
      <Toaster position="top-center" richColors />
    </>
  );
}