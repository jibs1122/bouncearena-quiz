import type { Metadata } from 'next';
import PostCard from '@/components/PostCard';
import { getPostsByCategory } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Trampoline Buying Guides & Tips | Bounce Arena',
  description: 'Buying guides, safety tips, and expert advice on choosing the right trampoline for your Australian family.',
  alternates: { canonical: 'https://bouncearena.com.au/blog/' },
};

export default function BlogPage() {
  const posts = getPostsByCategory('blog');
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
      <h1 className="text-3xl font-bold text-black mb-2">Buying Guides &amp; Tips</h1>
      <p className="text-black/60 mb-8">
        Expert advice to help Australian families find the right trampoline.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
