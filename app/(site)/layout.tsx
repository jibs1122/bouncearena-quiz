import SiteHeaderShell from '@/components/SiteHeaderShell';
import Footer from '@/components/Footer';
import GeoBannerSlot from '@/components/GeoBannerSlot';
import { getSearchItems } from '@/lib/searchIndex';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const searchItems = getSearchItems();

  return (
    <>
      <GeoBannerSlot />
      <SiteHeaderShell searchItems={searchItems} />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
