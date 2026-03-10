import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: process.env.NODE_ENV === 'development', // Disable optimization in development for faster builds
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ttsvwbeuiqbidhcxufnx.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
