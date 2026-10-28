'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackMetaPageView } from '@/lib/meta-pixel';

/** Sends a Meta PageView on each client-side navigation after the first page load. */
export default function MetaPixelPageView() {
  const pathname = usePathname();
  const firstRenderRef = useRef(true);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    trackMetaPageView();
  }, [pathname]);

  return null;
}
