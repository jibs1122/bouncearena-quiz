import { cookies, headers } from 'next/headers';
import GeoBanner from './GeoBanner';

const BOT_RE = /bot|crawl|slurp|spider|mediapartners/i;
const GEO_REGIONS = new Set(['US', 'CA']);
const DISMISS_COOKIE = 'ba_geo_banner_dismissed';

export default async function GeoBannerSlot() {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const country = headersList.get('x-vercel-ip-country') ?? '';
  const dismissed = cookieStore.has(DISMISS_COOKIE);
  const isBot = BOT_RE.test(headersList.get('user-agent') ?? '');

  if (!GEO_REGIONS.has(country) || dismissed || isBot) return null;
  return <GeoBanner country={country} />;
}
