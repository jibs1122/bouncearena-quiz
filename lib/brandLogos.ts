export type BrandLogo = {
  src: string;
  darkBackground?: boolean;
  fullBleed?: boolean;
  scale?: number;
};

const BRAND_LOGOS: Record<string, BrandLogo> = {
  acon: { src: '/brand-logos/acon.png', fullBleed: true },
  berg: { src: '/brand-logos/berg.svg' },
  geetramp: { src: '/brand-logos/geetramp.svg' },
  'jump star': { src: '/brand-logos/jump-star-cropped.png' },
  jumpflex: { src: '/brand-logos/jumpflex.png', fullBleed: true },
  kahuna: { src: '/brand-logos/kahuna.png', darkBackground: true },
  kmart: { src: '/brand-logos/kmart.svg' },
  'lifespan kids': { src: '/brand-logos/lifespan-kids.png' },
  'mr trampoline': { src: '/brand-logos/mr-trampoline-full.jpg', fullBleed: true },
  'oz trampolines': { src: '/brand-logos/oz-trampolines.svg', darkBackground: true },
  plum: { src: '/brand-logos/plum.svg' },
  springfree: { src: '/brand-logos/springfree.png', fullBleed: true },
  vuly: { src: '/brand-logos/vuly.png', scale: 1.08 },
};

function logoKey(brandName: string): string {
  return brandName.trim().toLowerCase();
}

export function getBrandLogo(brandName: string): BrandLogo | null {
  return BRAND_LOGOS[logoKey(brandName)] ?? null;
}

export function getBrandLogoUrl(brandName: string): string | null {
  return getBrandLogo(brandName)?.src ?? null;
}

export function brandInitials(brandName: string): string {
  return brandName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
