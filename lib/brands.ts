import { TRAMPOLINES, type Trampoline } from '@/data/trampolines';
import generatedImages from '@/lib/model-images.generated.json';
import { trampolines as quizTrampolines, compareMatchers } from '@/lib/trampolines';

export type BrandInfo = {
  /** Must match the brand string in data/trampolines.ts exactly. */
  name: string;
  slug: string;
  /** One factual sentence. Sourced from site copy or derivable from the spec data. */
  blurb: string;
  /**
   * Hand-written warranty summary for the brand's intro paragraph. Written against
   * the per-model terms in data/trampolines.ts — revisit it when those change.
   */
  warranty: string;
  imageDir: string | null;
  affiliate: boolean;
};

/**
 * Brand strings that appear elsewhere in the codebase (the quiz uses a different
 * capitalisation) mapped to the canonical data/trampolines.ts spelling.
 */
const BRAND_ALIASES: Record<string, string> = {
  'oz trampolines': 'Oz Trampolines',
  'jumpflex': 'Jumpflex',
  'lifespan kids': 'Lifespan Kids',
  'jump star': 'Jump Star',
  'mr trampoline': 'Mr Trampoline',
  'geetramp': 'GeeTramp',
  'springfree': 'Springfree',
  'kahuna': 'Kahuna',
  'kmart': 'Kmart',
  'vuly': 'Vuly',
  'acon': 'ACON',
  'berg': 'BERG',
  'plum': 'Plum',
};

export const BRANDS: BrandInfo[] = [
  {
    name: 'Vuly',
    slug: 'vuly',
    blurb:
      'Brisbane-based brand selling round trampolines in two systems: coil-spring Flare and Ultra models, and leaf-spring Thunder models that move the springs out of the jumping area.',
    warranty:
      'Vuly lists a 10-year frame warranty on the Thunder 2 and Ultra 2 Pro, 5 years on the Ultra 2 and 3 years on the Flare. Mat cover runs 3 to 5 years, with 1 year on the net across the range.',
    imageDir: 'vuly',
    affiliate: true,
  },
  {
    name: 'Springfree',
    slug: 'springfree',
    blurb:
      'New Zealand brand whose trampolines have no springs at all — flexible fibreglass rods sit beneath the mat instead of springs around its edge.',
    warranty:
      'Springfree covers the frame, mat and net for 10 years on every model.',
    imageDir: 'springfree',
    affiliate: true,
  },
  {
    name: 'Jumpflex',
    slug: 'jumpflex',
    blurb:
      'New Zealand brand competing on specs and price, with round FLEX and HERO models plus the square and rectangular MEGA range rated to 225 kg per jumper.',
    warranty:
      'Jumpflex lists a 10-year frame warranty and a 5-year mat warranty on the HERO and MEGA, dropping to 5 years and 1 year on the FLEX. Net cover is 1 year across the range.',
    imageDir: 'jumpflex',
    affiliate: false,
  },
  {
    name: 'Oz Trampolines',
    slug: 'oz-trampolines',
    blurb:
      'Australian retailer offering round, oval and rectangular coil-spring trampolines built for local conditions, with replacement parts and after-sales support.',
    warranty:
      'Oz Trampolines lists a 5-year frame warranty across the range, with 2-year mat and net cover on most sizes.',
    imageDir: 'oz-trampolines',
    affiliate: false,
  },
  {
    name: 'Kahuna',
    slug: 'kahuna',
    blurb:
      'Budget-focused range spanning round, oval and rectangular models, including coil-spring ranges and the springless Twister.',
    warranty:
      'Kahuna lists a general 1-year parts warranty across the range; separate frame, mat and net periods are not listed in the comparison data.',
    imageDir: 'kahuna',
    affiliate: false,
  },
  {
    name: 'Kmart',
    slug: 'kmart',
    blurb:
      'Budget retailer offering low-cost round and rectangular trampoline options, including a springless-band model, with fewer published warranty and safety-standard details than premium brands.',
    warranty:
      'Kmart lists a 2-year frame warranty on the rectangular model.',
    imageDir: 'kmart',
    affiliate: false,
  },
  {
    name: 'Lifespan Kids',
    slug: 'lifespan-kids',
    blurb:
      'Australian play-equipment brand with both springless elastic-strap HyperJump models and traditional coil-spring models, often discounted below RRP.',
    warranty:
      'Lifespan Kids lists a 10-year frame warranty on the HyperJump 3 and 5 years on the BounceZone range and Hoppy. Mat cover runs 1 to 2 years, with 1 year on the net across the range.',
    imageDir: 'lifespan-kids',
    affiliate: true,
  },
  {
    name: 'GeeTramp',
    slug: 'geetramp',
    blurb:
      'Performance-oriented range of round and rectangular coil-spring trampolines, including in-ground versions of both shapes.',
    warranty:
      'GeeTramp lists a 10-year frame warranty and a 3-year mat warranty across the range, with a 2-year net warranty on the above-ground models.',
    imageDir: 'geetramp',
    affiliate: false,
  },
  {
    name: 'ACON',
    slug: 'acon',
    blurb:
      'Premium Finnish brand selling round and rectangular coil-spring trampolines built for strong bounce, at the top of the Australian price range.',
    warranty:
      'ACON lists a 10-year frame warranty, a 5-year mat warranty and a 1-year net warranty across the range.',
    imageDir: 'acon',
    affiliate: false,
  },
  {
    name: 'BERG',
    slug: 'berg',
    blurb:
      'Dutch brand known for its TwinSpring system and in-ground Champion models.',
    warranty:
      'BERG lists a 13-year frame warranty on the Champion and 10 years on the in-ground and Ultim models. Mat and net cover is 2 years across the range.',
    imageDir: 'berg',
    affiliate: false,
  },
  {
    name: 'Jump Star',
    slug: 'jump-star',
    blurb:
      'Perth family-owned business selling budget round coil-spring trampolines with enclosures.',
    warranty:
      'Jump Star lists a 3-year frame warranty, with 1 year on the mat and net.',
    imageDir: 'jump-star',
    affiliate: false,
  },
  {
    name: 'Plum',
    slug: 'plum',
    blurb:
      'Entry-level round trampolines aimed at younger children, spanning small junior models up to full-size Springsafe models.',
    warranty:
      'Plum lists a 5-year frame warranty on the Deluxe models and 1 year on the Springsafe models. Mat cover runs 1 to 2 years, and the Deluxe adds a 1-year net warranty.',
    imageDir: 'plum',
    affiliate: false,
  },
  {
    name: 'Mr Trampoline',
    slug: 'mr-trampoline',
    blurb:
      'Melbourne maker producing handmade rectangular trampolines since 1949, in deck, in-ground and above-ground family configurations.',
    warranty:
      'Mr Trampoline lists a 30-year frame warranty and an 8-year mat warranty across the range.',
    imageDir: 'mr-trampoline',
    affiliate: false,
  },
];

const BRANDS_BY_SLUG = new Map(BRANDS.map((brand) => [brand.slug, brand]));
const BRANDS_BY_NAME = new Map(BRANDS.map((brand) => [brand.name.toLowerCase(), brand]));
const DATA_BRAND_NAMES = [...new Set(TRAMPOLINES.map((row) => row.brand))];

function fallbackBrandInfo(name: string): BrandInfo {
  return {
    name,
    slug: name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    blurb:
      `${name} trampoline models are included in the comparison data, with specifications sourced from the current catalog sheet.`,
    warranty: `Warranty terms for each ${name} size are in the table below.`,
    imageDir: null,
    affiliate: false,
  };
}

export function getAllBrands(): BrandInfo[] {
  const seen = new Set<string>();
  const knownBrands = BRANDS.filter((brand) => {
    const hasRows = DATA_BRAND_NAMES.includes(brand.name);
    if (hasRows) seen.add(brand.name);
    return hasRows;
  });
  const fallbackBrands = DATA_BRAND_NAMES
    .filter((name) => !seen.has(name))
    .sort((a, b) => a.localeCompare(b))
    .map(fallbackBrandInfo);

  return [...knownBrands, ...fallbackBrands];
}

/** Resolves any known spelling of a brand to its canonical data/trampolines.ts name. */
export function canonicalBrandName(name: string): string {
  const key = name.trim().toLowerCase();
  return BRAND_ALIASES[key] ?? BRANDS_BY_NAME.get(key)?.name ?? name.trim();
}

export function getBrand(name: string): BrandInfo | null {
  const canonical = canonicalBrandName(name).toLowerCase();
  return getAllBrands().find((brand) => brand.name.toLowerCase() === canonical) ?? null;
}

export function getBrandBySlug(slug: string): BrandInfo | null {
  return BRANDS_BY_SLUG.get(slug) ?? getAllBrands().find((brand) => brand.slug === slug) ?? null;
}

export function brandSlug(name: string): string {
  return (
    getBrand(name)?.slug ??
    canonicalBrandName(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

export function getBrandRows(name: string): Trampoline[] {
  const canonical = canonicalBrandName(name);
  return TRAMPOLINES.filter((t) => t.brand === canonical);
}

/**
 * Product images live in the quiz dataset. compareMatchers already maps each quiz
 * model to its brand/model/size in the spec data, so we reuse that bridge rather
 * than maintaining a second manifest that could drift.
 */
const IMAGE_BY_MODEL_KEY: Map<string, string> = (() => {
  const map = new Map<string, string>();

  for (const quizModel of quizTrampolines) {
    const matcher = compareMatchers[quizModel.slug];
    if (!matcher || !quizModel.image) continue;

    const key = `${canonicalBrandName(matcher.brand)}|${matcher.model}`.toLowerCase();
    if (!map.has(key)) map.set(key, quizModel.image);
  }

  return map;
})();

/**
 * Images sourced from each model's own product page by scripts/fetch-model-images.ts,
 * covering the families the quiz dataset has no photo for.
 */
const GENERATED_IMAGES = new Map(
  Object.entries(generatedImages as Record<string, string>).map(([key, value]) => [
    key.toLowerCase(),
    value,
  ]),
);

export function modelImage(brand: string, model: string): string | null {
  const canonicalBrand = canonicalBrandName(brand);
  const key = `${canonicalBrand}|${model}`.toLowerCase();
  const directImage = IMAGE_BY_MODEL_KEY.get(key) ?? GENERATED_IMAGES.get(key);
  if (directImage) return directImage;

  // Springfree rows are grouped into Round/Oval/Square families on brand and
  // comparison pages. Use the largest photographed model as the family image.
  if (canonicalBrand === 'Springfree') {
    const family = model.match(/^(Round|Oval|Square) Trampoline$/i);
    if (family) {
      for (const size of ['Jumbo', 'Large', 'Medium', 'Compact', 'Mini']) {
        const familyKey = `${canonicalBrand}|${size} ${family[1]} Trampoline`.toLowerCase();
        const familyImage = IMAGE_BY_MODEL_KEY.get(familyKey) ?? GENERATED_IMAGES.get(familyKey);
        if (familyImage) return familyImage;
      }
    }
  }

  return null;
}
