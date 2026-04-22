import type { Metadata } from 'next';
import PostCard from '@/components/PostCard';
import { getPostsByCategory } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Trampoline Comparisons | Bounce Arena',
  description: 'Side-by-side comparisons of Australia\'s top trampolines to help you choose the right one for your family.',
  alternates: { canonical: 'https://bouncearena.com.au/comparisons/' },
};

export default function ComparisonsPage() {
  const posts = getPostsByCategory('comparisons');
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
      <h1 className="text-3xl font-bold text-black mb-2">Trampoline Comparisons</h1>
      <p className="text-black/60 mb-8">
        Side-by-side comparisons to help you choose the right trampoline for your family.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
