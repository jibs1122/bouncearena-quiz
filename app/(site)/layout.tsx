import { cookies, headers } from 'next/headers';
import SiteHeaderShell from '@/components/SiteHeaderShell';
import Footer from '@/components/Footer';
import GeoBanner from '@/components/GeoBanner';
import { getAllPosts } from '@/lib/content';

const BOT_RE = /bot|crawl|slurp|spider|mediapartners/i;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const searchItems = getAllPosts().map((post) => ({
    title: post.title,
    slug: post.slug,
    category: post.category,
    description: post.description,
  }));

  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const ipCountry = headersList.get('x-vercel-ip-country') ?? '';
  const isDismissed = cookieStore.has('ba_geo_banner_dismissed');
  const isBot = BOT_RE.test(headersList.get('user-agent') ?? '');
  const showBanner = (ipCountry === 'US' || ipCountry === 'CA') && !isDismissed && !isBot;

  return (
    <>
      {showBanner && <GeoBanner country={ipCountry} />}
      <SiteHeaderShell searchItems={searchItems} />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
