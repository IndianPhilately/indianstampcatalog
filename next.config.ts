import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dbrudrcwkaznsedphokb.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "indianstampcatalog.vercel.app",
        pathname: "/favicon.ico",
      },
    ],
  },
};

export default nextConfig;
