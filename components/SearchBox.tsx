'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type SearchItem = {
  title: string;
  slug: string;
  category: 'reviews' | 'comparisons' | 'blog';
  description: string;
};

interface SearchBoxProps {
  items: SearchItem[];
  mobile?: boolean;
}

function getCategoryLabel(category: SearchItem['category']): string {
  if (category === 'reviews') return 'Review';
  if (category === 'comparisons') return 'Comparison';
  return 'Blog';
}

export default function SearchBox({ items, mobile = false }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    setOpen(false);
    setQuery('');
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const results = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    if (!normalized) return [];

    return items
      .map((item) => {
        const haystack = `${item.title} ${item.description} ${item.category}`.toLowerCase();
        const titleStarts = item.title.toLowerCase().startsWith(normalized) ? 3 : 0;
        const titleIncludes = item.title.toLowerCase().includes(normalized) ? 2 : 0;
        const bodyIncludes = haystack.includes(normalized) ? 1 : 0;
        return { item, score: titleStarts + titleIncludes + bodyIncludes };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .slice(0, 6);
  }, [deferredQuery, items]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`/search/?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div ref={rootRef} className={`relative ${mobile ? 'w-full' : 'w-full max-w-md'}`}>
      <form onSubmit={onSubmit} role="search" aria-label="Site search">
        <div
          className={`flex items-center gap-2 rounded-2xl border border-black/10 bg-[#f7f8f8] px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-colors focus-within:border-[#38b1ab]/45 focus-within:bg-white ${mobile ? 'h-12' : 'h-11'}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-black/35"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search reviews, comparisons, and guides"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open}
            className="w-full bg-transparent text-sm text-black placeholder:text-black/35 focus:outline-none"
          />
        </div>
      </form>

      {open && query.trim() && (
        <div
          id={listId}
          className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-50 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_22px_54px_-34px_rgba(0,0,0,0.45)]"
        >
          {results.length > 0 ? (
            <div className="py-2">
              {results.map(({ item }) => (
                <Link
                  key={item.slug}
                  href={`/${item.slug}/`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 transition-colors hover:bg-[#38b1ab]/6"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#38b1ab]">
                    {getCategoryLabel(item.category)}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-black">{item.title}</div>
                  {item.description && (
                    <div className="mt-1 line-clamp-2 text-sm leading-6 text-black/52">
                      {item.description}
                    </div>
                  )}
                </Link>
              ))}
              <div className="border-t border-black/6 px-4 py-3">
                <Link
                  href={`/search/?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-[#38b1ab] transition-colors hover:text-[#2e9a94]"
                >
                  See all results for “{query.trim()}”
                </Link>
              </div>
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-black/48">
              No matches yet. Try a brand, model, or topic.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
