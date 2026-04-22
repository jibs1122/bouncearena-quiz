import Image from 'next/image';
import Link from 'next/link';
import { formatDate, type PostMeta } from '@/lib/content';

const CATEGORY_LABELS: Record<string, string> = {
  reviews: 'Review',
  comparisons: 'Comparison',
  blog: 'Blog',
};

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/${post.slug}/`}
      className="group flex flex-col bg-white border border-black/[0.08] rounded-2xl overflow-hidden hover:border-black/20 hover:shadow-sm transition-all"
    >
      <div className="aspect-[3/2] bg-gray-100 overflow-hidden relative">
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            quality={85}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#38b1ab]/10 to-[#38b1ab]/20 flex items-center justify-center">
            <span className="text-4xl">🏀</span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-[#38b1ab] uppercase tracking-wide">
            {CATEGORY_LABELS[post.category] ?? post.category}
          </span>
          {post.date && (
            <>
              <span className="text-black/20">·</span>
              <span className="text-xs text-black/40">{formatDate(post.date)}</span>
            </>
          )}
        </div>

        <h3 className="font-semibold text-black leading-snug mb-2 group-hover:text-[#38b1ab] transition-colors line-clamp-2">
          {post.title}
        </h3>

        {post.description && (
          <p className="text-sm text-black/60 leading-relaxed line-clamp-3 mt-auto pt-2">
            {post.description}
          </p>
        )}
      </div>
    </Link>
  );
}
