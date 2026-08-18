import fs from 'fs';
import path from 'path';

/**
 * A comparison page supersedes a blog post when they share a slug. The handover is
 * driven entirely by publish_status: while the comparison page is a draft the old
 * article stays live and untouched, and the moment it flips to "ready" the old URL
 * redirects to it and drops out of the sitemap.
 *
 * This is deliberately plain fs/regex rather than gray-matter so next.config.ts can
 * use it without pulling the content pipeline into the config bundle.
 */

const CONTENT_DIR = path.join(process.cwd(), 'content');
const COMPARE_DIR = path.join(CONTENT_DIR, 'compare');
const BLOG_DIRS = ['blog', 'reviews', 'comparisons'];

function frontmatterValue(source: string, key: string): string | null {
  const match = source.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'));
  return match ? match[1].trim() : null;
}

function articleExists(slug: string): boolean {
  return BLOG_DIRS.some((dir) => fs.existsSync(path.join(CONTENT_DIR, dir, `${slug}.mdx`)));
}

/** Slugs whose root-level article has been replaced by a published comparison page. */
export function getSupersededSlugs(): string[] {
  if (!fs.existsSync(COMPARE_DIR)) return [];

  const slugs: string[] = [];

  for (const file of fs.readdirSync(COMPARE_DIR)) {
    if (!file.endsWith('.mdx')) continue;

    const source = fs.readFileSync(path.join(COMPARE_DIR, file), 'utf8');
    if (frontmatterValue(source, 'publish_status') !== 'ready') continue;

    const slug = frontmatterValue(source, 'slug') ?? file.replace(/\.mdx$/, '');
    if (articleExists(slug)) slugs.push(slug);
  }

  return slugs;
}
