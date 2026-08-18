import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/compare/JsonLd';
import { AFFILIATE_DISCLOSURE } from '@/lib/compareShared';
import ModelsBrowseClient from './ModelsBrowseClient';

const SITE_URL = 'https://bouncearena.com.au';

const TITLE = 'Compare All Australian Trampolines by Price, Size and Warranty';
const DESCRIPTION =
  'Browse and filter every major trampoline sold in Australia. Compare price, size, weight rating, warranty and the Australian Trampoline Standard AS 4989:2015 side-by-side.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/models/` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/models/`,
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

export default function ModelsPage() {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'All Models', item: `${SITE_URL}/models/` },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumb} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-black/40">
          <Link href="/" className="transition-colors hover:text-black">Home</Link>
          <span>/</span>
          <span className="text-black/60">All models</span>
        </nav>

        <h1 className="mb-3 text-3xl font-bold text-black sm:text-4xl">Trampoline Comparison Table</h1>
        <p className="max-w-2xl text-black/60">
          Compare all major Australian trampolines side-by-side on price, size, weight rating, warranty, and the
          Australian Trampoline Standard AS 4989:2015. Filter and sort to find your match.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/45">{AFFILIATE_DISCLOSURE}</p>
        <p className="mt-4 text-sm text-black/60">
          Prefer to start with one brand?{' '}
          <Link href="/brands/" className="font-medium text-[#38b1ab] hover:underline">
            Browse brand pages →
          </Link>
          . Looking for a head-to-head?{' '}
          <Link href="/compare/" className="font-medium text-[#38b1ab] hover:underline">
            Browse our brand and model comparisons →
          </Link>
        </p>
      </div>

      <ModelsBrowseClient />
    </>
  );
}
