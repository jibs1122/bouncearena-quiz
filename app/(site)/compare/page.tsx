import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/compare/JsonLd';
import { BRANDS, brandSlug } from '@/lib/brands';
import {
  comparePageBrands,
  comparePageHref,
  getComparePages,
} from '@/lib/comparePages';
import ComparisonHubClient, {
  type HubBrand,
  type HubComparison,
} from './ComparisonHubClient';

const SITE_URL = 'https://bouncearena.com.au';

const TITLE = 'Trampoline Comparisons: Brand and Model Head-to-Heads';
const DESCRIPTION =
  'Side-by-side trampoline comparisons for Australian families — Vuly vs Springfree, Jumpflex vs Vuly, and model-by-model matchups built from published specs.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/compare/` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/compare/`,
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

function buildHubData(): { brands: HubBrand[]; comparisons: HubComparison[] } {
  const pages = getComparePages();
  const counts = new Map<string, HubBrand>();

  const comparisons: HubComparison[] = pages.map((page) => {
    const brands = comparePageBrands(page);

    for (const brand of brands) {
      const current = counts.get(brand) ?? {
        name: brand,
        slug: brandSlug(brand),
        brandCount: 0,
        modelCount: 0,
      };
      if (page.type === 'brand') current.brandCount += 1;
      else current.modelCount += 1;
      counts.set(brand, current);
    }

    return {
      slug: page.slug,
      href: comparePageHref(page.slug),
      title: page.title,
      description: page.description,
      type: page.type,
      brands,
      isDraft: page.publishStatus === 'draft',
    };
  });

  // Brands with comparisons first (most covered first), then the rest of the range.
  const order = new Map(BRANDS.map((brand, index) => [brand.name, index]));
  const brands = [...counts.values()].sort((a, b) => {
    const totalDelta = b.brandCount + b.modelCount - (a.brandCount + a.modelCount);
    if (totalDelta !== 0) return totalDelta;
    return (order.get(a.name) ?? 99) - (order.get(b.name) ?? 99);
  });

  return { brands, comparisons };
}

export default function CompareHubPage() {
  const { brands, comparisons } = buildHubData();

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE_URL}/compare/` },
    ],
  };

  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/compare/`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: comparisons.map((comparison, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: comparison.title,
        url: `${SITE_URL}${comparison.href}`,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <JsonLd data={breadcrumb} />
      {comparisons.length > 0 && <JsonLd data={collection} />}

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-black/40">
        <Link href="/" className="transition-colors hover:text-black">Home</Link>
        <span>/</span>
        <span className="text-black/60">Compare</span>
      </nav>

      <h1 className="mb-3 text-3xl font-bold text-black sm:text-4xl">Trampoline Comparisons</h1>
      <p className="mb-6 max-w-2xl text-black/60">
        Head-to-head comparisons of the trampoline brands and models sold in Australia, built from
        published specifications — spring system, size, weight ratings, warranty and the Australian
        Trampoline Standard AS 4989:2015.
      </p>

      <div className="mb-10 rounded-2xl border border-[#38b1ab]/20 bg-[#38b1ab]/[0.06] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="font-semibold text-black">Want every model in one table?</p>
          <p className="mt-0.5 text-sm text-black/60">
            Filter and sort all major Australian trampolines by price, size, warranty and safety standard.
          </p>
        </div>
        <Link
          href="/models/"
          className="mt-3 inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#38b1ab] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2e9a94] sm:mt-0"
        >
          Compare all models →
        </Link>
      </div>

      <ComparisonHubClient brands={brands} comparisons={comparisons} />

      <div className="mt-4 rounded-2xl bg-gray-50 p-7 text-center">
        <p className="mb-1 font-semibold text-black">Not sure which trampoline fits your yard?</p>
        <p className="mb-4 text-sm text-black/60">
          Our 2-minute quiz narrows the range to the models that suit your family, space and budget.
        </p>
        <Link
          href="/quiz/"
          className="inline-flex items-center gap-1 rounded-xl bg-[#38b1ab] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2e9a94]"
        >
          Take the trampoline quiz →
        </Link>
      </div>
    </div>
  );
}
