import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/lut',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
