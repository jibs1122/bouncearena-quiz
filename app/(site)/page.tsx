import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import { getPostsByCategory } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Bounce Arena – Australia\'s Trampoline Review & Comparison Guide',
  description:
    'Unbiased trampoline reviews, brand comparisons, and buying advice for Australian families. Find the right trampoline with our free quiz.',
  openGraph: {
    title: 'Bounce Arena – Australia\'s Trampoline Review & Comparison Guide',
    description:
      'Unbiased trampoline reviews, brand comparisons, and buying advice for Australian families.',
    url: 'https://bouncearena.com.au',
    siteName: 'Bounce Arena',
    images: [{ url: 'https://bouncearena.com.au/images/posts/kids-bouncing-on-trampoline.jpg' }],
  },
  alternates: { canonical: 'https://bouncearena.com.au/' },
};

export default function HomePage() {
  const reviews = getPostsByCategory('reviews').slice(0, 4);

  return (
    <>
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
                href="/compare/"
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
