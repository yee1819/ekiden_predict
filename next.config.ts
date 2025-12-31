import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "yee-1312555989.cos.ap-guangzhou.myqcloud.com",
      },
    ],
  },
};

export default nextConfig;
