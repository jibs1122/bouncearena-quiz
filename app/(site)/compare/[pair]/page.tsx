import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import ArticleQuizCta from '@/components/ArticleQuizCta';
import BrandLogoAvatar from '@/components/BrandLogoAvatar';
import SmartLink from '@/components/SmartLink';
import ComparePromoCta from '@/components/compare/ComparePromoCta';
import ComparisonTable from '@/components/compare/ComparisonTable';
import FeaturedModels from '@/components/compare/FeaturedModels';
import JsonLd from '@/components/compare/JsonLd';
import KeyTakeaways from '@/components/compare/KeyTakeaways';
import RelatedComparisons, { type RelatedLink } from '@/components/compare/RelatedComparisons';
import { hasAffiliateLink } from '@/lib/affiliate';
import { brandSlug } from '@/lib/brands';
import {
  comparePageBrands,
  comparePageHref,
  getComparePage,
  getComparePages,
  getRelatedComparisons,
  getReviewLinks,
  resolveSides,
  type ComparePage,
  type ResolvedSide,
} from '@/lib/comparePages';
import { AFFILIATE_DISCLOSURE, productUrl } from '@/lib/compareShared';
import { buildCompareTakeaways } from '@/lib/compareTakeaways';
import { formatDate, getAllPosts, getPost } from '@/lib/content';
import { buildPromosForBrands, hasAffiliatePromo } from '@/lib/promoCtas';

export const revalidate = 86400;

const SITE_URL = 'https://bouncearena.com.au';

const GUIDE_LINKS: RelatedLink[] = [
  { href: '/springless-vs-spring-trampolines/', label: 'Springless vs spring trampolines' },
  { href: '/trampoline-size/', label: 'Trampoline size guide' },
  { href: '/best-trampolines-australia-2025/', label: 'Best trampolines in Australia' },
];

type Section = { heading: string | null; body: string };

/**
 * Splits the authored body into its intro and `## ` sections so page furniture
 * (spec table, CTAs) can be placed between them rather than injected into the
 * markdown as placeholder tags.
 */
function splitSections(content: string): Section[] {
  const lines = content.split('\n');
  const sections: Section[] = [];
  let heading: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    const body = buffer.join('\n').trim();
    if (heading !== null || body) sections.push({ heading, body });
    buffer = [];
  };

  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      flush();
      heading = match[1];
      continue;
    }
    buffer.push(line);
  }
  flush();

  return sections;
}

function findSection(sections: Section[], heading: string): Section | null {
  return sections.find((section) => section.heading?.toLowerCase() === heading.toLowerCase()) ?? null;
}

function linkFirstBrandMentions(content: string, sides: [ResolvedSide, ResolvedSide]): string {
  return sides.reduce((linkedContent, side) => {
    const escapedBrand = side.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const firstMention = new RegExp(`(^|[^A-Za-z0-9])(${escapedBrand})(?=$|[^A-Za-z0-9])`, 'i');

    return linkedContent.replace(
      firstMention,
      (_, prefix: string, brand: string) => `${prefix}[${brand}](/brands/${brandSlug(side.brand)}/)`,
    );
  }, content);
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="prose prose-neutral max-w-none
        prose-headings:font-bold prose-headings:text-black
        prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-black/75 prose-p:leading-relaxed prose-p:my-4
        prose-a:text-[#38b1ab] prose-a:no-underline [&_a:hover]:underline
        prose-strong:text-black prose-strong:font-semibold
        prose-ul:my-4 prose-li:text-black/75"
    >
      {children}
    </div>
  );
}

function Markdown({ source }: { source: string }) {
  if (!source.trim()) return null;
  return (
    <MDXRemote
      source={source}
      components={{ a: SmartLink }}
      options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
    />
  );
}

function pageDates(page: ComparePage): { published: string; modified: string } {
  const published = page.date || new Date().toISOString().slice(0, 10);
  return { published, modified: page.updated ?? published };
}

function offersFor(side: ResolvedSide): Record<string, unknown> | null {
  const priced = side.rows.filter((row) => row.priceAud !== null);
  if (priced.length === 0) return null;

  const cheapest = priced.reduce((low, row) => (row.priceAud! < low.priceAud! ? row : low));
  const url = productUrl(cheapest, true);

  return {
    '@type': 'Offer',
    priceCurrency: 'AUD',
    price: cheapest.priceAud,
    ...(url ? { url: url.startsWith('/') ? `${SITE_URL}${url}` : url } : {}),
  };
}

export async function generateStaticParams() {
  return getComparePages().map((page) => ({ pair: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const page = getComparePage(pair);
  if (!page) return {};

  const canonical = `${SITE_URL}${comparePageHref(page.slug)}`;
  const description = page.metaDescription ?? page.description;
  const stamp = page.updated ?? page.date;
  const parsed = stamp ? new Date(stamp) : new Date();
  const year = (Number.isNaN(parsed.valueOf()) ? new Date() : parsed).getFullYear();
  const fallbackTitle = `${page.title}: Australian Trampoline Comparison ${year}`;

  return {
    title: page.metaTitle ? { absolute: page.metaTitle } : fallbackTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title: page.metaTitle ?? fallbackTitle,
      description,
      url: canonical,
      siteName: 'Bounce Arena',
      type: 'article',
      publishedTime: page.date,
      modifiedTime: page.updated ?? page.date,
      images: [{
        url: `${SITE_URL}/images/posts/kids-bouncing-on-trampoline.jpg`,
        width: 1200,
        height: 800,
        alt: page.title,
      }],
    },
  };
}

export default async function ComparePairPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const page = getComparePage(pair);
  if (!page) notFound();

  const sides = resolveSides(page);
  const [sideA, sideB] = sides;
  const allRows = [...sideA.rows, ...sideB.rows];

  const content = page.type === 'brand' ? linkFirstBrandMentions(page.content, sides) : page.content;
  const sections = splitSections(content);
  const intro = sections.find((section) => section.heading === null)?.body ?? '';
  const quickVerdict = findSection(sections, 'Quick verdict');
  const specSection = findSection(sections, 'Full spec comparison');

  const takeaways = buildCompareTakeaways(
    { name: sideA.label, rows: sideA.rows },
    { name: sideB.label, rows: sideB.rows },
  );

  const reviews = getReviewLinks(allRows);
  const brands = comparePageBrands(page);
  const promos = buildPromosForBrands(brands);
  const showDisclosure = hasAffiliateLink(allRows) || hasAffiliatePromo(promos);
  const { published, modified } = pageDates(page);
  const canonical = `${SITE_URL}${comparePageHref(page.slug)}`;

  const postSlugs = new Set(getAllPosts().map((post) => post.slug));
  const relatedLinks: RelatedLink[] = [
    ...getRelatedComparisons(page.slug, brands).map((related) => ({
      href: comparePageHref(related.slug),
      label: related.title,
    })),
    // Use the review's own title so the anchor text always matches the page it opens.
    ...reviews
      .map((review) => {
        const post = getPost(review.slug);
        return post ? { href: `/${review.slug}/`, label: post.title } : null;
      })
      .filter((link): link is RelatedLink => link !== null),
    ...page.related.filter((slug) => postSlugs.has(slug)).map((slug) => ({
      href: `/${slug}/`,
      label: slug.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
    })),
    ...GUIDE_LINKS.filter((link) => postSlugs.has(link.href.replace(/\//g, ''))),
  ];

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE_URL}/compare/` },
      { '@type': 'ListItem', position: 3, name: page.title, item: canonical },
    ],
  };

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.metaDescription ?? page.description,
    datePublished: published,
    dateModified: modified,
    mainEntityOfPage: canonical,
    image: [`${SITE_URL}/images/posts/kids-bouncing-on-trampoline.jpg`],
    publisher: {
      '@type': 'Organization',
      name: 'Bounce Arena',
      url: `${SITE_URL}/`,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/BOUNCE-ARENA-LOGO.png` },
    },
  };

  const productList =
    page.type === 'model'
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: sides
            .map((side, index) => {
              const offers = offersFor(side);
              if (!offers) return null;
              return {
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'Product',
                  name: side.label,
                  brand: { '@type': 'Brand', name: side.brand },
                  offers,
                },
              };
            })
            .filter((entry) => entry !== null),
        }
      : null;

  return (
    <article className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <JsonLd data={breadcrumb} />
      <JsonLd data={article} />
      {productList && productList.itemListElement.length > 0 && <JsonLd data={productList} />}

      <div className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-black/40">
          <Link href="/" className="transition-colors hover:text-black">Home</Link>
          <span>/</span>
          <Link href="/compare/" className="transition-colors hover:text-black">Compare</Link>
          <span>/</span>
          <span className="line-clamp-1 text-black/60">{page.title}</span>
        </nav>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#38b1ab]">Comparison</span>
          {page.date && (
            <>
              <span className="text-black/20">·</span>
              <span className="text-xs text-black/40">{formatDate(page.updated ?? page.date)}</span>
            </>
          )}
          {page.publishStatus === 'draft' && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              Draft — not published
            </span>
          )}
        </div>

        <h1 className="mb-6 text-3xl font-bold leading-tight text-black sm:text-4xl">{page.title}</h1>

        {page.type === 'brand' && (
          <div className="mb-6 flex items-center gap-3 sm:gap-5" aria-label={`${sideA.brand} and ${sideB.brand} logos`}>
            <BrandLogoAvatar
              name={sideA.brand}
              width={240}
              height={104}
              fluid
              imageClassName="p-3 sm:p-4"
              priority
            />
            <BrandLogoAvatar
              name={sideB.brand}
              width={240}
              height={104}
              fluid
              imageClassName="p-3 sm:p-4"
              priority
            />
          </div>
        )}

        {showDisclosure && (
          <p className="mb-6 text-sm leading-relaxed text-black/45">{AFFILIATE_DISCLOSURE}</p>
        )}

        <Prose>
          <Markdown source={intro} />
        </Prose>

        <ComparePromoCta promos={promos} />

        <FeaturedModels sides={sides} type={page.type} />

        {quickVerdict && (
          <Prose>
            <h2>Quick verdict</h2>
            <Markdown source={quickVerdict.body} />
          </Prose>
        )}

        <ArticleQuizCta className="mt-10" />
      </div>

      <section className="mt-12">
        <div className="mx-auto max-w-3xl">
          <Prose>
            <h2>Full spec comparison</h2>
            {specSection && <Markdown source={specSection.body} />}
          </Prose>
          <KeyTakeaways takeaways={takeaways} />
        </div>
        <ComparisonTable sideA={sideA} sideB={sideB} />
      </section>

      <div className="mx-auto max-w-3xl">
        <ArticleQuizCta className="mt-12" />

        <RelatedComparisons links={relatedLinks} />

        <p className="mt-10 text-xs text-black/35">
          Specifications come from our{' '}
          <Link href="/models/" className="text-[#38b1ab] hover:underline">
            Australian trampoline comparison data
          </Link>
          , sourced from manufacturer listings. Brands compared: {brands.join(' and ')}.
        </p>
      </div>
    </article>
  );
}
