import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getAllSlugs, getPost, getRelatedPosts, formatDate } from '@/lib/content';
import PostCard from '@/components/PostCard';
import ArticleQuizCta from '@/components/ArticleQuizCta';
import SmartLink from '@/components/SmartLink';
import YouTubeEmbed from '@/components/YouTubeEmbed';

const YT_RE = /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)[^\s]*/gm;
const QUIZ_BLOCK_RE =
  /### Take the Quiz\s+Our Trampoline Quiz guides you through the key decisions you should make when choosing a trampoline and recommends the best options based on your preferences\.\s+\[Take the Quiz\]\(\/quiz\/?\)/g;

function processContent(content: string): { body: string; hasLeadYoutube: boolean } {
  const firstParaMatch = content.match(/^([^\n]*\n?){0,3}/);
  const firstChunk = firstParaMatch ? firstParaMatch[0] : content.slice(0, 300);
  const hasLeadYoutube = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch|youtu\.be\/)/.test(firstChunk);
  const withYoutube = content.replace(YT_RE, (_, id) => `<YouTubeEmbed id="${id}" />`);
  const body = withYoutube.replace(QUIZ_BLOCK_RE, '<ArticleQuizCta />');
  return { body, hasLeadYoutube };
}

const CATEGORY_LABELS: Record<string, string> = {
  reviews: 'Review',
  comparisons: 'Comparison',
  blog: 'Blog',
};

const AFFILIATE_DISCLOSURE =
  'This page contains affiliate links and we may earn a commission on purchases.';

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} | Bounce Arena`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://bouncearena.com.au/${slug}/`,
      siteName: 'Bounce Arena',
      images: post.featuredImage
        ? [{ url: `https://bouncearena.com.au${post.featuredImage}` }]
        : [],
      type: 'article',
      publishedTime: post.date,
    },
    alternates: { canonical: `https://bouncearena.com.au/${slug}/` },
  };
}

export default async function PostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getRelatedPosts(slug, post.category, 3);
  const { body, hasLeadYoutube } = processContent(post.content);
  const showFeaturedImage = Boolean(post.featuredImage && !hasLeadYoutube);

  return (
    <article className="mx-auto max-w-3xl px-5 sm:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-black/40 mb-6">
        <Link href="/" className="hover:text-black transition-colors">Home</Link>
        <span>/</span>
        <Link href={`/${post.category}/`} className="hover:text-black transition-colors capitalize">
          {post.category}
        </Link>
        <span>/</span>
        <span className="text-black/60 line-clamp-1">{post.title}</span>
      </nav>

      {/* Meta */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold text-[#38b1ab] uppercase tracking-wide">
          {CATEGORY_LABELS[post.category] ?? post.category}
        </span>
        {post.date && (
          <>
            <span className="text-black/20">·</span>
            <span className="text-xs text-black/40">{formatDate(post.date)}</span>
          </>
        )}
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-black leading-tight mb-6">
        {post.title}
      </h1>

      {!showFeaturedImage && (
        <p className="mb-8 text-sm leading-relaxed text-black/45">
          {AFFILIATE_DISCLOSURE}
        </p>
      )}

      {/* Featured image — hidden when a YouTube embed leads the content */}
      {showFeaturedImage && (
        <div className="mb-8">
          <Image
            src={post.featuredImage}
            alt={post.title}
            width={1400}
            height={788}
            quality={85}
            className="h-auto w-full rounded-[24px]"
            priority
            sizes="(max-width: 768px) 100vw, 896px"
          />

          <p className="mt-4 text-sm leading-relaxed text-black/45">
            {AFFILIATE_DISCLOSURE}
          </p>
        </div>
      )}

      {/* MDX body */}
      <div className="prose prose-neutral max-w-none
        prose-headings:font-bold prose-headings:text-black
        prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-black/75 prose-p:leading-relaxed prose-p:my-4
        prose-a:text-[#38b1ab] prose-a:no-underline [&_a:hover]:underline
        prose-strong:text-black prose-strong:font-semibold
        prose-ul:my-4 prose-li:text-black/75
        prose-img:rounded-xl prose-img:my-6
        prose-table:text-sm prose-th:bg-gray-50 prose-th:font-semibold
        prose-blockquote:border-[#38b1ab] prose-blockquote:text-black/60">
        <MDXRemote
          source={body}
          components={{ YouTubeEmbed, ArticleQuizCta, a: SmartLink }}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        />
      </div>

      {/* Quiz CTA */}
      <ArticleQuizCta className="mt-12" />

      {/* Related posts */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-black mb-5">Related articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
