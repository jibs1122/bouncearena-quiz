'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  getSearchKindLabel,
  searchSite,
  type SearchItem,
} from '@/lib/search';

interface SearchBoxProps {
  items: SearchItem[];
  mobile?: boolean;
  onNavigate?: () => void;
}

export default function SearchBox({ items, mobile = false, onNavigate }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const deferredQuery = useDeferredValue(query);
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpen(false);
      setQuery('');
      setActiveIndex(-1);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        setActiveIndex(-1);
        inputRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const results = useMemo(
    () => searchSite(items, deferredQuery, 7),
    [deferredQuery, items],
  );
  const trimmedQuery = query.trim();
  const showPopular = !trimmedQuery;

  function navigate(href: string) {
    setOpen(false);
    setActiveIndex(-1);
    onNavigate?.();
    router.push(href);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (activeIndex >= 0 && results[activeIndex]) {
      navigate(results[activeIndex].item.href);
      return;
    }

    if (!trimmedQuery) {
      setOpen(true);
      return;
    }

    navigate(`/search/?q=${encodeURIComponent(trimmedQuery)}`);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();

      if (activeIndex >= 0 && results[activeIndex]) {
        navigate(results[activeIndex].item.href);
      } else if (trimmedQuery) {
        navigate(`/search/?q=${encodeURIComponent(trimmedQuery)}`);
      } else {
        setOpen(true);
      }
    }
  }

  return (
    <div ref={rootRef} className={`relative ${mobile ? 'w-full' : 'w-full max-w-md'}`}>
      <form onSubmit={onSubmit} role="search" aria-label="Site search">
        <div
          className={`flex items-center gap-2 rounded-2xl border border-black/10 bg-[#f7f8f8] pl-3 pr-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-colors focus-within:border-[#38b1ab]/45 focus-within:bg-white ${mobile ? 'h-12' : 'h-11'}`}
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
            ref={inputRef}
            type="search"
            role="combobox"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onInputKeyDown}
            placeholder="Search brands, models, reviews…"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open}
            aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-sm text-black placeholder:text-black/35 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#38b1ab] text-white transition-colors hover:bg-[#2e9a94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38b1ab]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </button>
        </div>
      </form>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={showPopular ? 'Suggested pages' : 'Search suggestions'}
          className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-50 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_22px_54px_-24px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center justify-between border-b border-black/6 px-4 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/38">
              {showPopular ? 'Suggested pages' : `${results.length} top ${results.length === 1 ? 'match' : 'matches'}`}
            </span>
            {!showPopular && (
              <span className="text-[11px] text-black/30">↑↓ to choose</span>
            )}
          </div>

          {results.length > 0 ? (
            <div className="py-1.5">
              {results.map(({ item }, index) => (
                <Link
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  key={item.id}
                  href={item.href}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => {
                    setOpen(false);
                    setActiveIndex(-1);
                    onNavigate?.();
                  }}
                  className={`block border-l-2 px-4 py-2.5 transition-colors ${
                    activeIndex === index
                      ? 'border-[#38b1ab] bg-[#38b1ab]/[0.07]'
                      : 'border-transparent hover:bg-[#38b1ab]/[0.04]'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="truncate text-sm font-semibold text-black">{item.title}</div>
                    <div className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#38b1ab]">
                      {getSearchKindLabel(item.kind)}
                    </div>
                  </div>
                  {item.description && (
                    <div className="mt-0.5 line-clamp-1 text-xs leading-5 text-black/48">
                      {item.description}
                    </div>
                  )}
                </Link>
              ))}

              {trimmedQuery && (
                <div className="mt-1 border-t border-black/6 px-4 pt-2.5 pb-1.5">
                  <Link
                    href={`/search/?q=${encodeURIComponent(trimmedQuery)}`}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                    className="text-sm font-medium text-[#38b1ab] transition-colors hover:text-[#2e9a94]"
                  >
                    See all results for “{trimmedQuery}” →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 py-4">
              <p className="text-sm text-black/50">No quick matches yet.</p>
              <Link
                href={`/search/?q=${encodeURIComponent(trimmedQuery)}`}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className="mt-2 inline-block text-sm font-medium text-[#38b1ab] hover:text-[#2e9a94]"
              >
                Search the full site for “{trimmedQuery}” →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
