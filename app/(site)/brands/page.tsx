import type { Metadata } from 'next';
import Link from 'next/link';
import BrandLogoAvatar from '@/components/BrandLogoAvatar';
import JsonLd from '@/components/compare/JsonLd';
import RelatedComparisons, { type RelatedLink } from '@/components/compare/RelatedComparisons';
import type { Trampoline } from '@/data/trampolines';
import { getAllBrands, getBrandRows, type BrandInfo } from '@/lib/brands';
import { comparePageBrands, comparePageHref, getComparePages } from '@/lib/comparePages';
import {
  BRAND_COLORS,
  FALLBACK_BRAND_COLOR,
  compareSizeLabel,
  groupPriceRange,
  groupRows,
  longestFootprintCm,
} from '@/lib/compareShared';

const SITE_URL = 'https://bouncearena.com.au';

const TITLE = 'Australian Trampoline Brands: Models, Prices and Specs';
const DESCRIPTION =
  'Every major trampoline brand sold in Australia, including Vuly, Springfree, Jumpflex, Oz Trampolines and Kmart, with prices, sizes, warranties and safety standards.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/brands/` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/brands/`,
    siteName: 'Bounce Arena',
    type: 'website',
    images: [{
      url: `${SITE_URL}/images/posts/kids-bouncing-on-trampoline.jpg`,
      width: 1200,
      height: 800,
      alt: 'Children enjoying a backyard trampoline',
    }],
  },
};

function formatAud(value: number): string {
  return `$${value.toLocaleString('en-AU')}`;
}

function priceLabel(rows: Trampoline[]) {
  const range = groupPriceRange(rows);
  if (!range) return 'Price varies';
  if (range.low === range.high) return range.hasFromPrice ? `From ${formatAud(range.low)}` : formatAud(range.low);
  return (
    <>
      {formatAud(range.low)}
      <span className="ml-1 text-[10px] font-normal text-black/35">to {formatAud(range.high)}</span>
    </>
  );
}

function largestSizeLabel(rows: Trampoline[]): string | null {
  const largest = [...rows].sort((a, b) => (longestFootprintCm(b) ?? 0) - (longestFootprintCm(a) ?? 0))[0];
  return largest ? compareSizeLabel(largest) : null;
}

function BrandCard({
  brand,
  rows,
  comparisons,
}: {
  brand: BrandInfo;
  rows: Trampoline[];
  comparisons: number;
}) {
  const groups = groupRows(rows);
  const chip = BRAND_COLORS[brand.name] ?? FALLBACK_BRAND_COLOR;
  const largest = largestSizeLabel(rows);

  return (
    <Link
      href={`/brands/${brand.slug}/`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white transition-all hover:-translate-y-0.5 hover:border-[#38b1ab]/40 hover:shadow-[0_16px_38px_rgba(0,0,0,0.07)]"
    >
      <div className="flex aspect-[4/3] items-center justify-center border-b border-black/[0.06] bg-gray-50 p-7">
        <BrandLogoAvatar
          name={brand.name}
          width={210}
          height={112}
          className="shadow-sm transition-transform duration-500 group-hover:scale-[1.03]"
          imageClassName="p-4"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className={`mb-3 inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${chip}`}>
          {brand.name}
        </span>
        <h2 className="text-lg font-bold text-black">
          {brand.name.endsWith('Trampolines') ? brand.name : `${brand.name} Trampolines`}
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-black/60">{brand.blurb}</p>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-black/35">Models</dt>
            <dd className="mt-0.5 font-semibold text-black">{groups.length}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-black/35">Sizes</dt>
            <dd className="mt-0.5 font-semibold text-black">{rows.length}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-black/35">Price</dt>
            <dd className="mt-0.5 font-semibold text-black">{priceLabel(rows)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-black/35">Largest</dt>
            <dd className="mt-0.5 font-semibold text-black">{largest ?? '-'}</dd>
          </div>
        </dl>

        <span className="mt-5 text-sm font-semibold text-[#38b1ab]">
          View {brand.name} specs
          {comparisons > 0 ? ` and ${comparisons} comparison${comparisons === 1 ? '' : 's'}` : ''} →
        </span>
      </div>
    </Link>
  );
}

export default function BrandsPage() {
  const comparePages = getComparePages();
  const coverage = new Map<string, number>();
  for (const page of comparePages) {
    for (const name of comparePageBrands(page)) {
      coverage.set(name, (coverage.get(name) ?? 0) + 1);
    }
  }

  const brands = getAllBrands()
    .map((brand) => ({ brand, rows: getBrandRows(brand.name), comparisons: coverage.get(brand.name) ?? 0 }))
    .filter((entry) => entry.rows.length > 0);

  const popularComparisons: RelatedLink[] = comparePages
    .filter((page) => page.type === 'brand')
    .slice(0, 8)
    .map((page) => ({ href: comparePageHref(page.slug), label: page.title }));

  const guides: RelatedLink[] = [
    { href: '/compare/', label: 'All trampoline comparisons' },
    { href: '/models/', label: 'Compare every model side-by-side' },
    { href: '/quiz/', label: 'Take the trampoline quiz' },
    { href: '/reviews/', label: 'Trampoline reviews' },
  ];

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Brands', item: `${SITE_URL}/brands/` },
    ],
  };

  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/brands/`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: brands.map(({ brand }, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: brand.name,
        url: `${SITE_URL}/brands/${brand.slug}/`,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <JsonLd data={breadcrumb} />
      <JsonLd data={collection} />

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-black/40">
        <Link href="/" className="transition-colors hover:text-black">Home</Link>
        <span>/</span>
        <span className="text-black/60">Brands</span>
      </nav>

      <h1 className="mb-3 text-3xl font-bold text-black sm:text-4xl">Australian Trampoline Brands</h1>
      <p className="mb-6 max-w-2xl text-black/60">
        Every major trampoline brand sold in Australia, with prices, models, sizes, weight ratings,
        warranties and whether each model meets the Australian Trampoline Standard AS 4989:2015.
      </p>

      <div className="mb-10 rounded-2xl border border-[#38b1ab]/20 bg-[#38b1ab]/[0.06] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="font-semibold text-black">Want every model in one table?</p>
          <p className="mt-0.5 text-sm text-black/60">
            Filter every model from every brand by price, size, shape and spring type.
          </p>
        </div>
        <Link
          href="/models/"
          className="mt-3 inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#38b1ab] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2e9a94] sm:mt-0"
        >
          Compare all models →
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map(({ brand, rows, comparisons }) => (
          <BrandCard key={brand.slug} brand={brand} rows={rows} comparisons={comparisons} />
        ))}
      </div>

      {popularComparisons.length > 0 && (
        <RelatedComparisons heading="Popular brand comparisons" links={popularComparisons} />
      )}

      <RelatedComparisons heading="Keep looking" links={guides} />
    </div>
  );
}
