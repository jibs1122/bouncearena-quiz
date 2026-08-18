import type { NextConfig } from 'next';
import { getSupersededSlugs } from './lib/supersededPosts';

const SPRINGFREE_AFFILIATE_URL = 'https://t.cfjump.com/59728/t/87128';

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    qualities: [75, 85, 100],
  },
  async redirects() {
    return [
      {
        source: '/comparisons',
        destination: '/compare/',
        permanent: true,
      },
      {
        source: '/comparisons/',
        destination: '/compare/',
        permanent: true,
      },
      {
        source: '/category/comparisons',
        destination: '/compare/',
        permanent: true,
      },
      {
        source: '/category/comparisons/',
        destination: '/compare/',
        permanent: true,
      },
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
      // Articles replaced by a published comparison page at the same slug.
      ...getSupersededSlugs().flatMap((slug) => [
        { source: `/${slug}`, destination: `/compare/${slug}/`, permanent: true },
        { source: `/${slug}/`, destination: `/compare/${slug}/`, permanent: true },
      ]),
    ];
  },
};

export default nextConfig;
