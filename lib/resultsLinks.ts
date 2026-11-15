import { TRAMPOLINES } from '@/data/trampolines';
import { canonicalBrandName } from '@/lib/brands';
import { comparePageHref, getComparePages, getReviewLinks } from '@/lib/comparePages';
import { getPost, getPostsByCategory } from '@/lib/content';
import type { CompareSideKey, LinkItem, ResultsLinkIndex } from '@/lib/resultsLinksShared';
import { compareMatchers, trampolines } from '@/lib/trampolines';

/** Reviews older than this are left off the results page. */
const RECENT_REVIEW_FROM = '2025-01-01';

type VideoReview = LinkItem & { slug: string; date: string };

/** Recent reviews that carry a video, newest first. */
function recentVideoReviews(): VideoReview[] {
  return getPostsByCategory('reviews')
    .filter((meta) => meta.date >= RECENT_REVIEW_FROM)
    .filter((meta) => /youtu\.?be|<YouTubeEmbed/i.test(getPost(meta.slug)?.content ?? ''))
    .map((meta) => ({ slug: meta.slug, date: meta.date, href: `/${meta.slug}/`, title: meta.title }));
}

/**
 * Server-only: reads comparison pages and reviews from disk. The results page
 * links only to comparison pages and recent video reviews, not older articles.
 */
export function buildResultsLinkIndex(): ResultsLinkIndex {
  const compare = getComparePages().map((page) => ({
    href: comparePageHref(page.slug),
    title: page.title,
    sides: page.sides.map(
      (side): CompareSideKey => ({
        brand: canonicalBrandName(side.brand),
        models: side.models?.length ? side.models.map((key) => key.model.toLowerCase()) : null,
      }),
    ) as [CompareSideKey, CompareSideKey],
  }));

  const videoReviews = recentVideoReviews();
  // A review the data sheet ties to a model belongs to that model only. The
  // rest are owner reviews of a brand, matched by the brand named in the title.
  const modelReviewSlugs = new Set(TRAMPOLINES.flatMap((row) => (row.reviewSlug ? [row.reviewSlug] : [])));
  const brandReviews = videoReviews.filter((review) => !modelReviewSlugs.has(review.slug));

  const models: ResultsLinkIndex['models'] = {};
  for (const trampoline of trampolines) {
    const matcher = compareMatchers[trampoline.slug];
    if (!matcher) continue;

    const rows = TRAMPOLINES.filter(
      (row) =>
        row.brand === matcher.brand && row.model === matcher.model && (!matcher.size || row.size === matcher.size),
    );
    const brand = canonicalBrandName(matcher.brand);
    const tied = new Set(getReviewLinks(rows).map((link) => link.slug));
    const review =
      videoReviews.find((candidate) => tied.has(candidate.slug)) ??
      brandReviews.find((candidate) => candidate.title.toLowerCase().includes(brand.toLowerCase()));

    models[trampoline.slug] = {
      brand,
      model: matcher.model,
      review: review ? { href: review.href, title: review.title } : undefined,
    };
  }

  return {
    compare,
    models,
  };
}
