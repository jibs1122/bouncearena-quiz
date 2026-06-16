import type { NextConfig } from 'next';

const SPRINGFREE_AFFILIATE_URL = 'https://t.cfjump.com/59728/t/87128';

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    qualities: [75, 85, 100],
  },
  async redirects() {
    return [
      {
        source: '/go/springfree',
        destination: SPRINGFREE_AFFILIATE_URL,
        permanent: true,
      },
      {
        source: '/go/springfree/',
        destination: SPRINGFREE_AFFILIATE_URL,
        permanent: true,
      },
      {
        source: '/best-trampolines-australia',
        destination: '/best-trampolines-australia-2025',
        permanent: true,
      },
      {
        source: '/best-trampolines-australia/',
        destination: '/best-trampolines-australia-2025',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
