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

export type SupersededPostRedirect = {
  sourceSlug: string;
  destinationSlug: string;
};

/**
 * Older articles whose slugs differ from the comparison page that replaces them.
 * These are kept explicit so we only consolidate genuinely equivalent content.
 */
const EXPLICIT_REPLACEMENTS: SupersededPostRedirect[] = [
  {
    sourceSlug: 'vuly-flare-vs-ultra-2-we-asked-vuly',
    destinationSlug: 'vuly-flare-vs-ultra-2',
  },
  {
    sourceSlug: 'vuly-ultra-2-vs-ultra-2-pro-is-the-upgrade-worth-it',
    destinationSlug: 'vuly-ultra-2-vs-ultra-2-pro',
  },
  {
    sourceSlug: 'vuly-ultra-2-vs-ultra-2-pro-tra',
    destinationSlug: 'vuly-ultra-2-vs-ultra-2-pro',
  },
];

function frontmatterValue(source: string, key: string): string | null {
  const match = source.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'));
  return match ? match[1].trim() : null;
}

function articleExists(slug: string): boolean {
  return BLOG_DIRS.some((dir) => fs.existsSync(path.join(CONTENT_DIR, dir, `${slug}.mdx`)));
}

/** Root-level articles and the published comparison pages that replace them. */
export function getSupersededPostRedirects(): SupersededPostRedirect[] {
  if (!fs.existsSync(COMPARE_DIR)) return [];

  const readyComparisonSlugs = new Set<string>();

  for (const file of fs.readdirSync(COMPARE_DIR)) {
    if (!file.endsWith('.mdx')) continue;

    const source = fs.readFileSync(path.join(COMPARE_DIR, file), 'utf8');
    if (frontmatterValue(source, 'publish_status') !== 'ready') continue;

    const slug = frontmatterValue(source, 'slug') ?? file.replace(/\.mdx$/, '');
    readyComparisonSlugs.add(slug);
  }

  const redirects = new Map<string, string>();

  for (const slug of readyComparisonSlugs) {
    if (articleExists(slug)) redirects.set(slug, slug);
  }

  for (const { sourceSlug, destinationSlug } of EXPLICIT_REPLACEMENTS) {
    if (articleExists(sourceSlug) && readyComparisonSlugs.has(destinationSlug)) {
      redirects.set(sourceSlug, destinationSlug);
    }
  }

  return [...redirects]
    .map(([sourceSlug, destinationSlug]) => ({ sourceSlug, destinationSlug }))
    .sort((a, b) => a.sourceSlug.localeCompare(b.sourceSlug));
}

/** Slugs whose root-level articles have been replaced by comparison pages. */
export function getSupersededSlugs(): string[] {
  return getSupersededPostRedirects().map(({ sourceSlug }) => sourceSlug);
}
