import type { NextConfig } from 'next';
import { getSupersededPostRedirects } from './lib/supersededPosts';

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
      // Retired WordPress URLs that have a clear equivalent in the current site.
      ...[
        {
          source: '/category/comparisons/page/:page(\\d+)',
          destination: '/compare/',
        },
        { source: '/quiz-questions', destination: '/quiz/' },
        { source: '/quiz-questions-usa', destination: '/quiz/' },
        {
          source: '/australian-trampoline-brands/feed',
          destination: '/australian-trampoline-brands/',
        },
        {
          source: '/vuly-trampoline-assembly/feed',
          destination: '/vuly-trampoline-assembly/',
        },
        { source: '/category/blog/feed', destination: '/blog/' },
        {
          source: '/springfree-trampoline-review/feed',
          destination: '/springfree-trampoline-review/',
        },
        { source: '/category/comparisons/feed', destination: '/compare/' },
        {
          source: '/best-trampolines-australia/feed',
          destination: '/best-trampolines-australia-2025/',
        },
      ].flatMap(({ source, destination }) => [
        { source, destination, permanent: true },
        { source: `${source}/`, destination, permanent: true },
      ]),
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
        destination: '/best-trampolines-australia-2025/',
        permanent: true,
      },
      {
        source: '/best-trampolines-australia/',
        destination: '/best-trampolines-australia-2025/',
        permanent: true,
      },
      {
        source: '/compare/lifespan-hyperjump-3-vs-hyperjump-4',
        destination: '/compare/lifespan-hyperjump-3-vs-bouncezone/',
        permanent: true,
      },
      {
        source: '/compare/lifespan-hyperjump-3-vs-hyperjump-4/',
        destination: '/compare/lifespan-hyperjump-3-vs-bouncezone/',
        permanent: true,
      },
      // Articles replaced by published comparison pages.
      ...getSupersededPostRedirects().flatMap(({ sourceSlug, destinationSlug }) => [
        {
          source: `/${sourceSlug}`,
          destination: `/compare/${destinationSlug}/`,
          permanent: true,
        },
        {
          source: `/${sourceSlug}/`,
          destination: `/compare/${destinationSlug}/`,
          permanent: true,
        },
      ]),
    ];
  },
};

export default nextConfig;
