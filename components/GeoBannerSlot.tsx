'use client';

import { useEffect, useState } from 'react';
import GeoBanner from './GeoBanner';

const BOT_RE = /bot|crawl|slurp|spider|mediapartners/i;
const GEO_REGIONS = new Set(['US', 'CA']);
const DISMISS_COOKIE = 'ba_geo_banner_dismissed';

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function GeoBannerSlot() {
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    if (BOT_RE.test(navigator.userAgent) || readCookie(DISMISS_COOKIE)) return;

    const detectedCountry = readCookie('ba_country');
    if (detectedCountry && GEO_REGIONS.has(detectedCountry)) {
      setCountry(detectedCountry);
    }
  }, []);

  if (!country) return null;
  return <GeoBanner country={country} />;
}
