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

/** Sibling comparisons that share at least one brand, most recent first. */
export function getRelatedComparisons(slug: string, brands: string[], max = 6): ComparePage[] {
  const wanted = new Set(brands.map(canonicalBrandName));

  return getComparePages()
    .filter((page) => page.slug !== slug)
    .filter((page) => comparePageBrands(page).some((brand) => wanted.has(brand)))
    .slice(0, max);
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
