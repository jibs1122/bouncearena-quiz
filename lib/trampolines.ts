import type { Country } from '@/lib/geolocation';
import { resolveQuizCountry } from '@/lib/geolocation';
import {
  TRAMPOLINES as COMPARE_ROWS,
  type Trampoline as CompareTrampoline,
} from '@/data/trampolines';

export type SpringType = 'springless' | 'traditional';
export type Shape = 'round' | 'oval' | 'square' | 'rectangle';
export type PriorityId = 'bounce' | 'durability' | 'value' | 'warranty';

export interface MatchReasonBank {
  springless?: string;
  traditional?: string;
  shapeRound?: string;
  shapeRectangle?: string;
  safetyEssential?: string;
  safetyNiceToHave?: string;
  meetsStandards?: string;
  smallYard?: string;
  mediumYard?: string;
  largeYard?: string;
  longNarrowYard?: string;
  bounce?: string;
  durability?: string;
  valueForMoney?: string;
  warranty?: string;
}

export interface QuizSizeOption {
  /** Approximate footprint in feet, used only to choose a yard-size recommendation. */
  approximateFt: number;
  /** Catalogue label shown to the user, including metric context where useful. */
  displayLabel: string;
  priceAud: number;
  meetsAUStandards: boolean;
}

export interface Trampoline {
  id: string;
  displayName: string;
  brand: string;
  springType: SpringType;
  shape: Shape;
  advancedSafety: boolean;
  meetsAUStandards: boolean;
  meetsUSStandards: boolean;
  availableIn: Array<'AU' | 'US'>;
  priceFrom: number;
  sizes: number[]; // ft (approximate for metric models); used for multi-size selection
  displaySize: string; // shown on results card e.g. "12ft" or "2.4m × 3.4m oval"
  /** Authoritative per-size facts for model families whose variants differ materially. */
  sizeOptions?: QuizSizeOption[];
  image: string; // path under /images/
  slug: string;
  isVuly: boolean;
  fitsYard: { small: boolean; medium: boolean; large: boolean; longNarrow: boolean };
  bestFor: string;
  metricScores: Record<PriorityId, number>;
  matchReasons: MatchReasonBank;
}

type QuizTrampolineSeed = Omit<Trampoline, 'priceFrom' | 'meetsAUStandards' | 'sizeOptions'>;

const baseTrampolines: QuizTrampolineSeed[] = [

  // ─── Vuly ──────────────────────────────────────────────────────────────────

  {
    id: 'vuly-thunder-2-pro',
    displayName: 'Thunder 2 Pro',
    brand: 'Vuly',
    springType: 'springless',
    shape: 'round',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU', 'US'],
    sizes: [10, 12, 14],
    displaySize: '10ft, 12ft or 14ft',
    image: '/images/vuly/thunder-2-pro.webp',
    slug: 'vuly-thunder-2-pro',
    isVuly: true,
    fitsYard: { small: true, medium: true, large: true, longNarrow: false },
    bestFor: 'Families wanting the Pro version of Vuly\'s springless Thunder.',
    metricScores: { bounce: 8, durability: 10, value: 4, warranty: 9 },
    matchReasons: {
      springless: 'Springless leaf-spring system, with no exposed metal coil springs on the frame',
      safetyEssential: 'Curved poles angle away from jumpers, springs sit outside the net and the frame sits away from the jump zone',
      safetyNiceToHave: 'Safety features include curved poles and an external spring system',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      smallYard: 'Available in 10ft, which fits a smaller backyard (allow 1m clearance on all sides)',
      mediumYard: 'Available in 12ft, which suits a medium-sized backyard',
      largeYard: 'Available up to 14ft for a large backyard',
      durability: '10-year frame warranty, the longest Vuly offers',
      warranty: 'Backed by Vuly\'s 10-year frame warranty',
    },
  },

  {
    id: 'vuly-thunder-2',
    displayName: 'Thunder 2',
    brand: 'Vuly',
    springType: 'springless',
    shape: 'round',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU', 'US'],
    sizes: [10, 12, 14, 16],
    displaySize: '10ft, 12ft, 14ft or 16ft',
    image: '/images/vuly/thunder-2.webp',
    slug: 'vuly-thunder-2',
    isVuly: true,
    fitsYard: { small: true, medium: true, large: true, longNarrow: false },
    bestFor: 'Families wanting a springless Vuly at a lower entry price than the Pro.',
    metricScores: { bounce: 8, durability: 8, value: 6, warranty: 9 },
    matchReasons: {
      springless: 'Springless leaf-spring system, with no exposed metal coil springs',
      safetyEssential: 'Curved poles and a springless design remove exposed springs and hard pole edges',
      safetyNiceToHave: 'Curved poles and a springless design',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      smallYard: 'Available in 10ft, which fits smaller backyards',
      mediumYard: 'Available in 12ft, which suits a medium-sized backyard',
      largeYard: 'Available up to 14ft for your large backyard',
      durability: '10-year frame warranty on the Thunder 2',
      warranty: '10-year frame warranty from Vuly',
    },
  },

  {
    id: 'vuly-ultra-2-pro',
    displayName: 'Ultra 2 Pro',
    brand: 'Vuly',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU', 'US'],
    sizes: [10, 12, 14],
    displaySize: '10ft, 12ft or 14ft',
    image: '/images/vuly/ultra-2-pro.webp',
    slug: 'vuly-ultra-2-pro',
    isVuly: true,
    fitsYard: { small: true, medium: true, large: true, longNarrow: false },
    bestFor: 'Buyers who want the Pro version of Vuly\'s coil-spring Ultra.',
    metricScores: { bounce: 8, durability: 8, value: 7, warranty: 8 },
    matchReasons: {
      traditional: 'Traditional coil-spring system with a familiar bounce',
      safetyEssential: 'Curved safety poles and an enclosed jump area',
      safetyNiceToHave: 'Safety features include curved poles',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      smallYard: 'Available in 10ft, which fits a smaller backyard',
      mediumYard: 'Available in 12ft, which suits a medium-sized backyard',
      largeYard: 'Available up to 14ft for your large backyard',
      valueForMoney: 'Mid-range price for the Pro version of the Ultra',
      warranty: '10-year frame warranty from Vuly',
    },
  },

  {
    id: 'vuly-ultra-2',
    displayName: 'Ultra 2',
    brand: 'Vuly',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU', 'US'],
    sizes: [8, 10, 12, 14],
    displaySize: '8ft, 10ft, 12ft or 14ft',
    image: '/images/vuly/ultra-2.webp',
    slug: 'vuly-ultra-2',
    isVuly: true,
    fitsYard: { small: true, medium: true, large: true, longNarrow: false },
    bestFor: 'Families after a mid-range Vuly spring model with broad appeal.',
    metricScores: { bounce: 8, durability: 7, value: 8, warranty: 8 },
    matchReasons: {
      traditional: 'Traditional coil-spring system with a familiar bounce',
      safetyNiceToHave: 'Full enclosure net around the jump area',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      smallYard: 'Available in 10ft, which fits smaller backyards',
      mediumYard: 'Available in 12ft, which suits a medium-sized backyard',
      largeYard: 'Available up to 14ft for your large backyard',
      valueForMoney: 'Mid-range price for a Vuly coil-spring model',
      warranty: '5-year frame warranty from Vuly',
    },
  },

  {
    id: 'vuly-flare',
    displayName: 'Flare',
    brand: 'Vuly',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: false,
    meetsUSStandards: true,
    availableIn: ['AU', 'US'],
    sizes: [11, 13],
    displaySize: 'M or L',
    image: '/images/vuly/flare.webp',
    slug: 'vuly-flare',
    isVuly: true,
    fitsYard: { small: true, medium: true, large: true, longNarrow: false },
    bestFor: 'Budget-conscious families who want Vuly\'s entry-level model.',
    metricScores: { bounce: 8, durability: 7, value: 9, warranty: 7 },
    matchReasons: {
      traditional: 'Traditional spring system with a familiar bounce',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      smallYard: 'The Medium size has a 340cm overall diameter',
      mediumYard: 'Available in Medium (340cm overall) or Large (386cm overall)',
      largeYard: 'The Large size has a 386cm overall diameter',
      valueForMoney: 'Vuly\'s lowest-priced trampoline',
      warranty: 'Backed by Vuly\'s warranty',
    },
  },

  // ─── Springfree ────────────────────────────────────────────────────────────

  {
    id: 'springfree-mini-round',
    displayName: 'Mini Round',
    brand: 'Springfree',
    springType: 'springless',
    shape: 'round',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [6],
    displaySize: '6ft (1.8m)',
    image: '/images/springfree/mini-round.webp',
    slug: 'springfree-mini-round',
    isVuly: false,
    fitsYard: { small: true, medium: false, large: false, longNarrow: false },
    bestFor: 'Young kids in tight urban backyards, in a small springless footprint.',
    metricScores: { bounce: 8, durability: 10, value: 6, warranty: 10 },
    matchReasons: {
      springless: 'Composite rod system with no exposed springs or pinch points',
      safetyEssential: 'Composite rods, SoftEdge mat and a frame hidden below the mat',
      safetyNiceToHave: 'Composite rods replace metal springs entirely',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      smallYard: '6ft (1.8m), sized for tight urban backyards and young children',
      durability: '10-year warranty on the frame, mat, net and rods',
      warranty: 'Springfree covers all components for 10 years',
    },
  },

  {
    id: 'springfree-compact-round',
    displayName: 'Compact Round',
    brand: 'Springfree',
    springType: 'springless',
    shape: 'round',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [8],
    displaySize: '8ft (2.5m)',
    image: '/images/springfree/compact-round.webp',
    slug: 'springfree-compact-round',
    isVuly: false,
    fitsYard: { small: true, medium: false, large: false, longNarrow: false },
    bestFor: 'Small urban yards that need maximum safety in a compact footprint.',
    metricScores: { bounce: 8, durability: 10, value: 6, warranty: 10 },
    matchReasons: {
      springless: 'Composite rod system with no exposed springs or pinch points',
      safetyEssential: 'Composite rods, SoftEdge mat and a frame hidden below the mat',
      safetyNiceToHave: 'Composite rods replace metal springs entirely',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      smallYard: '8ft (2.5m), which fits small backyards',
      durability: '10-year warranty on the frame, mat, net and rods',
      warranty: 'Springfree covers all components for 10 years',
    },
  },

  {
    id: 'springfree-medium-round',
    displayName: 'Medium Round',
    brand: 'Springfree',
    springType: 'springless',
    shape: 'round',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [10],
    displaySize: '10ft (3m)',
    image: '/images/springfree/medium-round.jpg',
    slug: 'springfree-medium-round',
    isVuly: false,
    fitsYard: { small: true, medium: true, large: false, longNarrow: false },
    bestFor: 'Families wanting a mid-size Springfree round for mixed-age use.',
    metricScores: { bounce: 8, durability: 10, value: 5, warranty: 10 },
    matchReasons: {
      springless: 'Composite rod system with no exposed springs',
      safetyEssential: 'Composite rods, SoftEdge mat and a frame hidden below the mat',
      safetyNiceToHave: 'Composite rods replace metal springs entirely',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      smallYard: '10ft (3m), a springless fit for smaller to medium yards',
      mediumYard: '10ft (3m), which suits medium-sized backyards',
      durability: '10-year warranty on the frame, mat, net and rods',
      warranty: 'Springfree covers all components for 10 years',
    },
  },

  {
    id: 'springfree-jumbo-round',
    displayName: 'Jumbo Round',
    brand: 'Springfree',
    springType: 'springless',
    shape: 'round',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [13],
    displaySize: '13ft (4m)',
    image: '/images/springfree/jumbo-round.webp',
    slug: 'springfree-jumbo-round',
    isVuly: false,
    fitsYard: { small: false, medium: false, large: true, longNarrow: false },
    bestFor: 'Large families wanting the largest round Springfree.',
    metricScores: { bounce: 8, durability: 10, value: 4, warranty: 10 },
    matchReasons: {
      springless: 'Composite rod system with no exposed springs',
      safetyEssential: 'Composite rods and SoftEdge mat at jumbo scale',
      safetyNiceToHave: 'Springfree\'s composite rod system replaces metal springs',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      mediumYard: '13ft (4m), suited to medium to large yards',
      largeYard: '13ft (4m), sized for large backyards and whole-family use',
      durability: '10-year warranty on the frame, mat, net and rods',
      warranty: 'Springfree covers all components for 10 years',
    },
  },

  {
    id: 'springfree-compact-oval',
    displayName: 'Compact Oval',
    brand: 'Springfree',
    springType: 'springless',
    shape: 'oval',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [7],
    displaySize: '1.9m × 2.7m',
    image: '/images/springfree/compact-oval.webp',
    slug: 'springfree-compact-oval',
    isVuly: false,
    fitsYard: { small: true, medium: false, large: false, longNarrow: true },
    bestFor: 'Long narrow yards wanting a springless option in a compact oval footprint.',
    metricScores: { bounce: 8, durability: 10, value: 6, warranty: 10 },
    matchReasons: {
      springless: 'Composite rod system with no exposed springs or pinch points',
      safetyEssential: 'Composite rods, SoftEdge mat and a frame hidden below the mat',
      safetyNiceToHave: 'Springfree\'s composite rod system replaces metal springs',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      smallYard: '1.9m × 2.7m, compact enough for smaller yards',
      longNarrowYard: 'Oval shape (1.9m × 2.7m) suits long, narrow backyard layouts',
      durability: '10-year warranty on the frame, mat, net and rods',
      warranty: 'Springfree covers all components for 10 years',
    },
  },

  {
    id: 'springfree-medium-oval',
    displayName: 'Medium Oval',
    brand: 'Springfree',
    springType: 'springless',
    shape: 'oval',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [9],
    displaySize: '2.4m × 3.4m',
    image: '/images/springfree/medium-oval.webp',
    slug: 'springfree-medium-oval',
    isVuly: false,
    fitsYard: { small: false, medium: true, large: false, longNarrow: true },
    bestFor: 'Medium-sized yards with a long narrow layout.',
    metricScores: { bounce: 8, durability: 10, value: 5, warranty: 10 },
    matchReasons: {
      springless: 'Composite rod system with no exposed springs',
      safetyEssential: 'Composite rods, SoftEdge mat and a frame hidden below the mat',
      safetyNiceToHave: 'Springfree\'s composite rod system replaces metal springs',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      mediumYard: '2.4m × 3.4m, which fits medium-sized backyards',
      longNarrowYard: 'Oval shape (2.4m × 3.4m) suits long, narrow yards',
      durability: '10-year warranty on the frame, mat, net and rods',
      warranty: 'Springfree covers all components for 10 years',
    },
  },

  {
    id: 'springfree-large-oval',
    displayName: 'Large Oval',
    brand: 'Springfree',
    springType: 'springless',
    shape: 'oval',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [11],
    displaySize: '2.4m × 4m',
    image: '/images/springfree/large-oval.webp',
    slug: 'springfree-large-oval',
    isVuly: false,
    fitsYard: { small: false, medium: true, large: true, longNarrow: true },
    bestFor: 'Larger yards with a long narrow layout needing extra length.',
    metricScores: { bounce: 8, durability: 10, value: 5, warranty: 10 },
    matchReasons: {
      springless: 'Composite rod system with no exposed springs',
      safetyEssential: 'Composite rods, SoftEdge mat and a frame hidden below the mat',
      safetyNiceToHave: 'Springfree\'s composite rod system replaces metal springs',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      mediumYard: '2.4m × 4m, which fits medium to large yards',
      largeYard: '2.4m × 4m, an extra-long jumping surface for larger backyards',
      longNarrowYard: 'Oval shape (2.4m × 4m) suits long, narrow backyard layouts',
      durability: '10-year warranty on the frame, mat, net and rods',
      warranty: 'Springfree covers all components for 10 years',
    },
  },

  {
    id: 'springfree-jumbo-oval',
    displayName: 'Jumbo Oval',
    brand: 'Springfree',
    springType: 'springless',
    shape: 'oval',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [15],
    displaySize: '3.8m × 5.7m',
    image: '/images/springfree/jumbo-oval.webp',
    slug: 'springfree-jumbo-oval',
    isVuly: false,
    fitsYard: { small: false, medium: false, large: true, longNarrow: true },
    bestFor: 'Huge yards and athletes who want the largest oval Springfree makes.',
    metricScores: { bounce: 8, durability: 10, value: 3, warranty: 10 },
    matchReasons: {
      springless: 'Composite rod system with no exposed springs',
      safetyEssential: 'Composite rods and SoftEdge mat at jumbo scale',
      safetyNiceToHave: 'Springfree\'s composite rod system replaces metal springs',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      largeYard: '3.8m × 5.7m, sized for large open yards',
      longNarrowYard: 'Jumbo oval (3.8m × 5.7m) for long, narrow yards with plenty of room',
      durability: '10-year warranty on the frame, mat, net and rods',
      warranty: 'Springfree covers all components for 10 years',
    },
  },

  {
    id: 'springfree-medium-square',
    displayName: 'Medium Square',
    brand: 'Springfree',
    springType: 'springless',
    shape: 'square',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [9],
    displaySize: '2.7m × 2.7m',
    image: '/images/springfree/medium-square.jpg',
    slug: 'springfree-medium-square',
    isVuly: false,
    fitsYard: { small: true, medium: true, large: false, longNarrow: false },
    bestFor: 'Medium yards wanting a square springless jump area.',
    metricScores: { bounce: 8, durability: 10, value: 5, warranty: 10 },
    matchReasons: {
      springless: 'Composite rod system with no exposed springs',
      safetyEssential: 'Composite rods, SoftEdge mat and a frame hidden below the mat',
      safetyNiceToHave: 'Springfree\'s composite rod system replaces metal springs',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      shapeRectangle: 'Square 2.7m × 2.7m mat: a straight-edged jump area in a springless design',
      smallYard: '2.7m × 2.7m square, which fits small to medium backyards',
      mediumYard: '2.7m × 2.7m square, with usable corners for medium backyards',
      durability: '10-year warranty on the frame, mat, net and rods',
      warranty: 'Springfree covers all components for 10 years',
    },
  },

  {
    id: 'springfree-large-square',
    displayName: 'Large Square',
    brand: 'Springfree',
    springType: 'springless',
    shape: 'square',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [11],
    displaySize: '3.4m × 3.4m',
    image: '/images/springfree/large-square.webp',
    slug: 'springfree-large-square',
    isVuly: false,
    fitsYard: { small: false, medium: true, large: true, longNarrow: false },
    bestFor: 'Larger backyards wanting the largest Springfree square.',
    metricScores: { bounce: 8, durability: 10, value: 4, warranty: 10 },
    matchReasons: {
      springless: 'Composite rod system with no exposed springs',
      safetyEssential: 'Composite rods, SoftEdge mat and a frame hidden below the mat',
      safetyNiceToHave: 'Springfree\'s composite rod system replaces metal springs',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      shapeRectangle: 'Square 3.4m × 3.4m mat: a large straight-edged jump area in a springless design',
      mediumYard: '3.4m × 3.4m square for a medium to large yard',
      largeYard: '3.4m × 3.4m, sized for larger backyards',
      durability: '10-year warranty on the frame, mat, net and rods',
      warranty: 'Springfree covers all components for 10 years',
    },
  },

  // ─── Jumpflex ──────────────────────────────────────────────────────────────

  {
    id: 'jumpflex-flex-10ft',
    displayName: 'Flex 10ft',
    brand: 'Jumpflex',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: false,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [10],
    displaySize: '10ft',
    image: '/images/jumpflex/flex.png',
    slug: 'jumpflex-flex-10ft',
    isVuly: false,
    fitsYard: { small: true, medium: false, large: false, longNarrow: false },
    bestFor: 'Budget-conscious families with smaller yards who want a certified spring model.',
    metricScores: { bounce: 8, durability: 6, value: 9, warranty: 6 },
    matchReasons: {
      traditional: 'Traditional spring system with a straightforward bounce',
      smallYard: '10ft size, which fits smaller backyards',
      valueForMoney: 'Good value for a basic family trampoline',
    },
  },

  {
    id: 'jumpflex-flex-12ft',
    displayName: 'Flex 12ft',
    brand: 'Jumpflex',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: false,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [12],
    displaySize: '12ft',
    image: '/images/jumpflex/flex.png',
    slug: 'jumpflex-flex-12ft',
    isVuly: false,
    fitsYard: { small: false, medium: true, large: false, longNarrow: false },
    bestFor: 'Budget families with medium yards who want a dependable spring model.',
    metricScores: { bounce: 8, durability: 6, value: 9, warranty: 6 },
    matchReasons: {
      traditional: 'Traditional spring system with a familiar bounce',
      mediumYard: '12ft, which suits a medium-sized backyard',
      valueForMoney: 'Good value for a standard family trampoline',
    },
  },

  {
    id: 'jumpflex-hero-10ft',
    displayName: 'Hero 10ft',
    brand: 'Jumpflex',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [10],
    displaySize: '10ft',
    image: '/images/jumpflex/hero.png',
    slug: 'jumpflex-hero-10ft',
    isVuly: false,
    fitsYard: { small: true, medium: false, large: false, longNarrow: false },
    bestFor: 'Families in smaller yards wanting a curved-pole spring trampoline without the springless price.',
    metricScores: { bounce: 8, durability: 8, value: 8, warranty: 8 },
    matchReasons: {
      traditional: 'Traditional spring system with curved safety poles',
      safetyEssential: 'Curved poles, DualRing reinforced frame and TightWeave enclosure net',
      safetyNiceToHave: 'Curved poles and reinforced DualRing frame',
      smallYard: '10ft, which fits smaller backyards',
      durability: 'Reinforced DualRing frame with 10-year warranty',
      warranty: '10-year frame warranty from Jumpflex',
      valueForMoney: 'Curved-pole spring trampoline priced below the springless models',
    },
  },

  {
    id: 'jumpflex-hero-12ft',
    displayName: 'Hero 12ft',
    brand: 'Jumpflex',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [12],
    displaySize: '12ft',
    image: '/images/jumpflex/hero.png',
    slug: 'jumpflex-hero-12ft',
    isVuly: false,
    fitsYard: { small: false, medium: true, large: false, longNarrow: false },
    bestFor: 'Medium-yard families wanting a curved-pole spring trampoline.',
    metricScores: { bounce: 8, durability: 8, value: 8, warranty: 8 },
    matchReasons: {
      traditional: 'Traditional spring system with curved safety poles',
      safetyEssential: 'Curved poles, DualRing reinforced frame and TightWeave enclosure net',
      safetyNiceToHave: 'Curved poles and reinforced DualRing frame',
      mediumYard: '12ft, which suits a medium-sized backyard',
      durability: 'Reinforced DualRing frame with 10-year warranty',
      warranty: '10-year frame warranty from Jumpflex',
      valueForMoney: 'Curved-pole spring trampoline priced below the springless models',
    },
  },

  {
    id: 'jumpflex-hero-14ft',
    displayName: 'Hero 14ft',
    brand: 'Jumpflex',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [14],
    displaySize: '14ft',
    image: '/images/jumpflex/hero.png',
    slug: 'jumpflex-hero-14ft',
    isVuly: false,
    fitsYard: { small: false, medium: false, large: true, longNarrow: false },
    bestFor: 'Large-yard families wanting a curved-pole spring trampoline in a 14ft model.',
    metricScores: { bounce: 8, durability: 8, value: 7, warranty: 8 },
    matchReasons: {
      traditional: 'Traditional spring system with curved safety poles',
      safetyEssential: 'Curved poles, DualRing frame and TightWeave enclosure net',
      safetyNiceToHave: 'Curved poles and reinforced DualRing frame',
      largeYard: '14ft for a large backyard',
      durability: 'Reinforced DualRing frame with 10-year warranty',
      warranty: '10-year frame warranty from Jumpflex',
    },
  },

  {
    id: 'jumpflex-hero-15ft',
    displayName: 'Hero 15ft',
    brand: 'Jumpflex',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [15],
    displaySize: '15ft',
    image: '/images/jumpflex/hero.png',
    slug: 'jumpflex-hero-15ft',
    isVuly: false,
    fitsYard: { small: false, medium: false, large: true, longNarrow: false },
    bestFor: 'Large-yard families who want the biggest round Jumpflex Hero option.',
    metricScores: { bounce: 8, durability: 8, value: 7, warranty: 8 },
    matchReasons: {
      traditional: 'Traditional spring system with Jumpflex\'s curved-pole safety layout',
      safetyEssential: 'Curved poles, DualRing frame and TightWeave net',
      safetyNiceToHave: 'Curved poles and TightWeave net',
      largeYard: '15ft, with more jumping space for a large backyard',
      durability: 'Reinforced frame backed by a 10-year warranty',
      warranty: '10-year frame warranty from Jumpflex',
    },
  },

  {
    id: 'jumpflex-mega-14ft',
    displayName: 'MEGA 14ft',
    brand: 'Jumpflex',
    springType: 'traditional',
    shape: 'square',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [14],
    displaySize: '14ft square',
    image: '/images/jumpflex/mega-14ft.jpg',
    slug: 'jumpflex-mega-14ft',
    isVuly: false,
    fitsYard: { small: false, medium: false, large: true, longNarrow: false },
    bestFor: 'Families who want a square trampoline with a big, gymnast-style jump area.',
    metricScores: { bounce: 8, durability: 9, value: 6, warranty: 8 },
    matchReasons: {
      traditional: 'Traditional piano-wire spring system',
      shapeRectangle: 'Square 14ft mat: the straight-edged jump area you asked for, with more usable corners than a round',
      safetyEssential: 'Jumpflex enclosure and heavy-duty frame',
      safetyNiceToHave: 'Frame and enclosure rated for larger users',
      largeYard: '14ft square format, which needs a large open yard',
      bounce: 'Square shape and piano-wire springs for a controlled bounce',
      durability: 'Heavy-duty frame rated to 225 kg per jumper',
      warranty: '10-year frame warranty from Jumpflex',
    },
  },

  {
    id: 'jumpflex-mega-17ft',
    displayName: 'MEGA 17ft',
    brand: 'Jumpflex',
    springType: 'traditional',
    shape: 'rectangle',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [17],
    displaySize: '17ft rectangle',
    image: '/images/jumpflex/mega-17ft.jpg',
    slug: 'jumpflex-mega-17ft',
    isVuly: false,
    fitsYard: { small: false, medium: false, large: true, longNarrow: true },
    bestFor: 'Long, wide backyards wanting a 17ft rectangle trampoline.',
    metricScores: { bounce: 8, durability: 9, value: 6, warranty: 8 },
    matchReasons: {
      traditional: 'Traditional spring system on a 17ft rectangle',
      shapeRectangle: 'True 17ft rectangle: the long, straight jump lane you asked for',
      safetyEssential: 'Enclosure and heavy-duty frame rated for larger users',
      safetyNiceToHave: 'Enclosure net on a competition-style rectangle layout',
      largeYard: '17ft rectangle, which suits very large backyards',
      longNarrowYard: 'Rectangle format makes better use of long, wide yard layouts than a giant round model',
      bounce: 'Rectangle shape gives a more even bounce across the mat',
      durability: 'Heavy-duty frame rated to 225 kg per jumper',
    },
  },

  {
    id: 'jumpflex-mega-19ft',
    displayName: 'MEGA 19ft',
    brand: 'Jumpflex',
    springType: 'traditional',
    shape: 'square',
    advancedSafety: true,
    meetsUSStandards: true,
    availableIn: ['AU'],
    sizes: [19],
    displaySize: '19ft square',
    image: '/images/jumpflex/mega-19ft.jpg',
    slug: 'jumpflex-mega-19ft',
    isVuly: false,
    fitsYard: { small: false, medium: false, large: true, longNarrow: false },
    bestFor: 'Huge yards and older jumpers who want the biggest square Jumpflex makes.',
    metricScores: { bounce: 8, durability: 9, value: 5, warranty: 8 },
    matchReasons: {
      traditional: 'Piano-wire springs on a giant square footprint',
      shapeRectangle: 'Giant 19ft square: the largest straight-edged jump area in the range',
      safetyEssential: 'Enclosure net on a heavy-duty square frame',
      safetyNiceToHave: 'Enclosure and frame rated for larger users',
      largeYard: '19ft square, which needs a large open yard',
      bounce: 'Huge square mat gives a broad jumping zone',
      durability: 'Heavy-duty frame rated to 225 kg per jumper',
      warranty: '10-year frame warranty from Jumpflex',
    },
  },

  // ─── Lifespan Kids ─────────────────────────────────────────────────────────

  {
    id: 'lifespan-hyperjump-3-10ft',
    displayName: 'HyperJump 3 Springless 10ft',
    brand: 'Lifespan Kids',
    springType: 'springless',
    shape: 'round',
    advancedSafety: true,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [10],
    displaySize: '10ft',
    image: '/images/lifespan-kids/hyperjump3-10-ft.webp',
    slug: 'lifespan-hyperjump-3-10ft',
    isVuly: false,
    fitsYard: { small: true, medium: false, large: false, longNarrow: false },
    bestFor: 'Budget-minded families who want a lower-cost springless-style option.',
    metricScores: { bounce: 7, durability: 6, value: 9, warranty: 7 },
    matchReasons: {
      springless: 'Springless strap design removes exposed steel coil springs',
      safetyEssential: 'Springless straps and an enclosed jump area remove exposed springs',
      safetyNiceToHave: 'Springless design removes spring pinch points',
      smallYard: '10ft footprint suits smaller backyards',
      valueForMoney: 'One of the lower-priced springless trampolines',
      warranty: 'Long frame warranty for a budget model',
    },
  },

  {
    id: 'lifespan-bouncezone-12ft',
    displayName: 'BounceZone Round Spring 12ft',
    brand: 'Lifespan Kids',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [12],
    displaySize: '12ft',
    image: '/images/lifespan-kids/bouncezone-round-spring.jpg',
    slug: 'lifespan-bouncezone-12ft',
    isVuly: false,
    fitsYard: { small: false, medium: true, large: false, longNarrow: false },
    bestFor: 'Families wanting a conventional 12ft round trampoline with a 5-year frame warranty.',
    metricScores: { bounce: 7, durability: 6, value: 7, warranty: 6 },
    matchReasons: {
      traditional: 'Traditional spring layout with a familiar bounce feel',
      mediumYard: '12ft footprint suits medium-sized family backyards',
      valueForMoney: 'Solid value for families who want a straightforward backyard trampoline',
      warranty: '5-year frame warranty with 2 years on the mat and 1 year on the net',
    },
  },

  {
    id: 'lifespan-bouncezone-m-7x10',
    displayName: 'BounceZone M Rectangular Spring 7×10',
    brand: 'Lifespan Kids',
    springType: 'traditional',
    shape: 'rectangle',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [10],
    displaySize: '7×10ft rectangle',
    image: '/images/lifespan-kids/bouncezone-m-rectangular-spring.jpg',
    slug: 'lifespan-bouncezone-m-7x10',
    isVuly: false,
    fitsYard: { small: false, medium: true, large: true, longNarrow: true },
    bestFor: 'Longer, narrower backyards that suit a compact rectangle better than a round trampoline.',
    metricScores: { bounce: 8, durability: 6, value: 7, warranty: 5 },
    matchReasons: {
      traditional: 'Rectangle spring layout offers a more directional bounce',
      shapeRectangle: '7×10ft rectangle: the shape you asked for in a compact footprint',
      mediumYard: '7×10ft rectangle fits many medium backyards with better length use',
      largeYard: 'Rectangle footprint opens up more jumping length in a bigger yard',
      longNarrowYard: 'Rectangle format is a natural fit for long, narrow yard shapes',
      bounce: 'Rectangle shape gives a more even bounce across the mat',
      warranty: '5-year frame warranty with 2 years on the mat and 1 year on the net',
    },
  },

  // ─── Kahuna ───────────────────────────────────────────────────────────────

  {
    id: 'kahuna-classic-12ft',
    displayName: 'Classic 12ft',
    brand: 'Kahuna',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [12],
    displaySize: '12ft',
    image: '/images/kahuna/classic-12ft.jpg',
    slug: 'kahuna-classic-12ft',
    isVuly: false,
    fitsYard: { small: false, medium: true, large: false, longNarrow: false },
    bestFor: 'Budget Australian families who just want a simple 12ft backyard trampoline.',
    metricScores: { bounce: 7, durability: 5, value: 9, warranty: 4 },
    matchReasons: {
      traditional: 'Traditional spring setup with a straightforward family bounce',
      mediumYard: '12ft, a common size for a medium yard',
      valueForMoney: 'Strong value if your main goal is a cheap family-size trampoline',
    },
  },

  {
    id: 'kahuna-blizzard-10ft',
    displayName: 'Blizzard 10ft',
    brand: 'Kahuna',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [10],
    displaySize: '10ft',
    image: '/images/kahuna/blizzard-10ft.jpg',
    slug: 'kahuna-blizzard-10ft',
    isVuly: false,
    fitsYard: { small: true, medium: false, large: false, longNarrow: false },
    bestFor: 'Smaller Australian backyards looking for a cheap 10ft round model.',
    metricScores: { bounce: 7, durability: 5, value: 9, warranty: 4 },
    matchReasons: {
      traditional: 'Traditional spring setup keeps the bounce familiar and simple',
      smallYard: '10ft, a practical size for smaller backyards',
      valueForMoney: 'Budget-first value for a simple round family trampoline',
    },
  },

  {
    id: 'kahuna-oval-10x15',
    displayName: 'Oval 10×15',
    brand: 'Kahuna',
    springType: 'traditional',
    shape: 'oval',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [15],
    displaySize: '10×15ft oval',
    image: '/images/kahuna/oval-10x15.jpg',
    slug: 'kahuna-oval-10x15',
    isVuly: false,
    fitsYard: { small: false, medium: false, large: true, longNarrow: true },
    bestFor: 'Large or long-narrow yards that need length more than width.',
    metricScores: { bounce: 8, durability: 5, value: 7, warranty: 4 },
    matchReasons: {
      traditional: 'Traditional spring setup in an oval footprint',
      largeYard: '10×15ft oval suits larger yards that have the length to spare',
      longNarrowYard: 'Oval format uses long, narrow yard space better than a large round trampoline',
      bounce: 'Oval layout gives a longer jumping lane',
    },
  },

  // ─── OZ Trampolines ────────────────────────────────────────────────────────

  {
    id: 'oz-summit-8ft',
    displayName: 'Summit 8ft',
    brand: 'OZ Trampolines',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [8],
    displaySize: '8ft',
    image: '/images/oz-trampolines/summit.jpeg',
    slug: 'oz-summit-8ft',
    isVuly: false,
    fitsYard: { small: true, medium: false, large: false, longNarrow: false },
    bestFor: 'Budget-first Australian families needing a small, AU-standards-compliant option.',
    metricScores: { bounce: 7, durability: 6, value: 10, warranty: 5 },
    matchReasons: {
      traditional: 'Traditional spring setup with a familiar bounce',
      meetsStandards: 'Meets Australian AS 4989:2015 standard',
      smallYard: '8ft, one of the smallest sizes sold, for tight spaces',
      valueForMoney: 'Most affordable way to get an AU-standards-compliant trampoline into a small yard',
    },
  },

  {
    id: 'oz-summit-10ft',
    displayName: 'Summit 10ft',
    brand: 'OZ Trampolines',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [10],
    displaySize: '10ft',
    image: '/images/oz-trampolines/summit.jpeg',
    slug: 'oz-summit-10ft',
    isVuly: false,
    fitsYard: { small: true, medium: false, large: false, longNarrow: false },
    bestFor: 'Budget Australian families wanting a larger small-yard option.',
    metricScores: { bounce: 7, durability: 6, value: 10, warranty: 5 },
    matchReasons: {
      traditional: 'Traditional spring setup with a familiar bounce',
      meetsStandards: 'Meets Australian AS 4989:2015 standard',
      smallYard: '10ft, which fits small to medium yards',
      valueForMoney: 'Most affordable 10ft option from an AU-standards-compliant brand',
    },
  },

  {
    id: 'oz-summit-12ft',
    displayName: 'Summit 12ft',
    brand: 'OZ Trampolines',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [12],
    displaySize: '12ft',
    image: '/images/oz-trampolines/summit.jpeg',
    slug: 'oz-summit-12ft',
    isVuly: false,
    fitsYard: { small: false, medium: true, large: false, longNarrow: false },
    bestFor: 'Budget Australian families with a medium yard.',
    metricScores: { bounce: 7, durability: 6, value: 10, warranty: 5 },
    matchReasons: {
      traditional: 'Traditional spring setup with a familiar bounce',
      meetsStandards: 'Meets Australian AS 4989:2015 standard',
      mediumYard: '12ft, which fits medium-sized backyards, at the lowest price point',
      valueForMoney: 'Most affordable 12ft option that meets AU standards',
    },
  },

  {
    id: 'oz-summit-14ft',
    displayName: 'Summit 14ft',
    brand: 'OZ Trampolines',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [14],
    displaySize: '14ft',
    image: '/images/oz-trampolines/summit.jpeg',
    slug: 'oz-summit-14ft',
    isVuly: false,
    fitsYard: { small: false, medium: false, large: true, longNarrow: false },
    bestFor: 'Budget Australian families with a large yard.',
    metricScores: { bounce: 7, durability: 6, value: 10, warranty: 5 },
    matchReasons: {
      traditional: 'Traditional spring setup',
      meetsStandards: 'Meets Australian AS 4989:2015 standard',
      largeYard: '14ft, a large size at the lowest price point',
      valueForMoney: 'Most affordable 14ft option that meets AU standards',
    },
  },

  // ─── GeeTramp ──────────────────────────────────────────────────────────────

  {
    id: 'geetramp-curve',
    displayName: 'Curve',
    brand: 'GeeTramp',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [10, 12],
    displaySize: '10ft or 12ft',
    image: '/images/geetramp/curve-12-ft.webp',
    slug: 'geetramp-curve',
    isVuly: false,
    fitsYard: { small: true, medium: true, large: false, longNarrow: false },
    bestFor: 'Value-focused families who want a round with a 10-year frame warranty.',
    metricScores: { bounce: 8, durability: 8, value: 9, warranty: 8 },
    matchReasons: {
      traditional: 'Traditional coil-spring system with a familiar bounce',
      shapeRound: 'Classic round shape with an even, centre-guiding bounce',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      smallYard: 'Available in 10ft, which fits smaller backyards',
      mediumYard: 'Available in 12ft, which suits a medium-sized backyard',
      valueForMoney: '10-year frame warranty at a budget-round price',
      durability: 'Heavier-gauge frame than most budget rounds, backed by a 10-year frame warranty',
      warranty: '10-year frame and 3-year mat warranty from GeeTramp',
    },
  },

  {
    id: 'geetramp-force-7x10',
    displayName: 'Force 7×10',
    brand: 'GeeTramp',
    springType: 'traditional',
    shape: 'rectangle',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [10],
    displaySize: '7×10ft rectangle',
    image: '/images/geetramp/force-7-x-10-ft.webp',
    slug: 'geetramp-force-7x10',
    isVuly: false,
    fitsYard: { small: true, medium: true, large: false, longNarrow: true },
    bestFor: 'Smaller yards that still want a true performance rectangle.',
    metricScores: { bounce: 10, durability: 9, value: 7, warranty: 9 },
    matchReasons: {
      traditional: 'Coil-spring rectangle with a gymnast-style bounce',
      shapeRectangle: 'True 7×10ft rectangle: the smallest gymnast-style jump lane in the range',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      smallYard: '7×10ft footprint, a rectangle that fits a smaller backyard',
      mediumYard: '7×10ft rectangle leaves plenty of clearance in a medium yard',
      longNarrowYard: 'Rectangle format is a natural fit for long, narrow yard shapes',
      bounce: 'GeeTramp Force is known for one of the best bounces in its class',
      durability: 'Heavy-duty frame with a 10-year warranty',
      warranty: '10-year frame, 3-year mat and 2-year net warranty',
    },
  },

  {
    id: 'geetramp-force-8x12',
    displayName: 'Force 8×12',
    brand: 'GeeTramp',
    springType: 'traditional',
    shape: 'rectangle',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [12],
    displaySize: '8×12ft rectangle',
    image: '/images/geetramp/force-8-x-12-ft.webp',
    slug: 'geetramp-force-8x12',
    isVuly: false,
    fitsYard: { small: false, medium: true, large: true, longNarrow: true },
    bestFor: 'Families wanting the most popular Force size for all-round performance.',
    metricScores: { bounce: 10, durability: 9, value: 7, warranty: 9 },
    matchReasons: {
      traditional: 'Coil-spring rectangle with a gymnast-style bounce',
      shapeRectangle: '8×12ft rectangle: a straight jump lane for training or play',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      mediumYard: '8×12ft rectangle uses a medium yard\'s length efficiently',
      largeYard: 'Leaves room to spare in a large yard',
      longNarrowYard: 'Rectangle format is a natural fit for long, narrow yard shapes',
      bounce: 'GeeTramp Force is known for one of the best bounces in its class',
      durability: 'Heavy-duty frame with a 10-year warranty',
      warranty: '10-year frame, 3-year mat and 2-year net warranty',
    },
  },

  {
    id: 'geetramp-force-9x14',
    displayName: 'Force 9×14',
    brand: 'GeeTramp',
    springType: 'traditional',
    shape: 'rectangle',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [14],
    displaySize: '9×14ft rectangle',
    image: '/images/geetramp/force-9-x-14-ft.webp',
    slug: 'geetramp-force-9x14',
    isVuly: false,
    fitsYard: { small: false, medium: false, large: true, longNarrow: true },
    bestFor: 'Bigger yards and serious jumpers who want a full-size performance rectangle.',
    metricScores: { bounce: 10, durability: 9, value: 7, warranty: 9 },
    matchReasons: {
      traditional: 'Coil-spring rectangle with a gymnast-style bounce',
      shapeRectangle: '9×14ft rectangle: a full-length gymnast-style jump lane',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      largeYard: '9×14ft rectangle makes the most of a large backyard',
      longNarrowYard: 'Rectangle format is a natural fit for long, narrow yard shapes',
      bounce: 'GeeTramp Force is known for one of the best bounces in its class',
      durability: 'Heavy-duty frame with a 10-year warranty',
      warranty: '10-year frame, 3-year mat and 2-year net warranty',
    },
  },

  {
    id: 'geetramp-force-10x17',
    displayName: 'Force 10×17',
    brand: 'GeeTramp',
    springType: 'traditional',
    shape: 'rectangle',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [17],
    displaySize: '10×17ft rectangle',
    image: '/images/geetramp/force-10-x-17-ft.webp',
    slug: 'geetramp-force-10x17',
    isVuly: false,
    fitsYard: { small: false, medium: false, large: true, longNarrow: true },
    bestFor: 'Large yards wanting an olympic-length rectangle without the import price tag.',
    metricScores: { bounce: 10, durability: 9, value: 7, warranty: 9 },
    matchReasons: {
      traditional: 'Coil-spring rectangle with a gymnast-style bounce',
      shapeRectangle: '10×17ft rectangle: a near olympic-length jump lane',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      largeYard: '10×17ft needs a big yard and gives a huge jumping surface',
      longNarrowYard: '17ft of length suits a long, narrow yard',
      bounce: 'GeeTramp Force is known for one of the best bounces in its class',
      durability: 'Heavy-duty frame with a 10-year warranty',
      warranty: '10-year frame, 3-year mat and 2-year net warranty',
    },
  },

  {
    id: 'geetramp-force-14x16',
    displayName: 'Force 14×16',
    brand: 'GeeTramp',
    springType: 'traditional',
    shape: 'rectangle',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [16],
    displaySize: '14×16ft rectangle',
    image: '/images/geetramp/force-14-x-16-ft.webp',
    slug: 'geetramp-force-14x16',
    isVuly: false,
    fitsYard: { small: false, medium: false, large: true, longNarrow: false },
    bestFor: 'Huge open yards wanting the biggest jump surface GeeTramp makes.',
    metricScores: { bounce: 10, durability: 9, value: 6, warranty: 9 },
    matchReasons: {
      traditional: 'Coil-spring rectangle with a gymnast-style bounce',
      shapeRectangle: '14×16ft near-square rectangle: a very large straight-edged jump area',
      meetsStandards: 'Meets Australian AS 4989:2015 safety standard',
      largeYard: '14×16ft is the biggest Force, for genuinely large yards',
      bounce: 'GeeTramp Force is known for one of the best bounces in its class',
      durability: 'Heavy-duty frame with a 10-year warranty',
      warranty: '10-year frame, 3-year mat and 2-year net warranty',
    },
  },

  // ─── ACON ──────────────────────────────────────────────────────────────────

  {
    id: 'acon-air-gen2',
    displayName: 'Air GEN2',
    brand: 'ACON',
    springType: 'traditional',
    shape: 'round',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [12, 14, 15],
    displaySize: '12ft, 14ft or 15ft',
    image: '/images/acon/air-gen2-14-ft.webp',
    slug: 'acon-air-gen2',
    isVuly: false,
    fitsYard: { small: false, medium: true, large: true, longNarrow: false },
    bestFor: 'Families wanting a heavy-duty Finnish round for year-round outdoor use.',
    metricScores: { bounce: 8, durability: 9, value: 6, warranty: 8 },
    matchReasons: {
      traditional: 'High spring count for a deep bounce',
      shapeRound: 'Classic round shape with an even, centre-guiding bounce',
      meetsStandards: 'ACON states Australian certification for the 14ft and 15ft sizes',
      mediumYard: 'Available in 12ft, which suits a medium-sized backyard',
      largeYard: 'Available up to 15ft for your large backyard',
      bounce: 'ACON\'s high spring count gives a deep bounce',
      durability: 'Designed to stay outside year-round, including Finnish winters',
      warranty: '10-year frame and 5-year mat warranty',
    },
  },

  {
    id: 'acon-16-hd-10x17',
    displayName: '16 HD',
    brand: 'ACON',
    springType: 'traditional',
    shape: 'rectangle',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [17],
    displaySize: '10×17ft rectangle',
    image: '/images/acon/16-hd-10-x-17-ft.webp',
    slug: 'acon-16-hd-10x17',
    isVuly: false,
    fitsYard: { small: false, medium: false, large: true, longNarrow: true },
    bestFor: 'Families and teens wanting a heavy-duty rectangle for a large backyard.',
    metricScores: { bounce: 10, durability: 10, value: 5, warranty: 8 },
    matchReasons: {
      traditional: '140 coil springs give a deep rectangle bounce',
      shapeRectangle: '10×17ft heavy-duty rectangle with a long straight jump lane',
      meetsStandards: 'ACON states Australian certification for the 16 HD',
      largeYard: '10×17ft footprint suits large open backyards',
      longNarrowYard: '17ft of length suits a long, narrow yard',
      bounce: 'One of the most powerful bounces of any backyard rectangle',
      durability: 'Heavy-duty frame backed by a 10-year frame warranty',
      warranty: '10-year frame and 5-year mat warranty',
    },
  },

  {
    id: 'acon-x-10x17',
    displayName: 'X',
    brand: 'ACON',
    springType: 'traditional',
    shape: 'rectangle',
    advancedSafety: false,
    meetsUSStandards: false,
    availableIn: ['AU'],
    sizes: [17],
    displaySize: '10×17ft rectangle',
    image: '/images/acon/x-10-x-17-ft.webp',
    slug: 'acon-x-10x17',
    isVuly: false,
    fitsYard: { small: false, medium: false, large: true, longNarrow: true },
    bestFor: 'Athletes and gymnasts who want ACON\'s flagship performance rectangle.',
    metricScores: { bounce: 10, durability: 10, value: 3, warranty: 8 },
    matchReasons: {
      traditional: '120 performance springs on a flagship rectangle frame',
      shapeRectangle: '10×17ft rectangle, ACON\'s top performance model',
      largeYard: '10×17ft footprint needs a large open yard',
      bounce: '120 performance springs for a gym-style bounce',
      durability: 'Frame designed for daily athletic training',
      warranty: '10-year frame and 5-year mat warranty',
    },
  },
];

type CompareMatcher = {
  brand: string;
  model: string;
  size?: string;
};

export const compareMatchers: Record<string, CompareMatcher> = {
  'vuly-thunder-2-pro': { brand: 'Vuly', model: 'Thunder 2 Pro' },
  'vuly-thunder-2': { brand: 'Vuly', model: 'Thunder 2' },
  'vuly-ultra-2-pro': { brand: 'Vuly', model: 'Ultra 2 Pro' },
  'vuly-ultra-2': { brand: 'Vuly', model: 'Ultra 2' },
  'vuly-flare': { brand: 'Vuly', model: 'Flare' },
  'springfree-mini-round': { brand: 'Springfree', model: 'Mini Round Trampoline' },
  'springfree-compact-round': { brand: 'Springfree', model: 'Compact Round Trampoline' },
  'springfree-medium-round': { brand: 'Springfree', model: 'Medium Round Trampoline' },
  'springfree-jumbo-round': { brand: 'Springfree', model: 'Jumbo Round Trampoline' },
  'springfree-compact-oval': { brand: 'Springfree', model: 'Compact Oval Trampoline' },
  'springfree-medium-oval': { brand: 'Springfree', model: 'Medium Oval Trampoline' },
  'springfree-large-oval': { brand: 'Springfree', model: 'Large Oval Trampoline' },
  'springfree-jumbo-oval': { brand: 'Springfree', model: 'Jumbo Oval Trampoline' },
  'springfree-medium-square': { brand: 'Springfree', model: 'Medium Square Trampoline' },
  'springfree-large-square': { brand: 'Springfree', model: 'Large Square Trampoline' },
  'jumpflex-flex-10ft': { brand: 'Jumpflex', model: 'FLEX', size: '10 ft' },
  'jumpflex-flex-12ft': { brand: 'Jumpflex', model: 'FLEX', size: '12 ft' },
  'jumpflex-hero-10ft': { brand: 'Jumpflex', model: 'HERO', size: '10 ft' },
  'jumpflex-hero-12ft': { brand: 'Jumpflex', model: 'HERO', size: '12 ft' },
  'jumpflex-hero-14ft': { brand: 'Jumpflex', model: 'HERO', size: '14 ft' },
  'jumpflex-hero-15ft': { brand: 'Jumpflex', model: 'HERO', size: '15 ft' },
  'jumpflex-mega-14ft': { brand: 'Jumpflex', model: 'MEGA', size: '14 ft' },
  'jumpflex-mega-17ft': { brand: 'Jumpflex', model: 'MEGA', size: '17 ft' },
  'jumpflex-mega-19ft': { brand: 'Jumpflex', model: 'MEGA', size: '19 ft' },
  'lifespan-hyperjump-3-10ft': { brand: 'Lifespan Kids', model: 'HyperJump 3 Springless', size: '10 ft' },
  'lifespan-bouncezone-12ft': { brand: 'Lifespan Kids', model: 'BounceZone Round Spring', size: '12 ft' },
  'lifespan-bouncezone-m-7x10': { brand: 'Lifespan Kids', model: 'BounceZone M Rectangular Spring', size: '7 x 10 ft' },
  'kahuna-classic-12ft': { brand: 'Kahuna', model: 'Classic (Round with Enclosure)', size: '12 ft' },
  'kahuna-blizzard-10ft': { brand: 'Kahuna', model: 'Blizzard (Round)', size: '10 ft' },
  'kahuna-oval-10x15': { brand: 'Kahuna', model: 'Oval', size: '10 x 15 ft' },
  'oz-summit-8ft': { brand: 'Oz Trampolines', model: 'Summit Round', size: '8 ft' },
  'oz-summit-10ft': { brand: 'Oz Trampolines', model: 'Summit Round', size: '10 ft' },
  'oz-summit-12ft': { brand: 'Oz Trampolines', model: 'Summit Round', size: '12 ft' },
  'oz-summit-14ft': { brand: 'Oz Trampolines', model: 'Summit Round', size: '14 ft' },
  'geetramp-curve': { brand: 'GeeTramp', model: 'Curve' },
  'geetramp-force-7x10': { brand: 'GeeTramp', model: 'Force', size: '7 x 10 ft' },
  'geetramp-force-8x12': { brand: 'GeeTramp', model: 'Force', size: '8 x 12 ft' },
  'geetramp-force-9x14': { brand: 'GeeTramp', model: 'Force', size: '9 x 14 ft' },
  'geetramp-force-10x17': { brand: 'GeeTramp', model: 'Force', size: '10 x 17 ft' },
  'geetramp-force-14x16': { brand: 'GeeTramp', model: 'Force', size: '14 x 16 ft' },
  'acon-air-gen2': { brand: 'ACON', model: 'Air GEN2' },
  'acon-16-hd-10x17': { brand: 'ACON', model: '16 HD', size: '10 x 17 ft' },
  'acon-x-10x17': { brand: 'ACON', model: 'X', size: '10 x 17 ft' },
};

function getCompareRows(slug: string): CompareTrampoline[] {
  const matcher = compareMatchers[slug];
  if (!matcher) return [];

  return COMPARE_ROWS.filter((row) => {
    if (row.brand !== matcher.brand) return false;
    if (row.model !== matcher.model) return false;
    if (matcher.size && row.size !== matcher.size) return false;
    return true;
  });
}

const SIZE_AWARE_SLUGS = new Set(['vuly-flare', 'acon-air-gen2']);

function approximateFeet(row: CompareTrampoline): number | null {
  const feetMatch = row.size.match(/^(\d+(?:\.\d+)?)\s*ft$/i);
  if (feetMatch) return Number(feetMatch[1]);
  if (row.overallDiamCm !== null) return Math.round(row.overallDiamCm / 30.48);
  return null;
}

function sizeDisplayLabel(row: CompareTrampoline): string {
  const compactSize = row.size.replace(/\s+ft$/i, 'ft');
  if (/^[SMLX]+$/i.test(row.size) && row.overallDiamCm !== null) {
    return `${row.size} (${row.overallDiamCm}cm overall)`;
  }
  return compactSize;
}

function joinSizeLabels(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? '';
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')} or ${labels.at(-1)}`;
}

function getSizeOptions(rows: CompareTrampoline[]): QuizSizeOption[] {
  return rows.flatMap((row) => {
    const approximateFt = approximateFeet(row);
    if (approximateFt === null || row.priceAud === null) return [];
    return [{
      approximateFt,
      displayLabel: sizeDisplayLabel(row),
      priceAud: row.priceAud,
      meetsAUStandards: row.meetsAuStd,
    }];
  });
}

export const trampolines: Trampoline[] = baseTrampolines.map((trampoline) => {
  const rows = getCompareRows(trampoline.slug);
  if (rows.length === 0) {
    throw new Error(`Quiz model "${trampoline.slug}" has no matching Aus-tab catalogue rows`);
  }

  const prices = rows.flatMap((row) => row.priceAud === null ? [] : [row.priceAud]);
  if (prices.length === 0) {
    throw new Error(`Quiz model "${trampoline.slug}" has no Aus-tab catalogue price`);
  }

  const sizeOptions = SIZE_AWARE_SLUGS.has(trampoline.slug) ? getSizeOptions(rows) : undefined;
  if (SIZE_AWARE_SLUGS.has(trampoline.slug) && sizeOptions?.length !== rows.length) {
    throw new Error(`Quiz model "${trampoline.slug}" has incomplete Aus-tab size facts`);
  }

  return {
    ...trampoline,
    priceFrom: Math.min(...prices),
    meetsAUStandards: rows.every((row) => row.meetsAuStd),
    ...(sizeOptions
      ? {
          sizes: sizeOptions.map((option) => option.approximateFt),
          displaySize: joinSizeLabels(sizeOptions.map((option) => option.displayLabel)),
          sizeOptions,
        }
      : {}),
  };
});

export function getEligibleTrampolines(country: Country) {
  const resolvedCountry = resolveQuizCountry(country);
  return trampolines.filter((t) => t.availableIn.includes(resolvedCountry));
}
