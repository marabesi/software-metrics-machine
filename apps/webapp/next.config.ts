import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  trailingSlash: true,
  compiler: {
    emotion: true,
  },
};

export default nextConfig;
