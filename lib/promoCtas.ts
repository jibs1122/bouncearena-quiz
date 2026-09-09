export type BrandPromo = {
  /**
   * The maker the promo is presented as. Retailer deals use their best-known
   * brand here, and are re-headed with the brand the reader came for.
   */
  brand: string;
  /**
   * Brand names the promo covers, for retailer deals that span several makers.
   * Defaults to the promo's own brand.
   */
  appliesTo?: readonly string[];
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
    brand: 'GeeTramp',
    appliesTo: ['GeeTramp', 'ACON', 'BERG', 'Plum', 'Mr Trampoline'],
    codes: ['BOUNCE'],
    description:
      'Use code BOUNCE for a discount at Web and Warehouse, which stocks GeeTramp, ACON, BERG, Plum and Mr Trampoline.',
    href: 'https://webandwarehouse.com.au/?tracking=6a9550e65374c',
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

const PROMOS_BY_BRAND = new Map(
  PROMOS.flatMap((promo) =>
    (promo.appliesTo ?? [promo.brand]).map((name) => [name.toLowerCase(), promo] as const),
  ),
);

export function getAllPromos(): BrandPromo[] {
  return PROMOS;
}

export function getPromoForBrand(brandName: string): BrandPromo | null {
  return PROMOS_BY_BRAND.get(brandName.trim().toLowerCase()) ?? null;
}

export function buildPromosForBrands(brandNames: string[]): BrandPromo[] {
  const promos: BrandPromo[] = [];
  const seen = new Set<BrandPromo>();

  for (const name of brandNames) {
    const promo = getPromoForBrand(name);
    if (!promo || seen.has(promo)) continue;
    seen.add(promo);
    // A retailer deal reads better under the brand on the page than the store's name.
    promos.push(promo.appliesTo ? { ...promo, brand: name } : promo);
  }

  return promos;
}

export function hasAffiliatePromo(promos: BrandPromo[]): boolean {
  return promos.some((promo) => promo.affiliate);
}
