import type { Metadata } from 'next';
import PostCard from '@/components/PostCard';
import { getPostsByCategory } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Trampoline Reviews | Bounce Arena',
  description: 'In-depth, unbiased reviews of Australia\'s top trampolines — Vuly, Springfree, JumpFlex and more.',
  alternates: { canonical: 'https://bouncearena.com.au/reviews/' },
};

export default function ReviewsPage() {
  const posts = getPostsByCategory('reviews');
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
      <h1 className="text-3xl font-bold text-black mb-2">Trampoline Reviews</h1>
      <p className="text-black/60 mb-8">
        In-depth, unbiased reviews of Australia&apos;s top trampolines.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
