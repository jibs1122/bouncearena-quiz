'use client';

import { usePathname } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';

type SearchItem = {
  title: string;
  slug: string;
  category: 'reviews' | 'comparisons' | 'blog';
  description: string;
};

export default function SiteHeaderShell({ searchItems }: { searchItems: SearchItem[] }) {
  const pathname = usePathname();
  const isComparePage = pathname === '/compare' || pathname === '/compare/';

  return <SiteHeader searchItems={searchItems} sticky={!isComparePage} />;
}
