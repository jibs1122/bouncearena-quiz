import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/content';

const BASE = 'https://bouncearena.com.au';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/quiz/`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/reviews/`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/blog/`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/compare/`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/about/`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE}/contact/`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/privacy-policy/`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/terms-of-use/`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/earnings-disclaimer/`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE}/${post.slug}/`,
    lastModified: post.date ? new Date(post.date) : undefined,
    changeFrequency: 'monthly',
    priority: post.category === 'reviews' ? 0.8 : 0.7,
  }));

  return [...staticPages, ...postPages];
}
