'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import PromoBell from '@/components/PromoBell';
import SearchBox from '@/components/SearchBox';

export type NavItem = 'quiz' | 'reviews' | 'comparisons' | 'compare' | 'blog' | 'admin';
type SearchItem = {
  title: string;
  slug: string;
  category: 'reviews' | 'comparisons' | 'blog';
  description: string;
};

interface SiteHeaderProps {
  active?: NavItem;
  searchItems?: SearchItem[];
}

const NAV_LINKS: { label: string; href: string; id: NavItem }[] = [
  { label: 'QUIZ', href: '/quiz/', id: 'quiz' },
  { label: 'COMPARE', href: '/compare/', id: 'compare' },
  { label: 'REVIEWS', href: '/reviews/', id: 'reviews' },
  { label: 'BLOG', href: '/blog/', id: 'blog' },
];

export default function SiteHeader({ active, searchItems = [] }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-white border-b border-black/[0.08] sticky top-0 z-40">
      <div className="mx-auto w-full max-w-6xl px-5 py-3 sm:px-8">
        <div className="flex items-center justify-between gap-4 lg:grid lg:grid-cols-[auto_minmax(19rem,32rem)_auto] lg:gap-6">
          <Link
            href="/"
            className="flex items-center shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            <Image
              src="/BOUNCE-ARENA-LOGO.png"
              alt="Bounce Arena"
              width={200}
              height={60}
              className="h-[60px] sm:h-[72px] w-auto"
              priority
            />
          </Link>

          <div className="hidden lg:flex lg:justify-center">
            <SearchBox items={searchItems} />
          </div>

          <div className="flex items-center gap-1 justify-self-end">
            <nav className="hidden items-center gap-0.5 text-sm font-medium sm:flex">
              {NAV_LINKS.map(({ label, href, id }) => (
                <Link
                  key={id}
                  href={href}
                  className={`rounded-lg px-3 py-2 transition-colors ${
                    active === id ? 'text-[#38b1ab]' : 'text-black/60 hover:text-black'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-black/65 transition-colors hover:bg-black/5 hover:text-black sm:hidden"
            >
              <span className="sr-only">{mobileOpen ? 'Close menu' : 'Open menu'}</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileOpen ? (
                  <>
                    <path d="M6 6l12 12" />
                    <path d="M18 6L6 18" />
                  </>
                ) : (
                  <>
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                  </>
                )}
              </svg>
            </button>
            <PromoBell />
          </div>
        </div>

        {mobileOpen && (
          <nav className="mt-3 rounded-2xl border border-black/8 bg-white p-2 shadow-[0_18px_36px_-28px_rgba(0,0,0,0.35)] sm:hidden">
            <div className="px-2 pb-2">
              <SearchBox items={searchItems} mobile />
            </div>
            {NAV_LINKS.map(({ label, href, id }) => (
              <Link
                key={id}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  active === id
                    ? 'bg-[#38b1ab]/8 text-[#38b1ab]'
                    : 'text-black/65 hover:bg-black/[0.03] hover:text-black'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
