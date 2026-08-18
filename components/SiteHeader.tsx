'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import PromoBell from '@/components/PromoBell';
import SearchBox from '@/components/SearchBox';
import type { SearchItem } from '@/lib/search';

export type NavItem = 'quiz' | 'reviews' | 'compare' | 'models' | 'brands' | 'blog' | 'admin';

interface SiteHeaderProps {
  active?: NavItem;
  searchItems?: SearchItem[];
  sticky?: boolean;
  showPromo?: boolean;
}

const NAV_LINKS: { label: string; href: string; id: NavItem }[] = [
  { label: 'QUIZ', href: '/quiz/', id: 'quiz' },
  { label: 'COMPARE', href: '/compare/', id: 'compare' },
  { label: 'MODELS', href: '/models/', id: 'models' },
  { label: 'BRANDS', href: '/brands/', id: 'brands' },
  { label: 'REVIEWS', href: '/reviews/', id: 'reviews' },
  { label: 'BLOG', href: '/blog/', id: 'blog' },
];

export default function SiteHeader({
  active,
  searchItems = [],
  sticky = true,
  showPromo = true,
}: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={`bg-white border-b border-black/[0.08] ${sticky ? 'sticky top-0 z-40' : 'relative z-40'}`}>
      <div className="mx-auto w-full max-w-6xl px-5 py-3 sm:px-8">
        <div className="flex items-center justify-between gap-4 lg:grid lg:grid-cols-[188px_minmax(15rem,1fr)_auto] lg:gap-6">
          <Link
            href="/"
            className="flex items-center shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            <Image
              src="/BOUNCE-ARENA-LOGO.png"
              alt="Bounce Arena"
              width={750}
              height={319}
              sizes="(max-width: 639px) 156px, 188px"
              className="h-auto w-[156px] sm:w-[188px]"
              priority
            />
          </Link>

          <div className="hidden lg:flex lg:justify-center">
            <SearchBox items={searchItems} />
          </div>

          <div className="flex items-center gap-1 justify-self-end">
            <nav className="hidden items-center gap-0.5 text-sm font-medium lg:flex">
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
              className="flex h-10 w-10 items-center justify-center rounded-lg text-black/65 transition-colors hover:bg-black/5 hover:text-black lg:hidden"
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
            {showPromo && <PromoBell />}
          </div>
        </div>

        {mobileOpen && (
          <nav className="mt-3 rounded-2xl border border-black/8 bg-white p-2 shadow-[0_18px_36px_-28px_rgba(0,0,0,0.35)] lg:hidden">
            <div className="px-2 pb-2">
              <SearchBox items={searchItems} mobile onNavigate={() => setMobileOpen(false)} />
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
