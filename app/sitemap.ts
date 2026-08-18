import type { MetadataRoute } from 'next';
import { getAllBrands } from '@/lib/brands';
import { comparePageHref, getComparePages } from '@/lib/comparePages';
import { getAllPosts } from '@/lib/content';
import { getSupersededSlugs } from '@/lib/supersededPosts';

const BASE = 'https://bouncearena.com.au';

export default function sitemap(): MetadataRoute.Sitemap {
  // Articles replaced by a published comparison page now redirect, so they must not
  // stay in the sitemap.
  const superseded = new Set(getSupersededSlugs());
  const posts = getAllPosts().filter((post) => !superseded.has(post.slug));
  // Drafts are excluded: getComparePages only returns them on the dev server.
  const comparePages = getComparePages().filter((page) => page.publishStatus === 'ready');

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/quiz/`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/reviews/`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/blog/`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/compare/`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/models/`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/brands/`, changeFrequency: 'weekly', priority: 0.7 },
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

  const comparisonPages: MetadataRoute.Sitemap = comparePages.map((page) => ({
    url: `${BASE}${comparePageHref(page.slug)}`,
    lastModified: new Date(page.updated ?? page.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const brandPages: MetadataRoute.Sitemap = getAllBrands().map((brand) => ({
    url: `${BASE}/brands/${brand.slug}/`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...brandPages, ...postPages, ...comparisonPages];
}
