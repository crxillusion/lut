import type { NextConfig } from "next";

// Prefer an explicit base path (e.g. for GitHub Pages), fall back to empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
