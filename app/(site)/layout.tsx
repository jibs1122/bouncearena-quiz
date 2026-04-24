import SiteHeaderShell from '@/components/SiteHeaderShell';
import Footer from '@/components/Footer';
import { getAllPosts } from '@/lib/content';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const searchItems = getAllPosts().map((post) => ({
    title: post.title,
    slug: post.slug,
    category: post.category,
    description: post.description,
  }));

  return (
    <>
      <SiteHeaderShell searchItems={searchItems} />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
