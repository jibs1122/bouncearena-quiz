import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getSupersededSlugs } from '@/lib/supersededPosts';
import { fillMonthYear } from '@/lib/monthYear';

export type Category = 'reviews' | 'comparisons' | 'blog';

export type PostMeta = {
  title: string;
  slug: string;
  date: string;
  category: Category;
  description: string;
  featuredImage: string;
};

/** A hand-picked related link: a post or compare slug, or an explicit href and label. */
export type RelatedEntry = string | { href: string; label: string };

export type Post = PostMeta & { content: string; related: RelatedEntry[] };

const CONTENT_DIR = path.join(process.cwd(), 'content');
const CATEGORIES: Category[] = ['reviews', 'comparisons', 'blog'];

function excludeSuperseded(posts: PostMeta[]): PostMeta[] {
  const superseded = new Set(getSupersededSlugs());
  return posts.filter((post) => !superseded.has(post.slug));
}

function readCategory(category: Category): PostMeta[] {
  const dir = path.join(CONTENT_DIR, category);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(dir, filename), 'utf8');
      const { data } = matter(raw);
      return {
        title: fillMonthYear(data.title ?? ''),
        slug: data.slug ?? filename.replace('.mdx', ''),
        date: data.date ?? '',
        category,
        description: fillMonthYear(data.description ?? ''),
        featuredImage: data.featuredImage ?? '',
      } satisfies PostMeta;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getAllPosts(): PostMeta[] {
  return excludeSuperseded(CATEGORIES.flatMap(readCategory)).sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

export function getPostsByCategory(category: Category): PostMeta[] {
  return excludeSuperseded(readCategory(category));
}

export function getPost(slug: string): Post | null {
  for (const category of CATEGORIES) {
    const filepath = path.join(CONTENT_DIR, category, `${slug}.mdx`);
    if (fs.existsSync(filepath)) {
      const raw = fs.readFileSync(filepath, 'utf8');
      const { data, content } = matter(raw);
      return {
        title: fillMonthYear(data.title ?? ''),
        slug: data.slug ?? slug,
        date: data.date ?? '',
        category: data.category ?? category,
        description: fillMonthYear(data.description ?? ''),
        featuredImage: data.featuredImage ?? '',
        content,
        related: Array.isArray(data.related) ? data.related : [],
      };
    }
  }
  return null;
}

export function getAllSlugs(): string[] {
  return CATEGORIES.flatMap((category) => {
    const dir = path.join(CONTENT_DIR, category);
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => f.replace('.mdx', ''));
  });
}

export function getRelatedPosts(slug: string, category: Category, count = 3): PostMeta[] {
  return excludeSuperseded(readCategory(category))
    .filter((p) => p.slug !== slug)
    .slice(0, count);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
}
