import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import BrandLogoAvatar from '@/components/BrandLogoAvatar';
import PostCard from '@/components/PostCard';
import JsonLd from '@/components/compare/JsonLd';
import { getAllBrands, getBrandRows } from '@/lib/brands';
import { comparePageBrands, getComparePages } from '@/lib/comparePages';
import { getPostsByCategory } from '@/lib/content';
import { groupPriceRange, groupRows } from '@/lib/compareShared';

/** Brands we cover most heavily, measured by how many comparisons feature them. */
function popularBrands(limit = 8) {
  const pages = getComparePages();
  const coverage = new Map<string, number>();
  for (const page of pages) {
    for (const brand of comparePageBrands(page)) {
      coverage.set(brand, (coverage.get(brand) ?? 0) + 1);
    }
  }

  return getAllBrands()
    .map((brand) => {
      const rows = getBrandRows(brand.name);
      const range = groupPriceRange(rows);
      return {
        ...brand,
        rows,
        families: groupRows(rows).length,
        fromPrice: range ? range.low : null,
        comparisons: coverage.get(brand.name) ?? 0,
      };
    })
    .filter((brand) => brand.families > 0)
    .sort((a, b) => b.comparisons - a.comparisons || b.families - a.families)
    .slice(0, limit);
}

function springTypeLabel(rows: Array<{ springless: boolean }>): string {
  const hasCoilSprings = rows.some((row) => !row.springless);
  const hasSpringless = rows.some((row) => row.springless);

  if (hasCoilSprings && hasSpringless) return 'coil spring and springless';
  if (hasSpringless) return 'springless';
  return 'coil springs';
}

export const metadata: Metadata = {
  title: { absolute: 'Bounce Arena – Australia\'s Trampoline Review & Comparison Guide' },
  description:
    'Unbiased trampoline reviews, brand comparisons, and buying advice for Australian families. Find the right trampoline with our free quiz.',
  verification: {
    google: 'BFFDRrI-ROvTm6R4VzXogMAZ0cKJNIzHtkP79mDBwQM',
  },
  openGraph: {
    title: 'Bounce Arena – Australia\'s Trampoline Review & Comparison Guide',
    description:
      'Unbiased trampoline reviews, brand comparisons, and buying advice for Australian families.',
    url: 'https://bouncearena.com.au',
    siteName: 'Bounce Arena',
    images: [{
      url: 'https://bouncearena.com.au/images/posts/kids-bouncing-on-trampoline.jpg',
      width: 1200,
      height: 800,
      alt: 'Children enjoying a backyard trampoline',
    }],
  },
  alternates: { canonical: 'https://bouncearena.com.au/' },
};

export default function HomePage() {
  const reviews = getPostsByCategory('reviews').slice(0, 4);
  const brands = popularBrands();
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Bounce Arena',
    url: 'https://bouncearena.com.au/',
    logo: 'https://bouncearena.com.au/BOUNCE-ARENA-LOGO.png',
    sameAs: [
      'https://www.facebook.com/people/Bounce-Arena/61558451366389/',
      'https://www.youtube.com/@BounceArena',
      'https://www.reddit.com/user/Bounce_Arena_Reviews/',
      'https://www.tiktok.com/@bouncearena.com.au',
    ],
  };
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Bounce Arena',
    url: 'https://bouncearena.com.au/',
    publisher: { '@type': 'Organization', name: 'Bounce Arena' },
  };

  return (
    <>
      <JsonLd data={organization} />
      <JsonLd data={website} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14 sm:py-20 flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl font-bold text-black leading-tight mb-4">
              Find the perfect <span className="text-[#38b1ab]">trampoline</span> for your family
            </h1>
            <p className="text-lg text-black/60 mb-8 max-w-lg mx-auto md:mx-0">
              Unbiased reviews and expert comparisons of Australia&apos;s top trampoline brands — Vuly, Springfree, JumpFlex and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                href="/quiz/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#38b1ab] hover:bg-[#2e9a94] text-white font-semibold px-7 py-3.5 transition-colors text-base"
              >
                Take the free quiz →
              </Link>
              <Link
                href="/models/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/15 hover:border-black/30 text-black font-medium px-7 py-3.5 transition-colors text-base"
              >
                Compare all trampolines
              </Link>
            </div>
          </div>

          <div className="flex-1 w-full max-w-sm md:max-w-none">
            <div className="relative aspect-[3/2] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/images/posts/kids-bouncing-on-trampoline.jpg"
                alt="Kids bouncing on a trampoline"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Popular brands */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-12">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-black">Popular brands</h2>
          <Link href="/brands/" className="text-sm font-medium text-[#38b1ab] hover:underline">
            All brands →
          </Link>
        </div>
        <p className="mb-6 max-w-2xl text-black/60">
          Prices, sizes, warranties and safety standards for the trampoline brands sold in Australia.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}/`}
              className="group flex flex-col rounded-2xl border border-black/[0.08] p-4 transition-colors hover:border-[#38b1ab]/50"
            >
              <BrandLogoAvatar
                name={brand.name}
                width={180}
                height={64}
                fluid
                className="mb-2"
                imageClassName="p-1.5"
              />
              <span className="text-base font-semibold text-black">{brand.name}</span>
              <span className="mt-1 text-xs text-black/50">
                {springTypeLabel(brand.rows)}
                {brand.fromPrice ? ` · from $${brand.fromPrice.toLocaleString('en-AU')}` : ''}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Reviews */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">Latest Reviews</h2>
          <Link href="/reviews/" className="text-sm text-[#38b1ab] hover:underline font-medium">
            All reviews →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {reviews.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      {/* Quiz CTA banner */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-16">
        <div className="rounded-2xl bg-[#38b1ab]/8 border border-[#38b1ab]/20 p-8 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-3">
            Not sure which trampoline to buy?
          </h2>
          <p className="text-black/60 mb-6 max-w-md mx-auto">
            Answer a few quick questions and we&apos;ll match you with the right trampoline for your family and budget.
          </p>
          <Link
            href="/quiz/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#38b1ab] hover:bg-[#2e9a94] text-white font-semibold px-8 py-3.5 transition-colors"
          >
            Start the quiz →
          </Link>
        </div>
      </section>
    </>
  );
}
