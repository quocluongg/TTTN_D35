import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Docker deployment
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn2.cellphones.com.vn',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn2.fptshop.com.vn',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
