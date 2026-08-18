'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export type HubBrand = {
  name: string;
  slug: string;
  brandCount: number;
  modelCount: number;
};

export type HubComparison = {
  slug: string;
  href: string;
  title: string;
  description: string;
  type: 'brand' | 'model';
  brands: string[];
  isDraft: boolean;
};

function matchesQuery(comparison: HubComparison, query: string): boolean {
  if (!query) return true;
  const haystack = `${comparison.title} ${comparison.description} ${comparison.brands.join(' ')}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function ComparisonCard({ comparison }: { comparison: HubComparison }) {
  return (
    <Link
      href={comparison.href}
      className="flex flex-col rounded-2xl border border-black/[0.08] p-5 transition-colors hover:border-[#38b1ab]/50"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#38b1ab]">
          {comparison.type === 'brand' ? 'Brands' : 'Models'}
        </span>
        {comparison.isDraft && (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            Draft
          </span>
        )}
      </div>
      <span className="text-base font-semibold text-black">{comparison.title}</span>
      {comparison.description && (
        <span className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-black/55">
          {comparison.description}
        </span>
      )}
      <span className="mt-3 text-sm font-medium text-[#38b1ab]">Compare →</span>
    </Link>
  );
}

export default function ComparisonHubClient({
  brands,
  comparisons,
}: {
  brands: HubBrand[];
  comparisons: HubComparison[];
}) {
  const [query, setQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return comparisons.filter((comparison) => {
      if (!matchesQuery(comparison, query)) return false;
      if (selectedBrands.length === 0) return true;

      // One brand selected shows everything featuring it; multiple brands show only
      // the matchups inside that selection.
      if (selectedBrands.length === 1) return comparison.brands.includes(selectedBrands[0]);
      return comparison.brands.every((brand) => selectedBrands.includes(brand));
    });
  }, [comparisons, query, selectedBrands]);

  const brandComparisons = filtered.filter((comparison) => comparison.type === 'brand');
  const modelComparisons = filtered.filter((comparison) => comparison.type === 'model');

  function toggleBrand(name: string) {
    setSelectedBrands((prev) =>
      prev.includes(name) ? prev.filter((brand) => brand !== name) : [...prev, name],
    );
  }

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="compare-search" className="sr-only">
          Search comparisons
        </label>
        <input
          id="compare-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search comparisons — try “Vuly” or “springless”"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/35 focus:border-[#38b1ab] focus:outline-none"
        />
      </div>

      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/40">
          Filter by brand
        </p>
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => {
            const total = brand.brandCount + brand.modelCount;
            const active = selectedBrands.includes(brand.name);
            return (
              <button
                key={brand.slug}
                type="button"
                onClick={() => toggleBrand(brand.name)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-[#38b1ab] bg-[#38b1ab] text-white'
                    : 'border-black/10 bg-white text-black/60 hover:border-[#38b1ab] hover:text-[#38b1ab]'
                }`}
              >
                {brand.name}
                <span className={active ? 'ml-1 text-white/70' : 'ml-1 text-black/30'}>{total}</span>
              </button>
            );
          })}
          {selectedBrands.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedBrands([])}
              className="text-xs text-black/40 underline hover:text-black"
            >
              Clear
            </button>
          )}
        </div>
        {selectedBrands.length === 1 && (
          <p className="mt-2 text-xs text-black/40">
            Showing every comparison featuring {selectedBrands[0]}. Select a second brand to see just
            that matchup.
          </p>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-2xl border border-black/[0.08] bg-gray-50 px-5 py-8 text-center text-sm text-black/50">
          No comparisons match that search yet.{' '}
          <Link href="/models/" className="text-[#38b1ab] hover:underline">
            Compare every model side-by-side →
          </Link>
        </p>
      )}

      {brandComparisons.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-1 text-xl font-bold text-black">Brand comparisons</h2>
          <p className="mb-5 text-sm text-black/55">
            How two brands differ across their whole range — spring system, warranty, sizes and price.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {brandComparisons.map((comparison) => (
              <ComparisonCard key={comparison.slug} comparison={comparison} />
            ))}
          </div>
        </section>
      )}

      {modelComparisons.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-1 text-xl font-bold text-black">Model comparisons</h2>
          <p className="mb-5 text-sm text-black/55">
            Head-to-head on two specific trampolines, including upgrade decisions within a range.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {modelComparisons.map((comparison) => (
              <ComparisonCard key={comparison.slug} comparison={comparison} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
