'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackMetaPageView } from '@/lib/meta-pixel';
import { trackRedditPageVisit } from '@/lib/reddit-pixel';

/**
 * Sends a Meta PageView and a Reddit PageVisit on each client-side navigation
 * after the first page load.
 */
export default function PixelPageView() {
  const pathname = usePathname();
  const firstRenderRef = useRef(true);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    trackMetaPageView();
    trackRedditPageVisit();
  }, [pathname]);

  return null;
}
