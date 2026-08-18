'use client';

import { usePathname } from 'next/navigation';
import SiteHeader, { type NavItem } from '@/components/SiteHeader';

type SearchItem = {
  title: string;
  slug: string;
  category: 'reviews' | 'comparisons' | 'blog';
  description: string;
};

function activeNavItem(pathname: string): NavItem | undefined {
  const section = pathname.split('/').filter(Boolean)[0];

  if (section === 'quiz') return 'quiz';
  if (section === 'compare') return 'compare';
  if (section === 'models') return 'models';
  if (section === 'brands') return 'brands';
  if (section === 'reviews') return 'reviews';
  if (section === 'blog') return 'blog';
  if (section === 'comparisons') return 'comparisons';
  if (section === 'admin') return 'admin';

  return undefined;
}

export default function SiteHeaderShell({ searchItems }: { searchItems: SearchItem[] }) {
  const pathname = usePathname();
  // The wide filter table needs the full viewport height, so it opts out of the sticky header.
  const isModelsPage = pathname === '/models' || pathname === '/models/';

  return <SiteHeader active={activeNavItem(pathname)} searchItems={searchItems} sticky={!isModelsPage} />;
}
