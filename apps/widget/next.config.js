import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: [
    '@repo/video-player',
    '@repo/quiz-player',
    '@repo/interactive-podcast-player',
    '@repo/widget-api',
    '@repo/database',
    '@repo/types',
    '@repo/logging'
  ],
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
    optimizePackageImports: [
      "@heroicons/react",
      "react-icons",
      "framer-motion",
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "./"),
      "@/components": path.resolve(__dirname, "./components"),
      "@/pages": path.resolve(__dirname, "./app"),
      "@/hooks": path.resolve(__dirname, "./hooks"),
      "@/contexts": path.resolve(__dirname, "./contexts"),
      "@/utils": path.resolve(__dirname, "./utils"),
      "@/assets": path.resolve(__dirname, "./public/assets"),
      "@/types": path.resolve(__dirname, "./types"),
      "@/data": path.resolve(__dirname, "./public/_temp_data"),
      "@/styles": path.resolve(__dirname, "./app"),
    };
    return config;
  },
};

export default nextConfig;
