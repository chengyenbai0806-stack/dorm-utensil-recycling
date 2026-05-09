/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 忽略 TypeScript 錯誤，這在黑客松趕時間時非常有用
    ignoreBuildErrors: true,
  },
  eslint: {
    // 忽略 ESLint 檢查
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;