import { canonicalBrandName } from '@/lib/brands';

export type ComparePromo = {
  brand: string;
  code: string;
  description: string;
  href: string;
};

/**
 * Promo offers we can actually honour. Vuly is currently the only brand with a
 * negotiated code, so the promo block simply does not render on pages without one.
 */
const PROMOS: Record<string, ComparePromo> = {
  Vuly: {
    brand: 'Vuly',
    code: 'BOUNCE15',
    description: 'Use code BOUNCE15 for a discount on any new Vuly trampoline, swing set or monkey bars.',
    href: 'https://www.vulyplay.com/aff/100/',
  },
};

export function getPromoForBrand(brandName: string): ComparePromo | null {
  return PROMOS[canonicalBrandName(brandName)] ?? null;
}

export function buildPromosForBrands(brandNames: string[]): ComparePromo[] {
  const promos: ComparePromo[] = [];
  const seen = new Set<string>();

  for (const name of brandNames) {
    const promo = getPromoForBrand(name);
    if (!promo || seen.has(promo.brand)) continue;
    seen.add(promo.brand);
    promos.push(promo);
  }

  return promos;
}
