import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    qualities: [75, 85, 100],
  },
  async redirects() {
    return [
      { source: '/quiz-questions', destination: '/quiz', permanent: true },
      { source: '/quiz-questions-usa', destination: '/quiz', permanent: true },
      // Category URL rewrites — old WordPress URLs
      { source: '/category/reviews', destination: '/reviews', permanent: true },
      { source: '/category/reviews/', destination: '/reviews/', permanent: true },
      { source: '/category/blog', destination: '/blog', permanent: true },
      { source: '/category/blog/', destination: '/blog/', permanent: true },
      { source: '/category/comparisons', destination: '/comparisons', permanent: true },
      { source: '/category/comparisons/', destination: '/comparisons/', permanent: true },
      { source: '/category/:cat/page/:n', destination: '/blog', permanent: true },
      { source: '/author/:slug*', destination: '/', permanent: true },
      { source: '/wp-admin', destination: '/', permanent: false },
      { source: '/wp-admin/:path*', destination: '/', permanent: false },
      { source: '/wp-login.php', destination: '/', permanent: false },
      { source: '/wp-json/:path*', destination: '/', permanent: false },
      { source: '/xmlrpc.php', destination: '/', permanent: false },
      { source: '/feed', destination: '/', permanent: false },
      { source: '/feed/:path*', destination: '/', permanent: false },
      { source: '/comments/feed', destination: '/', permanent: false },
      { source: '/wp-content/:path*', destination: '/', permanent: false },
    ];
  },
};

export default nextConfig;
