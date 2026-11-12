// Traffic-source attribution for affiliate sub-IDs.
//
// Networks that accept a sub-ID report it next to each commission, so tagging a
// click with where the visitor came from (and which ad) lets a sale be traced
// back to Facebook, search or a specific ad.

import { getGoLinkSlug, getLinkDestination, isAffiliateLink } from '@/lib/links';

const STORAGE_KEY = 'ba-attribution';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

type Attribution = { src: string; ad?: string; at: number };

function clean(value: string, max: number): string {
  return value.replace(/[^A-Za-z0-9_-]/g, '').slice(0, max);
}

function readStored(): Attribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    return Date.now() - parsed.at < MAX_AGE_MS ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Records the visit's source on page load. A visit with campaign parameters
 * or a search referrer replaces the stored source; a direct visit keeps the
 * last one for 30 days, matching typical affiliate cookie windows.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source')?.toLowerCase() ?? '';
  let next: Attribution | null = null;

  if (params.has('fbclid') || /^(facebook|fb|ig|instagram|meta)$/.test(utmSource)) {
    const ad = params.get('utm_content');
    next = { src: 'fb', ad: ad && /^\d+$/.test(ad) ? ad : undefined, at: Date.now() };
  } else if (params.has('rdt_cid') || utmSource === 'reddit') {
    // utm_content carries Reddit's {{AD_ID}} macro. A macro Reddit didn't
    // fill in arrives as literal text with no digits, so it's dropped.
    const ad = clean(params.get('utm_content') ?? '', 24);
    next = { src: 'reddit', ad: /\d/.test(ad) ? ad : undefined, at: Date.now() };
  } else if (params.has('gclid') || utmSource === 'google') {
    next = { src: 'gads', at: Date.now() };
  } else if (utmSource) {
    next = { src: clean(utmSource, 12) || 'utm', at: Date.now() };
  } else {
    try {
      const ref = document.referrer ? new URL(document.referrer).hostname : '';
      if (/(^|\.)(google|bing|duckduckgo|yahoo)\./.test(ref)) next = { src: 'seo', at: Date.now() };
    } catch {}
  }

  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

/** Where the current visitor came from: fb, reddit, seo, gads, a utm_source, or direct. */
export function getTrafficSource(): string {
  return readStored()?.src ?? 'direct';
}

/** The Facebook or Reddit ad the visitor clicked, or '(none)'. */
export function getAdId(): string {
  return readStored()?.ad ?? '(none)';
}

/** Short, network-safe location codes so the sub-ID stays readable in reports. */
function shortLocation(location: string): string {
  return location
    .replace(/^results_card_rank_(\d)(?:_(\w+))?$/, (_, n, part) => `res${n}${part ? part[0] : ''}`)
    .replace(/^quiz_guide_/, 'guide-')
    .replace(/^promo_pill_/, 'pill-')
    .replace(/^quiz_promo_menu$/, 'menu');
}

/** e.g. "fb-52560751550737-res1" or "seo-guide-shape". */
export function buildSubId(location: string): string {
  const stored = readStored();
  const parts = [stored?.src ?? 'direct', stored?.ad, clean(shortLocation(location), 32)];
  return parts.filter(Boolean).join('-').slice(0, 64);
}

export type OutboundInfo = { merchant: string; affiliate: boolean; domain: string };

const MERCHANT_HOSTS: Array<[RegExp, string]> = [
  [/(^|\.)vulyplay\.com$/, 'Vuly'],
  [/(^|\.)webandwarehouse\.com\.au$/, 'Web and Warehouse'],
  [/(^|\.)lifespankids\.com\.au$/, 'Lifespan Kids'],
  [/(^|\.)cfjump\.com$/, 'Springfree'],
  [/(^|\.)springfreetrampoline\.com\.au$/, 'Springfree'],
  [/(^|\.)jumpflex\.com\.au$/, 'Jumpflex'],
  [/(^|\.)bunnings\.com\.au$/, 'Bunnings'],
  [/(^|\.)klika\.com\.au$/, 'Klika'],
];

function isAffiliateUrl(url: URL): boolean {
  const host = url.hostname.replace(/^www\./, '');
  if (host === 'vulyplay.com') return /^\/aff\//.test(url.pathname);
  if (host === 'webandwarehouse.com.au') return url.searchParams.has('tracking');
  if (host === 'lifespankids.com.au') return url.searchParams.has('rfsn');
  return host === 't.cfjump.com';
}

/**
 * Names the merchant behind a link and whether it pays. /go/ links are read
 * from the link table; raw URLs from their host and tracking parameter.
 */
export function classifyOutbound(href: string): OutboundInfo | null {
  let url: URL;
  try {
    url = new URL(href, window.location.origin);
  } catch {
    return null;
  }

  const slug = url.origin === window.location.origin ? getGoLinkSlug(url.pathname) : null;
  if (url.origin === window.location.origin && !slug) return null;
  if (!/^https?:$/.test(url.protocol)) return null;

  let target = url;
  if (slug) {
    const destination = getLinkDestination(slug);
    // Springfree guide slugs redirect in proxy.ts and are not in the link table.
    if (!destination && isAffiliateLink(slug)) {
      return { merchant: 'Springfree', affiliate: true, domain: 'springfreetrampoline.com.au' };
    }
    try {
      if (destination) target = new URL(destination);
    } catch {}
  }

  const host = target.hostname.replace(/^www\./, '');
  const merchant = MERCHANT_HOSTS.find(([pattern]) => pattern.test(host))?.[1] ?? host;
  const affiliate = slug ? isAffiliateLink(slug) : isAffiliateUrl(target);
  return { merchant, affiliate, domain: host };
}

/**
 * Adds the sub-ID in the parameter each network reads. /go/ links pass it to
 * the redirect, which adds it to the Commission Factory link. Vuly and Web and
 * Warehouse run their own tracking with no documented sub-ID, so they are left alone.
 */
export function withSubId(href: string, subId: string): string {
  let url: URL;
  try {
    url = new URL(href, window.location.origin);
  } catch {
    return href;
  }
  const host = url.hostname.replace(/^www\./, '');

  if (url.origin === window.location.origin && getGoLinkSlug(url.pathname)) {
    url.searchParams.set('sid', subId);
  } else if (host === 't.cfjump.com') {
    url.searchParams.set('UniqueId', subId);
  } else if (host === 'lifespankids.com.au' && url.searchParams.has('rfsn')) {
    url.searchParams.set('subid', subId);
  } else {
    return href;
  }
  return url.toString();
}
