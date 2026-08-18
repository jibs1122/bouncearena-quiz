import type { Metadata } from 'next';
import Link from 'next/link';
import { getSearchKindLabel, searchSite } from '@/lib/search';
import { getSearchItems } from '@/lib/searchIndex';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search trampoline brands, models, reviews, comparisons and guides on Bounce Arena.',
  alternates: { canonical: 'https://bouncearena.com.au/search/' },
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default async function SearchPage({ searchParams }: PageProps<'/search'>) {
  const rawQuery = (await searchParams).q;
  const query = Array.isArray(rawQuery) ? rawQuery[0] ?? '' : rawQuery ?? '';
  const items = getSearchItems();
  const results = searchSite(items, query, 40);
  const hasQuery = Boolean(query.trim());

  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#38b1ab]">
          Search
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-black sm:text-4xl">
          {hasQuery ? `Results for “${query}”` : 'What are you looking for?'}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-black/55">
          Search every brand, model, comparison, review and buying guide on Bounce Arena.
        </p>
      </div>

      <form action="/search/" role="search" className="mb-8">
        <label htmlFor="site-search-page" className="sr-only">Search Bounce Arena</label>
        <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white p-1.5 pl-4 shadow-sm focus-within:border-[#38b1ab]/50 focus-within:ring-4 focus-within:ring-[#38b1ab]/[0.08]">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-black/30"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            id="site-search-page"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Try a brand, model or topic"
            autoFocus={!hasQuery}
            className="h-11 min-w-0 flex-1 bg-transparent text-base text-black placeholder:text-black/35 focus:outline-none"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-xl bg-[#38b1ab] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2e9a94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38b1ab]"
          >
            Search
          </button>
        </div>
      </form>

      {hasQuery && results.length === 0 && (
        <div className="rounded-3xl border border-black/8 bg-[#f7f8f8] p-8">
          <h2 className="text-lg font-bold text-black">No results found for “{query}”</h2>
          <p className="mt-2 text-sm leading-6 text-black/55">
            Check the spelling or try a broader term such as a brand, model family, “safety” or “size”.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {['Vuly', 'Springfree', 'Jumpflex', 'safety', 'trampoline size'].map((term) => (
              <Link
                key={term}
                href={`/search/?q=${encodeURIComponent(term)}`}
                className="rounded-full border border-[#38b1ab]/25 bg-white px-3 py-1.5 text-sm font-medium text-[#38b1ab] transition-colors hover:bg-[#38b1ab]/[0.06]"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-black/65">
              {hasQuery
                ? `${results.length} ${results.length === 1 ? 'result' : 'results'}`
                : 'Suggested pages'}
            </h2>
            {hasQuery && results.length === 40 && (
              <span className="text-xs text-black/35">Showing the 40 most relevant</span>
            )}
          </div>

          <div className="grid gap-3">
            {results.map(({ item }) => (
              <Link
                key={item.id}
                href={item.href}
                className="group rounded-2xl border border-black/8 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#38b1ab]/35 hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#38b1ab]">
                      {getSearchKindLabel(item.kind)}
                    </div>
                    <h3 className="mt-1 text-lg font-bold leading-tight text-black group-hover:text-[#2e9a94]">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-1.5 line-clamp-2 max-w-3xl text-sm leading-6 text-black/55">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <span className="mt-1 shrink-0 text-lg text-black/20 transition-transform group-hover:translate-x-0.5 group-hover:text-[#38b1ab]" aria-hidden="true">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
