import { WEB_AND_WAREHOUSE_TRACKING_ID } from '../../lib/links';
import { getPromoForBrand, type BrandPromo } from '../../lib/promoCtas';

export type CapturePage = {
  /** Always the brand's own URL, never an affiliate link, so automated visits aren't counted as clicks. */
  url: string;
  /** Screenshot the top of the page so offers that only appear in banner images can be read. */
  screenshot: boolean;
};

export type StructuredSource =
  /** Vuly mounts each product tile with its prices, savings and free items as JSON. */
  | { kind: 'vuly'; pageUrl: string }
  /** Shopify's public products feed, which carries compare-at (was) prices. */
  | { kind: 'shopify'; productsUrl: string };

export type DealLink = {
  /** What the published page links to. Partner links carry the affiliate tracking. */
  href: string;
  /** The same destination without tracking, loaded in a browser before publishing. */
  checkUrl: string;
  label: string;
};

export type Brand = {
  name: string;
  pages: CapturePage[];
  structured?: StructuredSource;
  /** True when we have an affiliate program with the brand or store. */
  partner: boolean;
  saleLink: DealLink;
  /** Used when the brand has a promo code but no sale, so the link doesn't land on an empty promo page. */
  noSaleLink: DealLink;
  promo: BrandPromo | null;
  /** What each promo code does, finishing the sentence "Code **X** ...". Every code in `promo` needs one. */
  codeNotes: Record<string, string>;
};

const VULY_AFFILIATE = 'https://www.vulyplay.com/aff/100/';

function withParam(url: string, key: string, value: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set(key, value);
  return parsed.href;
}

function lifespanTracked(url: string): string {
  const promo = getPromoForBrand('Lifespan Kids');
  const rfsn = promo ? new URL(promo.href).searchParams.get('rfsn') : null;
  if (!rfsn) throw new Error('Lifespan Kids promo href in lib/promoCtas.ts has no rfsn affiliate ID.');
  return withParam(url, 'rfsn', rfsn);
}

const webAndWarehouseTracked = (url: string) => withParam(url, 'tracking', WEB_AND_WAREHOUSE_TRACKING_ID);

export const BRANDS: Brand[] = [
  {
    name: 'Vuly',
    pages: [
      { url: 'https://www.vulyplay.com/en-AU/promo', screenshot: true },
      { url: 'https://www.vulyplay.com/en-AU/trampoline', screenshot: true },
    ],
    structured: { kind: 'vuly', pageUrl: 'https://www.vulyplay.com/en-AU/trampoline' },
    partner: true,
    saleLink: {
      href: `${VULY_AFFILIATE}?url=promo`,
      checkUrl: 'https://www.vulyplay.com/en-AU/promo',
      label: 'See the Vuly sale',
    },
    noSaleLink: {
      href: `${VULY_AFFILIATE}?url=trampoline`,
      checkUrl: 'https://www.vulyplay.com/en-AU/trampoline',
      label: 'Vuly trampolines',
    },
    promo: getPromoForBrand('Vuly'),
    codeNotes: {
      BOUNCE15: 'gives a discount on any new Vuly trampoline at checkout',
      BOUNCESURGE: 'adds a free gift',
    },
  },
  {
    name: 'Springfree',
    pages: [
      { url: 'https://www.springfreetrampoline.com.au/', screenshot: true },
      { url: 'https://www.springfreetrampoline.com.au/collections/trampolines', screenshot: false },
    ],
    structured: {
      kind: 'shopify',
      productsUrl: 'https://www.springfreetrampoline.com.au/collections/trampolines/products.json',
    },
    partner: true,
    saleLink: {
      href: '/go/springfree-trampolines/',
      checkUrl: 'https://www.springfreetrampoline.com.au/collections/trampolines',
      label: 'See the Springfree sale',
    },
    noSaleLink: {
      href: '/go/springfree-trampolines/',
      checkUrl: 'https://www.springfreetrampoline.com.au/collections/trampolines',
      label: 'Springfree trampolines',
    },
    promo: null,
    codeNotes: {},
  },
  {
    name: 'Lifespan Kids',
    pages: [
      { url: 'https://www.lifespankids.com.au/', screenshot: true },
      { url: 'https://www.lifespankids.com.au/collections/trampolines', screenshot: true },
    ],
    // The trampolines collection feed comes back empty, so filter the store-wide feed instead.
    structured: { kind: 'shopify', productsUrl: 'https://www.lifespankids.com.au/products.json' },
    partner: true,
    saleLink: {
      href: lifespanTracked('https://www.lifespankids.com.au/collections/trampolines'),
      checkUrl: 'https://www.lifespankids.com.au/collections/trampolines',
      label: 'See the Lifespan Kids sale',
    },
    noSaleLink: {
      href: lifespanTracked('https://www.lifespankids.com.au/collections/trampolines'),
      checkUrl: 'https://www.lifespankids.com.au/collections/trampolines',
      label: 'Lifespan Kids trampolines',
    },
    promo: getPromoForBrand('Lifespan Kids'),
    codeNotes: {
      BOUNCE5: 'gives a discount at checkout',
    },
  },
  {
    name: 'Web and Warehouse',
    pages: [
      { url: 'https://webandwarehouse.com.au/', screenshot: true },
      { url: 'https://webandwarehouse.com.au/sale-c379', screenshot: false },
    ],
    partner: true,
    saleLink: {
      href: webAndWarehouseTracked('https://webandwarehouse.com.au/sale-c379'),
      checkUrl: 'https://webandwarehouse.com.au/sale-c379',
      label: 'See the Web and Warehouse sale',
    },
    noSaleLink: {
      href: webAndWarehouseTracked('https://webandwarehouse.com.au/collections/trampolines-87'),
      checkUrl: 'https://webandwarehouse.com.au/collections/trampolines-87',
      label: 'Web and Warehouse trampolines',
    },
    // Web and Warehouse's code is filed under GeeTramp, one of the brands it stocks.
    promo: getPromoForBrand('GeeTramp'),
    codeNotes: {
      BOUNCE: 'gives a discount at checkout',
    },
  },
  {
    name: 'Jumpflex',
    pages: [
      { url: 'https://www.jumpflex.com.au/', screenshot: true },
      { url: 'https://www.jumpflex.com.au/collections/trampolines', screenshot: true },
    ],
    partner: false,
    saleLink: {
      href: 'https://www.jumpflex.com.au/collections/trampolines',
      checkUrl: 'https://www.jumpflex.com.au/collections/trampolines',
      label: 'See the Jumpflex sale',
    },
    noSaleLink: {
      href: 'https://www.jumpflex.com.au/collections/trampolines',
      checkUrl: 'https://www.jumpflex.com.au/collections/trampolines',
      label: 'Jumpflex trampolines',
    },
    promo: null,
    codeNotes: {},
  },
  {
    name: 'Oz Trampolines',
    pages: [{ url: 'https://www.oztrampolines.com.au/deals.asp', screenshot: true }],
    partner: false,
    saleLink: {
      href: 'https://www.oztrampolines.com.au/deals.asp',
      checkUrl: 'https://www.oztrampolines.com.au/deals.asp',
      label: 'See the Oz Trampolines sale',
    },
    noSaleLink: {
      href: 'https://www.oztrampolines.com.au/deals.asp',
      checkUrl: 'https://www.oztrampolines.com.au/deals.asp',
      label: 'Oz Trampolines deals',
    },
    promo: null,
    codeNotes: {},
  },
];
