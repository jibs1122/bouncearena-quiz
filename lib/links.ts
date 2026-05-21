import type { Country } from '@/lib/geolocation';

export const SPRINGFREE_AFFILIATE_URL = 'https://t.cfjump.com/59728/t/87128';
export const SPRINGFREE_GO_URL = 'https://www.bouncearena.com.au/go/springfree';
export const SPRINGFREE_TRAMPOLINES_AFFILIATE_URL =
  'https://t.cfjump.com/59728/t/87128?Url=https%3a%2f%2fwww.springfreetrampoline.com.au%2fcollections%2ftrampolines';
export const SPRINGFREE_TRAMPOLINES_GO_URL =
  'https://www.bouncearena.com.au/go/springfree-trampolines';

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
  | 'oz-summit-14ft';

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
    destination: { AU: SPRINGFREE_TRAMPOLINES_GO_URL },
  },
  'springfree-compact-round': {
    label: 'Springfree Compact Round',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_GO_URL },
  },
  'springfree-medium-round': {
    label: 'Springfree Medium Round',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_GO_URL },
  },
  'springfree-jumbo-round': {
    label: 'Springfree Jumbo Round',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_GO_URL },
  },
  'springfree-compact-oval': {
    label: 'Springfree Compact Oval',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_GO_URL },
  },
  'springfree-medium-oval': {
    label: 'Springfree Medium Oval',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_GO_URL },
  },
  'springfree-large-oval': {
    label: 'Springfree Large Oval',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_GO_URL },
  },
  'springfree-jumbo-oval': {
    label: 'Springfree Jumbo Oval',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_GO_URL },
  },
  'springfree-medium-square': {
    label: 'Springfree Medium Square',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_GO_URL },
  },
  'springfree-large-square': {
    label: 'Springfree Large Square',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_GO_URL },
  },
  'springfree-jumbo-square': {
    label: 'Springfree Jumbo Square',
    affiliate: true,
    destination: { AU: SPRINGFREE_TRAMPOLINES_GO_URL },
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
};

export function normalizeCountry(country?: Country | null): 'AU' | 'US' {
  return country === 'US' ? 'US' : 'AU';
}

export function getLink(slug: string, country?: Country | null): string | null {
  const config = links[slug as LinkSlug];
  if (!config) return null;
  if (typeof config.destination === 'string') return config.destination;
  const resolvedCountry = normalizeCountry(country);
  if (resolvedCountry === 'US') return config.destination.US ?? null;
  return config.destination.AU;
}

export function isAffiliateLink(slug: string): boolean {
  return links[slug as LinkSlug]?.affiliate ?? false;
}
