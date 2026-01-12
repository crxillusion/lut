import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Set the base path if your repo name is not 'lut'
  // basePath: '/your-repo-name',
};

export default nextConfig;
