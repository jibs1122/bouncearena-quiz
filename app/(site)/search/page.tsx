import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Search | Bounce Arena',
  description: 'Search trampoline reviews, comparisons, and guides on Bounce Arena.',
  alternates: { canonical: 'https://bouncearena.com.au/search/' },
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export default async function SearchPage(
  { searchParams }: { searchParams: Promise<{ q?: string }> }
) {
  const { q = '' } = await searchParams;
  const query = normalize(q);
  const results = query
    ? getAllPosts().filter((post) => {
        const haystack = `${post.title} ${post.description} ${post.category}`.toLowerCase();
        return haystack.includes(query);
      })
    : [];

  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#38b1ab]">
          Search
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-black sm:text-4xl">
          {query ? `Results for “${q}”` : 'Search Bounce Arena'}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-black/55">
          Search reviews, model comparisons, and buying guides across the site.
        </p>
      </div>

      {!query && (
        <div className="rounded-3xl border border-black/8 bg-[#f7f8f8] p-8 text-black/55">
          Enter a brand, model, or topic in the header search to see matching content.
        </div>
      )}

      {query && results.length === 0 && (
        <div className="rounded-3xl border border-black/8 bg-[#f7f8f8] p-8 text-black/55">
          No results found for “{q}”. Try a broader search like “Vuly”, “Springfree”, or
          “safety”.
        </div>
      )}

      {results.length > 0 && (
        <div className="grid gap-4">
          {results.map((post) => (
            <Link
              key={post.slug}
              href={`/${post.slug}/`}
              className="rounded-3xl border border-black/8 bg-white p-6 transition-colors hover:border-[#38b1ab]/35 hover:bg-[#38b1ab]/[0.03]"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#38b1ab]">
                {post.category === 'reviews'
                  ? 'Review'
                  : post.category === 'comparisons'
                    ? 'Comparison'
                    : 'Blog'}
              </div>
              <h2 className="mt-2 text-xl font-bold leading-tight text-black">{post.title}</h2>
              {post.description && (
                <p className="mt-2 max-w-3xl text-sm leading-7 text-black/55">{post.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
