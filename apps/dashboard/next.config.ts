import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@sentinel/shared'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;