import type { Metadata } from 'next';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import { comparePageHref, getComparePages } from '@/lib/comparePages';
import { getPostsByCategory } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Trampoline Comparisons',
  description: 'Side-by-side comparisons of Australia\'s top trampolines to help you choose the right one for your family.',
  alternates: { canonical: 'https://bouncearena.com.au/comparisons/' },
};

export default function ComparisonsPage() {
  const posts = getPostsByCategory('comparisons');
  const comparePages = getComparePages();

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <h1 className="mb-2 text-3xl font-bold text-black">Trampoline Comparisons</h1>
      <p className="mb-8 text-black/60">
        Side-by-side comparisons to help you choose the right trampoline for your family.
      </p>

      {comparePages.length > 0 && (
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comparePages.map((page) => (
            <Link
              key={page.slug}
              href={comparePageHref(page.slug)}
              className="flex flex-col rounded-2xl border border-black/[0.08] p-5 transition-colors hover:border-[#38b1ab]/50"
            >
              <span className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#38b1ab]">
                {page.type === 'brand' ? 'Brands' : 'Models'}
              </span>
              <span className="text-base font-semibold text-black">{page.title}</span>
              {page.description && (
                <span className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-black/55">
                  {page.description}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {posts.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
