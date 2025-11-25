/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // API route configuration
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
    serverActions: {
      bodySizeLimit: "50mb", // Increased for file uploads
    },
    // Increase body size limit for API routes with file uploads
    // This is critical for FormData parsing in production
    isrMemoryCacheSize: 0, // Disable ISR memory cache to save memory
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Allow server-side environment variables
  serverRuntimeConfig: {
    // Will be available on both server and client
  },

  // Disable image optimization (API-only backend)
  // images: {
  //   unoptimized: true,
  // },

  // TypeScript configuration
  // typescript: {
  //   // Ignore build errors during Docker builds (type checking should happen in CI/locally)
  //   ignoreBuildErrors: true,
  // },

  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Webpack configuration for handling binary files
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle certain modules on the server
      config.externals.push({
        "fluent-ffmpeg": "commonjs fluent-ffmpeg",
      });
    }
    return config;
  },
  // turbopack

  // Headers for CORS (if needed)
  async headers() {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: frontendUrl },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
