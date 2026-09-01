export type BrandPromo = {
  brand: string;
  /** Every code we hold for the brand, primary (the one the promo block shows) first. */
  codes: [string, ...string[]];
  description: string;
  href: string;
  /** The shop link is paid, so any page rendering it has to show the disclosure. */
  affiliate: boolean;
};

/**
 * Promo offers we can actually honour. Brands without a negotiated code simply do
 * not render a promo block. Lookups are keyed on the lowercased brand name so the
 * quiz's capitalisation resolves too — this module is deliberately free of the
 * brand/trampoline imports because the site-wide promo bell ships it to the client.
 */
const PROMOS: BrandPromo[] = [
  {
    brand: 'Vuly',
    codes: ['BOUNCE15', 'BOUNCESURGE'],
    description: 'Use code BOUNCE15 for a discount on any new Vuly trampoline, swing set or monkey bars.',
    href: 'https://www.vulyplay.com/aff/100/',
    affiliate: true,
  },
  {
    brand: 'Lifespan Kids',
    codes: ['BOUNCE5'],
    description: 'Use code BOUNCE5 for a discount at Lifespan Kids.',
    href: 'https://www.lifespankids.com.au/discount/BOUNCE5?rfsn=9306020.3d9f288',
    affiliate: true,
  },
];

const PROMOS_BY_BRAND = new Map(PROMOS.map((promo) => [promo.brand.toLowerCase(), promo]));

export function getAllPromos(): BrandPromo[] {
  return PROMOS;
}

export function getPromoForBrand(brandName: string): BrandPromo | null {
  return PROMOS_BY_BRAND.get(brandName.trim().toLowerCase()) ?? null;
}

export function buildPromosForBrands(brandNames: string[]): BrandPromo[] {
  const promos: BrandPromo[] = [];
  const seen = new Set<string>();

  for (const name of brandNames) {
    const promo = getPromoForBrand(name);
    if (!promo || seen.has(promo.brand)) continue;
    seen.add(promo.brand);
    promos.push(promo);
  }

  return promos;
}

export function hasAffiliatePromo(promos: BrandPromo[]): boolean {
  return promos.some((promo) => promo.affiliate);
}
