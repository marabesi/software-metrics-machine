import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  compiler: {
    emotion: true,
  },
};

export default nextConfig;
