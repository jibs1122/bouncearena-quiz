import type { Trampoline } from '@/data/trampolines';
import { isRawLifespanAffiliateHref, links, type LinkSlug } from '@/lib/links';

/**
 * A goSlug can be used for tracked redirects, but only some of those slugs are
 * paid links. Limit `rel="sponsored"` to actual affiliate deals.
 */
export function isAffiliateRow(row: Trampoline): boolean {
  if (row.goSlug) return Boolean(links[row.goSlug as LinkSlug]?.affiliate);
  return Boolean(row.sourceUrl && isRawLifespanAffiliateHref(row.sourceUrl));
}

export function hasAffiliateLink(rows: Trampoline[]): boolean {
  return rows.some(isAffiliateRow);
}

export function outboundRel(isAffiliate: boolean): string {
  return isAffiliate
    ? 'nofollow noopener noreferrer sponsored'
    : 'noopener noreferrer';
}
