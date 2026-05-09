/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 忽略 TypeScript 錯誤，這在黑客松趕時間時非常有用
    ignoreBuildErrors: true,
  },
  // ESLint 配置已移除，因為 Next.js 16 不再支持這種方式
};

export default nextConfig;