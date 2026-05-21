'use client';

import { useEffect, useState } from 'react';
import GeoBanner from './GeoBanner';

const BOT_RE = /bot|crawl|slurp|spider|mediapartners/i;

export default function GeoBannerAuto() {
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    if (BOT_RE.test(navigator.userAgent)) return;
    if (document.cookie.includes('ba_geo_banner_dismissed')) return;

    const match = document.cookie.match(/(?:^|;\s*)ba_country=([^;]+)/);
    const code = match ? decodeURIComponent(match[1]) : '';
    if (code === 'US' || code === 'CA') setCountry(code);
  }, []);

  if (!country) return null;
  return <GeoBanner country={country} />;
}
