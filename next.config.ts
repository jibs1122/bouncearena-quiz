import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    qualities: [75, 85, 100],
  },
};

export default nextConfig;
