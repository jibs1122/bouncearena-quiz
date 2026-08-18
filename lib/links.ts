import type { Country } from '@/lib/geolocation';

export const SPRINGFREE_AFFILIATE_URL = 'https://t.cfjump.com/59728/t/87128';
export const SPRINGFREE_TRAMPOLINES_AFFILIATE_URL =
  'https://t.cfjump.com/59728/t/87128?Url=https%3a%2f%2fwww.springfreetrampoline.com.au%2fcollections%2ftrampolines';
export const SPRINGFREE_MEDIUM_ROUND_AFFILIATE_URL =
  'https://t.cfjump.com/59728/t/87128?Url=https%3a%2f%2fwww.springfreetrampoline.com.au%2fproducts%2fexclusive-round-bundles%3fvariant%3d52174104297840';

export type LinkSlug =
  // Vuly
  | 'vuly-thunder-2-pro'
  | 'vuly-thunder-2'
  | 'vuly-ultra-2-pro'
  | 'vuly-ultra-2'
  | 'vuly-flare'
  | 'vuly-safety-guide'
  | 'vuly-size-guide'
  | 'vuly-buying-guide'
  // Springfree
  | 'springfree'
  | 'springfree-trampolines'
  | 'springfree-mini-round'
  | 'springfree-compact-round'
  | 'springfree-medium-round'
  | 'springfree-jumbo-round'
  | 'springfree-compact-oval'
  | 'springfree-medium-oval'
  | 'springfree-large-oval'
  | 'springfree-jumbo-oval'
  | 'springfree-medium-square'
  | 'springfree-large-square'
  | 'springfree-jumbo-square'
  // Jumpflex
  | 'jumpflex-flex-10ft'
  | 'jumpflex-flex-12ft'
  | 'jumpflex-hero-10ft'
  | 'jumpflex-hero-12ft'
  | 'jumpflex-hero-14ft'
  | 'jumpflex-hero-15ft'
  | 'jumpflex-mega-14ft'
  | 'jumpflex-mega-17ft'
  | 'jumpflex-mega-19ft'
  // Lifespan Kids
  | 'lifespan-hyperjump-3-10ft'
  | 'lifespan-hyperjump-4-12ft'
  | 'lifespan-hyperjump-r-8x12'
  // Kahuna
  | 'kahuna-classic-12ft'
  | 'kahuna-blizzard-10ft'
  | 'kahuna-oval-10x15'
  // OZ Trampolines
  | 'oz-summit-8ft'
  | 'oz-summit-10ft'
  | 'oz-summit-12ft'
  | 'oz-summit-14ft'
  // GeeTramp
  | 'geetramp-curve'
  | 'geetramp-force-7x10'
  | 'geetramp-force-8x12'
  | 'geetramp-force-9x14'
  | 'geetramp-force-10x17'
  | 'geetramp-force-14x16'
  // ACON
  | 'acon-air-gen2'
  | 'acon-16-hd-10x17'
  | 'acon-x-10x17';

const VULY_LINK_SLUGS = [
  'vuly-thunder-2-pro',
  'vuly-thunder-2',
  'vuly-ultra-2-pro',
  'vuly-ultra-2',
  'vuly-flare',
  'vuly-safety-guide',
  'vuly-size-guide',
  'vuly-buying-guide',
] as const satisfies readonly LinkSlug[];

const VULY_LINK_SLUG_SET = new Set<string>(VULY_LINK_SLUGS);

const SPRINGFREE_LINK_SLUGS = [
  'springfree',
  'springfree-trampolines',
  'springfree-mini-round',
  'springfree-compact-round',
  'springfree-medium-round',
  'springfree-jumbo-round',
  'springfree-compact-oval',
  'springfree-medium-oval',
  'springfree-large-oval',
  'springfree-jumbo-oval',
  'springfree-medium-square',
  'springfree-large-square',
  'springfree-jumbo-square',
] as const satisfies readonly LinkSlug[];

const SPRINGFREE_LINK_SLUG_SET = new Set<string>(SPRINGFREE_LINK_SLUGS);

type VulyLinkSlug = (typeof VULY_LINK_SLUGS)[number];

type CountryDestination = {
  AU: string;
  US?: string;
};

type LinkConfig = {
  label: string;
  destination: string | CountryDestination;
  affiliate: boolean;
};

export const links: Record<LinkSlug, LinkConfig> = {
  // ─── Vuly (affiliate) ────────────────────────────────────────────────────────
  'vuly-flare': {
    label: 'Vuly Flare',
    affiliate: true,
    destination: {
      AU: 'https://www.vulyplay.com/aff/100/?url=trampoline/flare',
      US: 'https://www.vulyplay.com/aff/100/?url=trampoline/flare',
    },
  },
  'vuly-thunder-2-pro': {
    label: 'Vuly Thunder 2 Pro',
    affiliate: true,
    destination: {
      AU: 'https://www.vulyplay.com/aff/100/?url=trampoline/thunder-2-pro',
      US: 'https://www.vulyplay.com/aff/100/?url=trampoline/thunder-2-pro',
    },
  },
  'vuly-thunder-2': {
    label: 'Vuly Thunder 2',
    affiliate: true,
    destination: {
      AU: 'https://www.vulyplay.com/aff/100/?url=trampoline/thunder-2',
      US: 'https://www.vulyplay.com/aff/100/?url=trampoline/thunder-2',
    },
  },
  'vuly-ultra-2-pro': {
    label: 'Vuly Ultra 2 Pro',
    affiliate: true,
    destination: {
      AU: 'https://www.vulyplay.com/aff/100/?url=trampoline/ultra-2-pro',
      US: 'https://www.vulyplay.com/aff/100/?url=trampoline/ultra-2-pro',
    },
  },
  'vuly-ultra-2': {
    label: 'Vuly Ultra 2',
    affiliate: true,
    destination: {
      AU: 'https://www.vulyplay.com/aff/100/?url=trampoline/ultra-2',
      US: 'https://www.vulyplay.com/aff/100/?url=trampoline/ultra-2',
    },
  },
  'vuly-safety-guide': {
    label: 'Vuly safety guide',
    affiliate: true,
    destination: {
      AU: 'https://www.vulyplay.com/aff/100/?url=blog/trampoline-safety',
      US: 'https://www.vulyplay.com/aff/100/?url=blog/trampoline-safety',
    },
  },
  'vuly-size-guide': {
    label: 'Vuly trampoline size guide',
    affiliate: true,
    destination: {
      AU: 'https://www.vulyplay.com/aff/100/?url=blog/what-size-trampoline',
      US: 'https://www.vulyplay.com/aff/100/?url=blog/what-size-trampoline',
    },
  },
  'vuly-buying-guide': {
    label: 'Vuly buying guide',
    affiliate: true,
    destination: {
      AU: 'https://www.vulyplay.com/aff/100/?url=blog/trampoline-buying-guide',
      US: 'https://www.vulyplay.com/aff/100/?url=blog/trampoline-buying-guide',
    },
  },
  // ─── Springfree (affiliate, AU only) ─────────────────────────────────────────
  'springfree': {
    label: 'Springfree',
    affiliate: true,
    destination: { AU: SPRINGFREE_AFFILIATE_URL },
  },
  'springfree-trampolines': {
    label: 'Springfree Trampolines',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_AFFILIATE_URL },
  },
  'springfree-mini-round': {
    label: 'Springfree Mini Round',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_AFFILIATE_URL },
  },
  'springfree-compact-round': {
    label: 'Springfree Compact Round',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_AFFILIATE_URL },
  },
  'springfree-medium-round': {
    label: 'Springfree Medium Round',
    affiliate: true,
    destination: { AU: SPRINGFREE_MEDIUM_ROUND_AFFILIATE_URL },
  },
  'springfree-jumbo-round': {
    label: 'Springfree Jumbo Round',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_AFFILIATE_URL },
  },
  'springfree-compact-oval': {
    label: 'Springfree Compact Oval',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_AFFILIATE_URL },
  },
  'springfree-medium-oval': {
    label: 'Springfree Medium Oval',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_AFFILIATE_URL },
  },
  'springfree-large-oval': {
    label: 'Springfree Large Oval',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_AFFILIATE_URL },
  },
  'springfree-jumbo-oval': {
    label: 'Springfree Jumbo Oval',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_AFFILIATE_URL },
  },
  'springfree-medium-square': {
    label: 'Springfree Medium Square',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_AFFILIATE_URL },
  },
  'springfree-large-square': {
    label: 'Springfree Large Square',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_AFFILIATE_URL },
  },
  'springfree-jumbo-square': {
    label: 'Springfree Jumbo Square',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_AFFILIATE_URL },
  },
  // ─── Jumpflex (non-affiliate, AU only) ───────────────────────────────────────
  'jumpflex-flex-10ft': {
    label: 'Jumpflex Flex 10ft',
    affiliate: false,
    destination: { AU: 'https://www.jumpflex.com.au/products/flex-10ft-trampoline' },
  },
  'jumpflex-flex-12ft': {
    label: 'Jumpflex Flex 12ft',
    affiliate: false,
    destination: { AU: 'https://www.jumpflex.com.au/products/flex-12ft-trampoline' },
  },
  'jumpflex-hero-10ft': {
    label: 'Jumpflex Hero 10ft',
    affiliate: false,
    destination: { AU: 'https://www.jumpflex.com.au/products/hero-10ft-trampoline' },
  },
  'jumpflex-hero-12ft': {
    label: 'Jumpflex Hero 12ft',
    affiliate: false,
    destination: { AU: 'https://www.jumpflex.com.au/products/hero-12ft-trampoline' },
  },
  'jumpflex-hero-14ft': {
    label: 'Jumpflex Hero 14ft',
    affiliate: false,
    destination: { AU: 'https://www.jumpflex.com.au/products/hero-14ft-trampoline' },
  },
  'jumpflex-hero-15ft': {
    label: 'Jumpflex Hero 15ft',
    affiliate: false,
    destination: { AU: 'https://www.jumpflex.com.au/products/hero-15ft-trampoline' },
  },
  'jumpflex-mega-14ft': {
    label: 'Jumpflex MEGA 14ft',
    affiliate: false,
    destination: { AU: 'https://www.jumpflex.com.au/products/mega-14ft-trampoline' },
  },
  'jumpflex-mega-17ft': {
    label: 'Jumpflex MEGA 17ft',
    affiliate: false,
    destination: { AU: 'https://www.jumpflex.com.au/products/mega-17ft-trampoline' },
  },
  'jumpflex-mega-19ft': {
    label: 'Jumpflex MEGA 19ft',
    affiliate: false,
    destination: { AU: 'https://www.jumpflex.com.au/products/mega-19ft-trampoline' },
  },
  // ─── Lifespan Kids (non-affiliate, AU only) ───────────────────────────────
  'lifespan-hyperjump-3-10ft': {
    label: 'Lifespan HyperJump 3 Springless 10ft',
    affiliate: false,
    destination: { AU: 'https://www.lifespankids.com.au/collections/kids-springless-trampolines' },
  },
  'lifespan-hyperjump-4-12ft': {
    label: 'Lifespan HyperJump 4 Spring 12ft',
    affiliate: false,
    destination: { AU: 'https://www.lifespankids.com.au/collections/kids-trampolines' },
  },
  'lifespan-hyperjump-r-8x12': {
    label: 'Lifespan HyperJump R Rectangle 8x12',
    affiliate: false,
    destination: { AU: 'https://www.lifespankids.com.au/collections/kids-rectangle-trampolines' },
  },
  // ─── Kahuna (non-affiliate, AU only) ──────────────────────────────────────
  'kahuna-classic-12ft': {
    label: 'Kahuna Classic 12ft',
    affiliate: false,
    destination: { AU: 'https://www.klika.com.au/kahuna-12-ft-trampoline.html' },
  },
  'kahuna-blizzard-10ft': {
    label: 'Kahuna Blizzard 10ft',
    affiliate: false,
    destination: { AU: 'https://www.bunnings.com.au/brands/k/kahuna' },
  },
  'kahuna-oval-10x15': {
    label: 'Kahuna Oval 10x15',
    affiliate: false,
    destination: { AU: 'https://www.bunnings.com.au/brands/k/kahuna' },
  },
  // ─── OZ Trampolines (non-affiliate, AU only) ─────────────────────────────────
  'oz-summit-8ft': {
    label: 'OZ Summit 8ft',
    affiliate: false,
    destination: { AU: 'https://www.oztrampolines.com.au/trampolines/8ft-round-trampoline' },
  },
  'oz-summit-10ft': {
    label: 'OZ Summit 10ft',
    affiliate: false,
    destination: { AU: 'https://www.oztrampolines.com.au/trampolines/10ft-round-trampoline' },
  },
  'oz-summit-12ft': {
    label: 'OZ Summit 12ft',
    affiliate: false,
    destination: { AU: 'https://www.oztrampolines.com.au/trampolines/12ft-round-trampoline' },
  },
  'oz-summit-14ft': {
    label: 'OZ Summit 14ft',
    affiliate: false,
    destination: { AU: 'https://www.oztrampolines.com.au/trampolines/14ft-round-trampoline' },
  },
  // ─── GeeTramp (non-affiliate, AU only, via Web & Warehouse) ──────────────────
  'geetramp-curve': {
    label: 'GeeTramp Curve',
    affiliate: false,
    destination: { AU: 'https://webandwarehouse.com.au/products/geetramp-curve-10ft-round-trampoline-forest-green-12239' },
  },
  'geetramp-force-7x10': {
    label: 'GeeTramp Force 7x10',
    affiliate: false,
    destination: { AU: 'https://webandwarehouse.com.au/products/geetramp-force-7ft-x-10ft-rectangle-trampoline-12324' },
  },
  'geetramp-force-8x12': {
    label: 'GeeTramp Force 8x12',
    affiliate: false,
    destination: { AU: 'https://webandwarehouse.com.au/products/geetramp-force-8ft-x-12ft-rectangle-trampoline-10187' },
  },
  'geetramp-force-9x14': {
    label: 'GeeTramp Force 9x14',
    affiliate: false,
    destination: { AU: 'https://webandwarehouse.com.au/products/geetramp-force-9ft-x-14ft-rectangle-trampoline-black-edition-standard-10150' },
  },
  'geetramp-force-10x17': {
    label: 'GeeTramp Force 10x17',
    affiliate: false,
    destination: { AU: 'https://webandwarehouse.com.au/products/geetramp-force-10ft-x-17ft-rectangle-trampoline-black-edition-standard-11134' },
  },
  'geetramp-force-14x16': {
    label: 'GeeTramp Force 14x16',
    affiliate: false,
    destination: { AU: 'https://webandwarehouse.com.au/products/geetramp-force-14ft-x-16ft-rectangle-trampoline-black-edition-standard-12114' },
  },
  // ─── ACON (non-affiliate, AU only, via Web & Warehouse) ──────────────────────
  'acon-air-gen2': {
    label: 'ACON Air GEN2',
    affiliate: false,
    destination: { AU: 'https://webandwarehouse.com.au/products/acon-air-12ft-round-trampoline-with-standard-net-gen-20-12049' },
  },
  'acon-16-hd-10x17': {
    label: 'ACON 16 HD',
    affiliate: false,
    destination: { AU: 'https://webandwarehouse.com.au/products/acon-16-hd-rectangle-trampoline-and-enclosure-11930' },
  },
  'acon-x-10x17': {
    label: 'ACON X',
    affiliate: false,
    destination: { AU: 'https://webandwarehouse.com.au/products/acon-x-17ft-trampoline-with-net-enclosure-and-ladder-black-11982' },
  },
};

export function normalizeCountry(country?: Country | null): 'AU' | 'US' {
  return country === 'US' ? 'US' : 'AU';
}

export function getLinkDestination(slug: string, country?: Country | null): string | null {
  const config = links[slug as LinkSlug];
  if (!config) return null;
  if (typeof config.destination === 'string') return config.destination;
  const resolvedCountry = normalizeCountry(country);
  if (resolvedCountry === 'US') return config.destination.US ?? null;
  return config.destination.AU;
}

export function getLink(slug: string, country?: Country | null): string | null {
  const destination = getLinkDestination(slug, country);
  if (!destination) return null;
  return isSpringfreeLinkSlug(slug) ? `/go/${slug}/` : destination;
}

export function isAffiliateLink(slug: string): boolean {
  return links[slug as LinkSlug]?.affiliate ?? false;
}

export function isVulyLinkSlug(slug: string): slug is VulyLinkSlug {
  return VULY_LINK_SLUG_SET.has(slug);
}

export function isSpringfreeLinkSlug(slug: string): boolean {
  return SPRINGFREE_LINK_SLUG_SET.has(slug);
}

export function getRawVulyAffiliateLink(slug: string, country?: Country | null): string | null {
  return isVulyLinkSlug(slug) ? getLink(slug, country) : null;
}

export function isRawVulyAffiliateHref(href: string): boolean {
  try {
    const url = new URL(href);
    const isVulyHost = url.hostname === 'www.vulyplay.com' || url.hostname === 'vulyplay.com';
    return isVulyHost && (url.pathname === '/aff/100' || url.pathname === '/aff/100/');
  } catch {
    return false;
  }
}

export function getGoLinkSlug(href: string): string | null {
  let pathname = href;

  if (/^https?:\/\//i.test(href)) {
    try {
      pathname = new URL(href).pathname;
    } catch {
      return null;
    }
  } else {
    pathname = href.split(/[?#]/, 1)[0];
  }

  const match = pathname.match(/^\/go\/([^/?#]+)\/?$/);
  return match?.[1] ?? null;
}

export function resolveRawVulyAffiliateHref(href: string, country?: Country | null): string {
  const slug = getGoLinkSlug(href);
  if (!slug) return href;

  return getRawVulyAffiliateLink(slug, country) ?? href;
}
