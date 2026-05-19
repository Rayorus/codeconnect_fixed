import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.leetcode.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  // Performance optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizeCss: false,
  },
};

export default nextConfig;
