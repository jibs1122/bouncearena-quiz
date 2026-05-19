'use client';

import { useEffect, useState } from 'react';

interface GeoBannerProps {
  country: string;
}

const DISMISS_COOKIE = 'ba_geo_banner_dismissed';

function setDismissCookie(days: number) {
  const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
  document.cookie = `${DISMISS_COOKIE}=1; path=/; expires=${expires}; samesite=lax`;
}

export default function GeoBanner({ country }: GeoBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Suppress if this looks like intentional cross-geo traffic (paid ads, campaigns)
    const params = new URLSearchParams(window.location.search);
    if (params.has('utm_source') || params.has('utm_medium') || params.has('utm_campaign')) {
      setDismissCookie(1);
      setVisible(false);
    }
  }, []);

  function dismiss() {
    setDismissCookie(90);
    setVisible(false);
  }

  if (!visible) return null;

  const regionLabel = country === 'CA' ? 'Canada' : 'the US';

  return (
    <div role="region" aria-label="Region suggestion" className="bg-[#38b1ab] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
        <p className="text-sm leading-snug">
          Looks like you&rsquo;re browsing from {regionLabel}.{' '}
          <a
            href="https://www.bouncearenareviews.com/"
            onClick={dismiss}
            className="font-semibold underline underline-offset-2 hover:no-underline"
          >
            BounceArenaReviews.com
          </a>{' '}
          has trampoline reviews for your region.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href="https://www.bouncearenareviews.com/"
            onClick={dismiss}
            className="hidden rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#38b1ab] transition-colors hover:bg-white/90 sm:block"
          >
            Visit Reviews site
          </a>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss banner"
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
}
