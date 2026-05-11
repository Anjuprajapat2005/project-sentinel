/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sentinel/shared'],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
