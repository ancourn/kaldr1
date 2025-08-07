import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
<<<<<<< HEAD
=======
<<<<<<< HEAD
  // Disable Next.js hot reload, handled by nodemon
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable webpack's hot module replacement
      config.watchOptions = {
        ignored: ['**/*'], // Ignore all file changes
=======
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
  // 禁用 Next.js 热重载，由 nodemon 处理重编译
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      // 禁用 webpack 的热模块替换
      config.watchOptions = {
        ignored: ['**/*'], // 忽略所有文件变化
<<<<<<< HEAD
=======
>>>>>>> 825fb317ac2b476898191ee36891ce92b0ff27ca
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
      };
    }
    return config;
  },
  eslint: {
<<<<<<< HEAD
    // 构建时忽略ESLint错误
=======
<<<<<<< HEAD
    // Ignore ESLint errors during build
=======
    // 构建时忽略ESLint错误
>>>>>>> 825fb317ac2b476898191ee36891ce92b0ff27ca
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
