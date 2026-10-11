import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { TRAMPOLINES, type Trampoline } from '@/data/trampolines';
import { canonicalBrandName, getBrand, type BrandInfo } from '@/lib/brands';

export type ComparePageType = 'brand' | 'model';
export type PublishStatus = 'draft' | 'ready';

export type CompareModelKey = {
  model: string;
  size?: string;
};

export type CompareSide = {
  label: string;
  brand: string;
  models?: CompareModelKey[];
};

export type ComparePage = {
  title: string;
  slug: string;
  type: ComparePageType;
  publishStatus: PublishStatus;
  date: string;
  updated: string | null;
  description: string;
  metaTitle: string | null;
  metaDescription: string | null;
  sides: [CompareSide, CompareSide];
  dataIssues: string[];
  assumptions: string[];
  related: string[];
  content: string;
};

export type ResolvedSide = CompareSide & {
  brandInfo: BrandInfo | null;
  rows: Trampoline[];
};

const COMPARE_DIR = path.join(process.cwd(), 'content', 'compare');

/** Drafts are visible on the dev server so a batch can be reviewed before publishing. */
const INCLUDE_DRAFTS = process.env.NODE_ENV === 'development';

function parseSide(raw: unknown, file: string, index: number): CompareSide {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`${file}: sides[${index}] must be an object`);
  }

  const side = raw as Record<string, unknown>;
  const label = typeof side.label === 'string' ? side.label.trim() : '';
  const brand = typeof side.brand === 'string' ? side.brand.trim() : '';

  if (!label) throw new Error(`${file}: sides[${index}].label is required`);
  if (!brand) throw new Error(`${file}: sides[${index}].brand is required`);

  const models = Array.isArray(side.models)
    ? side.models.map((entry, modelIndex) => {
        if (typeof entry !== 'object' || entry === null) {
          throw new Error(`${file}: sides[${index}].models[${modelIndex}] must be an object`);
        }
        const model = (entry as Record<string, unknown>).model;
        const size = (entry as Record<string, unknown>).size;
        if (typeof model !== 'string' || !model.trim()) {
          throw new Error(`${file}: sides[${index}].models[${modelIndex}].model is required`);
        }
        return {
          model: model.trim(),
          ...(typeof size === 'string' && size.trim() ? { size: size.trim() } : {}),
        } satisfies CompareModelKey;
      })
    : undefined;

  return { label, brand: canonicalBrandName(brand), ...(models ? { models } : {}) };
}

function parseFile(filename: string): ComparePage {
  const raw = fs.readFileSync(path.join(COMPARE_DIR, filename), 'utf8');
  const { data, content } = matter(raw);

  const slug = typeof data.slug === 'string' ? data.slug : filename.replace(/\.mdx$/, '');
  const type = data.type === 'brand' || data.type === 'model' ? data.type : null;
  if (!type) throw new Error(`${filename}: type must be "brand" or "model"`);

  const publishStatus =
    data.publish_status === 'ready' || data.publish_status === 'draft' ? data.publish_status : null;
  if (!publishStatus) throw new Error(`${filename}: publish_status must be "draft" or "ready"`);

  if (!Array.isArray(data.sides) || data.sides.length !== 2) {
    throw new Error(`${filename}: exactly 2 sides are required`);
  }

  const sides = data.sides.map((side, index) => parseSide(side, filename, index)) as [
    CompareSide,
    CompareSide,
  ];

  for (const side of sides) {
    if (type === 'model' && !side.models?.length) {
      throw new Error(`${filename}: model comparisons need a models list on every side`);
    }
    if (type === 'brand' && side.models?.length) {
      throw new Error(`${filename}: brand comparisons must not list models`);
    }
  }

  const seo = (typeof data.seo === 'object' && data.seo !== null ? data.seo : {}) as Record<string, unknown>;

  return {
    title: typeof data.title === 'string' ? data.title : '',
    slug,
    type,
    publishStatus,
    date: typeof data.date === 'string' ? data.date : '',
    updated: typeof data.updated === 'string' ? data.updated : null,
    description: typeof data.description === 'string' ? data.description : '',
    metaTitle: typeof seo.meta_title === 'string' ? seo.meta_title : null,
    metaDescription: typeof seo.meta_description === 'string' ? seo.meta_description : null,
    sides,
    dataIssues: Array.isArray(data.data_issues) ? data.data_issues.map(String) : [],
    assumptions: Array.isArray(data.assumptions) ? data.assumptions.map(String) : [],
    related: Array.isArray(data.related) ? data.related.map(String) : [],
    content,
  };
}

function readAll(): ComparePage[] {
  if (!fs.existsSync(COMPARE_DIR)) return [];

  return fs
    .readdirSync(COMPARE_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .map(parseFile)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function isPublishable(page: ComparePage): boolean {
  return page.publishStatus === 'ready' || INCLUDE_DRAFTS;
}

/** Pages that should build, appear in the hub, and enter the sitemap. */
export function getComparePages(): ComparePage[] {
  return readAll().filter(isPublishable);
}

/** Every file on disk regardless of publish status — for validation and tooling. */
export function getAllComparePages(): ComparePage[] {
  return readAll();
}

export function getComparePage(slug: string): ComparePage | null {
  return getComparePages().find((page) => page.slug === slug) ?? null;
}

function matchesModelKey(row: Trampoline, key: CompareModelKey): boolean {
  if (row.model.toLowerCase() !== key.model.toLowerCase()) return false;
  if (!key.size) return true;
  return row.size.toLowerCase() === key.size.toLowerCase();
}

/**
 * Resolves a side to its spec rows using stable brand/model/size keys. Throws on a
 * miss so a renamed model fails the build instead of silently emptying a page.
 */
export function resolveSideRows(side: CompareSide): Trampoline[] {
  const brand = canonicalBrandName(side.brand);
  const brandRows = TRAMPOLINES.filter((row) => row.brand === brand);

  if (brandRows.length === 0) {
    throw new Error(`No rows in data/trampolines.ts for brand "${side.brand}"`);
  }

  if (!side.models?.length) return brandRows;

  const rows: Trampoline[] = [];
  for (const key of side.models) {
    const matches = brandRows.filter((row) => matchesModelKey(row, key));
    if (matches.length === 0) {
      const size = key.size ? ` (size "${key.size}")` : '';
      throw new Error(`No rows in data/trampolines.ts for "${brand} ${key.model}"${size}`);
    }
    rows.push(...matches);
  }

  return rows;
}

export function resolveSide(side: CompareSide): ResolvedSide {
  return {
    ...side,
    brandInfo: getBrand(side.brand),
    rows: resolveSideRows(side),
  };
}

export function resolveSides(page: ComparePage): [ResolvedSide, ResolvedSide] {
  return [resolveSide(page.sides[0]), resolveSide(page.sides[1])];
}

export function comparePageBrands(page: ComparePage): string[] {
  return [...new Set(page.sides.map((side) => canonicalBrandName(side.brand)))];
}

/** Stable per-pair number, so equally related pages are not all picked in file order. */
function pairOrder(a: string, b: string): number {
  let hash = 2166136261;
  for (const char of `${a}|${b}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Comparisons ranked by how closely they match a set of brands: the same brand
 * pairing first, then pages sharing a brand, then the rest (score 0). A shared brand
 * that few pages cover counts for more, so a BERG page links to the other BERG pages
 * rather than losing them among dozens of Springfree ones. Ties are ordered per
 * `key` rather than by file order, which used to send every Vuly page's links to the
 * same six siblings and leave 17 comparisons with no links from the others.
 */
function rankByBrands(
  key: string,
  brands: string[],
  type?: ComparePageType,
): { page: ComparePage; score: number }[] {
  const wanted = new Set(brands.map(canonicalBrandName));
  const pages = getComparePages();

  const pagesPerBrand = new Map<string, number>();
  for (const page of pages) {
    for (const brand of comparePageBrands(page)) {
      pagesPerBrand.set(brand, (pagesPerBrand.get(brand) ?? 0) + 1);
    }
  }

  return pages
    .map((page) => {
      const pageBrands = comparePageBrands(page);
      const shared = pageBrands.filter((brand) => wanted.has(brand));
      if (shared.length === 0) return { page, score: 0, order: pairOrder(key, page.slug) };

      const sameBrands = shared.length === pageBrands.length && shared.length === wanted.size;
      const score =
        shared.reduce((sum, brand) => sum + 2 + 4 / pagesPerBrand.get(brand)!, 0) +
        (sameBrands ? 2 : 0) +
        (page.type === type ? 0.5 : 0);
      return { page, score, order: pairOrder(key, page.slug) };
    })
    .sort((a, b) => b.score - a.score || a.order - b.order);
}

/** Sibling comparisons for the end of a comparison page, closest first. */
export function getRelatedComparisons(slug: string, brands: string[], max = 6): ComparePage[] {
  return rankByBrands(slug, brands, getComparePage(slug)?.type)
    .filter(({ page }) => page.slug !== slug)
    .slice(0, max)
    .map(({ page }) => page);
}

function mentionCount(text: string, brand: string): number {
  const pattern = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
  return text.match(new RegExp(`\\b${pattern}\\b`, 'gi'))?.length ?? 0;
}

/**
 * Comparisons for the end of an article: those covering the brands in its title, or
 * failing that the two brands its body mentions most. An article that names no
 * compared brand gets none rather than an unrelated list.
 */
export function getComparisonsForArticle(
  slug: string,
  title: string,
  content: string,
  max = 4,
): ComparePage[] {
  const compared = [...new Set(getComparePages().flatMap(comparePageBrands))];
  let brands = compared.filter((brand) => mentionCount(title, brand) > 0);

  if (brands.length === 0) {
    brands = compared
      .map((brand) => ({ brand, mentions: mentionCount(content, brand) }))
      .filter(({ mentions }) => mentions >= 3)
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 2)
      .map(({ brand }) => brand);
  }
  if (brands.length === 0) return [];

  return rankByBrands(slug, brands)
    .filter(({ score }) => score > 0)
    .slice(0, max)
    .map(({ page }) => page);
}

export type ReviewLink = {
  slug: string;
  model: string;
  brand: string;
};

/**
 * Reviews of superseded models. The data sheet points some current models at the
 * review of their predecessor (Ultra 2 rows carry the original Ultra review), which
 * would send readers to a review of a trampoline that is no longer sold.
 */
const SUPERSEDED_MODEL_REVIEWS = new Set([
  'vuly-ultra-review',
  'vuly-thunder-review',
  'vuly-thunder-pro-review',
]);

/** Review links for the resolved rows. Most rows have none, so callers must handle that. */
export function getReviewLinks(rows: Trampoline[]): ReviewLink[] {
  const seen = new Map<string, ReviewLink>();

  for (const row of rows) {
    if (!row.reviewSlug || seen.has(row.reviewSlug)) continue;
    if (SUPERSEDED_MODEL_REVIEWS.has(row.reviewSlug)) continue;
    seen.set(row.reviewSlug, {
      slug: row.reviewSlug,
      model: row.model,
      brand: row.brand,
    });
  }

  return [...seen.values()];
}

export function comparePageHref(slug: string): string {
  return `/compare/${slug}/`;
}
