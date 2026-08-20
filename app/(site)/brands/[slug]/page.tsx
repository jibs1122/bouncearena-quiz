import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ArticleQuizCta from '@/components/ArticleQuizCta';
import BrandLogoAvatar from '@/components/BrandLogoAvatar';
import ComparePromoCta from '@/components/compare/ComparePromoCta';
import JsonLd from '@/components/compare/JsonLd';
import RelatedComparisons, { type RelatedLink } from '@/components/compare/RelatedComparisons';
import ModelImage from '@/components/ModelImage';
import type { Trampoline } from '@/data/trampolines';
import { hasAffiliateLink, isAffiliateRow, outboundRel } from '@/lib/affiliate';
import { getAllBrands, getBrandBySlug, getBrandRows } from '@/lib/brands';
import {
  comparePageBrands,
  comparePageHref,
  getComparePages,
  getReviewLinks,
} from '@/lib/comparePages';
import { getAllPosts, getPost } from '@/lib/content';
import {
  AFFILIATE_DISCLOSURE,
  BRAND_COLORS,
  FALLBACK_BRAND_COLOR,
  PRICE_FOOTNOTE,
  compareSizeLabel,
  formatWarrantyYears,
  groupPriceRange,
  groupRows,
  longestFootprintCm,
  productUrl,
  sizeLabel,
  type GroupedTrampoline,
} from '@/lib/compareShared';
import { buildPromosForBrands } from '@/lib/promoCtas';
import { toSearchAnchor } from '@/lib/search';

const SITE_URL = 'https://bouncearena.com.au';

type Props = {
  params: Promise<{ slug: string }>;
};

function brandTitle(name: string): string {
  return name.endsWith('Trampolines') ? name : `${name} Trampolines`;
}

function formatAud(value: number): string {
  return `$${value.toLocaleString('en-AU')}`;
}

function priceRangeLabel(rows: Trampoline[]): string | null {
  const range = groupPriceRange(rows);
  if (!range) return null;

  if (range.low === range.high) {
    return range.hasFromPrice ? `From ${formatAud(range.low)}` : formatAud(range.low);
  }

  return `${formatAud(range.low)}-${formatAud(range.high)}`;
}

function groupTopPrice(group: GroupedTrampoline): number {
  const prices = group.variants
    .map((variant) => variant.priceAud)
    .filter((price): price is number => price !== null);

  return prices.length > 0 ? Math.max(...prices) : Number.NEGATIVE_INFINITY;
}

function featuredGroups(rows: Trampoline[]): GroupedTrampoline[] {
  return [...groupRows(rows)]
    .sort((a, b) => groupTopPrice(b) - groupTopPrice(a))
    .slice(0, 4);
}

function shapeSummary(rows: Trampoline[]): string {
  const shapes = [...new Set(rows.map((row) => row.shape))];
  return shapes.length > 0 ? shapes.join(', ') : 'varied shapes';
}

function modelStandardCoverage(groups: GroupedTrampoline[]) {
  const certified = groups.filter((group) =>
    group.variants.every((variant) => variant.meetsAuStd)
  ).length;
  const partiallyCertified = groups.filter((group) => {
    const certifiedVariants = group.variants.filter((variant) => variant.meetsAuStd).length;
    return certifiedVariants > 0 && certifiedVariants < group.variants.length;
  }).length;

  return { certified, partiallyCertified };
}

function standardSummary(groups: GroupedTrampoline[], brandName: string): string {
  const { certified, partiallyCertified } = modelStandardCoverage(groups);
  const total = groups.length;
  const standard = 'the Australian Trampoline Standard AS 4989:2015';

  if (certified === 0 && partiallyCertified === 0) {
    return `No ${brandName} model is listed as meeting ${standard}.`;
  }
  if (certified === total) {
    return `Every model is listed as meeting ${standard}.`;
  }
  if (partiallyCertified === 0) {
    return `${certified} of the ${total} models ${certified === 1 ? 'is' : 'are'} listed as meeting ${standard}.`;
  }

  const partialSummary = `${partiallyCertified} other ${partiallyCertified === 1 ? 'model has' : 'models have'} only some sizes confirmed`;

  if (certified === 0) {
    return `No ${brandName} model is confirmed across every size; ${partiallyCertified} of the ${total} ${partiallyCertified === 1 ? 'models has' : 'models have'} only some sizes listed as meeting ${standard}.`;
  }

  return `${certified} of the ${total} models ${certified === 1 ? 'is' : 'are'} listed as meeting ${standard}; ${partialSummary}.`;
}

function largestSize(rows: Trampoline[]): string | null {
  const largest = [...rows].sort((a, b) => (longestFootprintCm(b) ?? 0) - (longestFootprintCm(a) ?? 0))[0];
  return largest ? compareSizeLabel(largest) : null;
}

function matLabel(row: Trampoline): string {
  if (row.matDiamCm) return `${row.matDiamCm} cm across`;
  if (row.matLenCm && row.matWidCm) return `${row.matLenCm}x${row.matWidCm} cm`;
  return '-';
}

function cmLabel(value: number | null): string {
  return value ? `${value} cm` : '-';
}

function kgLabel(value: number | null): string {
  return value ? `${value} kg` : '-';
}

function warrantyLabel(value: number | null): string {
  return formatWarrantyYears(value);
}

function standardLabel(row: Trampoline): string {
  if (!row.meetsAuStd) return 'Not confirmed';
  return row.auStdDetail?.replace(/AS\s*4989:2015/i, 'AS 4989:2015') ?? 'AS 4989:2015';
}

function priceCell(row: Trampoline) {
  return <span className="font-semibold text-black">{row.priceAud ? formatAud(row.priceAud) : '-'}</span>;
}

function PriceRange({ rows }: { rows: Trampoline[] }) {
  const range = groupPriceRange(rows);
  if (!range) return null;

  return (
    <>
      {formatAud(range.low)}
      {(range.low !== range.high || range.hasFromPrice) && (
        <span className="ml-1 text-[10px] font-normal text-black/35">
          {range.low !== range.high ? `to ${formatAud(range.high)}` : 'from'}
        </span>
      )}
    </>
  );
}

function springRangeLabel(rows: Trampoline[]): string {
  const hasSpringless = rows.some((row) => row.springless);
  const hasCoilSprings = rows.some((row) => !row.springless);

  if (hasSpringless && hasCoilSprings) return 'Coil-spring and springless models';
  if (hasSpringless) return 'Springless-only models';
  return 'Coil-spring-only models';
}

function ShopLink({ row }: { row: Trampoline }) {
  const href = productUrl(row, true);
  if (!href) return <span className="text-black/25">-</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel={outboundRel(isAffiliateRow(row))}
      className="whitespace-nowrap text-[#38b1ab] hover:underline"
    >
      Check price →
    </a>
  );
}

function ModelNameCell({ row }: { row: Trampoline }) {
  const href = productUrl(row, true);
  if (!href) return <span>{row.model}</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel={outboundRel(isAffiliateRow(row))}
      className="text-[#38b1ab] hover:underline"
    >
      {row.model}
    </a>
  );
}

function FeaturedModelCard({ group, priority }: { group: GroupedTrampoline; priority: boolean }) {
  const rows = group.variants;
  const chip = BRAND_COLORS[group.brand] ?? FALLBACK_BRAND_COLOR;
  const sizes = [...new Set(rows.map(compareSizeLabel))];
  const springSystem = rows.find((row) => row.springSystem)?.springSystem ?? null;
  const linkRow =
    [...rows]
      .filter((row) => productUrl(row, true))
      .sort((a, b) => (b.priceAud ?? 0) - (a.priceAud ?? 0))[0] ?? null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#38b1ab]/30 hover:shadow-[0_18px_45px_rgba(0,0,0,0.08)]">
      <div className="relative flex aspect-[4/3] items-center justify-center border-b border-black/[0.06] bg-gray-50">
        <ModelImage
          brand={group.brand}
          model={group.model}
          priority={priority}
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className={`mb-2 inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${chip}`}>
          {group.brand}
        </span>
        <h3 className="text-base font-semibold text-black">{group.model}</h3>
        <p className="mt-1 text-lg font-bold text-black"><PriceRange rows={rows} /></p>
        {springSystem && <p className="mt-1 text-xs leading-5 text-black/50">{springSystem}</p>}

        {sizes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sizes.map((size) => (
              <span
                key={size}
                className="whitespace-nowrap rounded-full border border-black/10 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-black/60"
              >
                {size}
              </span>
            ))}
          </div>
        )}

        {linkRow && (
          <a
            href={productUrl(linkRow, true) ?? undefined}
            target="_blank"
            rel={outboundRel(isAffiliateRow(linkRow))}
            className="mt-4 inline-flex w-fit items-center gap-1 rounded-xl bg-[#38b1ab] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2e9a94]"
          >
            Check price →
          </a>
        )}
      </div>
    </article>
  );
}

function SpecTable({ rows }: { rows: Trampoline[] }) {
  const tableRows = [...groupRows(rows)]
    .sort((a, b) => groupTopPrice(b) - groupTopPrice(a))
    .flatMap((group) => group.variants);

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/[0.08] shadow-sm">
      <table className="w-full min-w-[1320px] text-sm">
        <caption className="sr-only">
          {rows[0]?.brand ?? 'Brand'} trampoline model specifications
        </caption>
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-black/45">
            <th scope="col" className="sticky left-0 z-20 bg-gray-50 px-4 py-3">Model</th>
            <th scope="col" className="w-[120px] min-w-[120px] whitespace-nowrap px-4 py-3">Size</th>
            <th scope="col" className="px-4 py-3">Shape</th>
            <th scope="col" className="px-4 py-3">Spring type</th>
            <th scope="col" className="px-4 py-3">Price</th>
            <th scope="col" className="px-4 py-3">Overall</th>
            <th scope="col" className="px-4 py-3">Mat</th>
            <th scope="col" className="px-4 py-3">Height</th>
            <th scope="col" className="px-4 py-3">Max jumper</th>
            <th scope="col" className="px-4 py-3">Combined</th>
            <th scope="col" className="px-4 py-3">Springs</th>
            <th scope="col" className="px-4 py-3">Frame warranty</th>
            <th scope="col" className="px-4 py-3">Mat warranty</th>
            <th scope="col" className="px-4 py-3">Net warranty</th>
            <th scope="col" className="px-4 py-3">AU Std</th>
            <th scope="col" className="px-4 py-3">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.05]">
          {tableRows.map((row, index) => (
            <tr
              key={`${row.brand}-${row.model}-${row.size}`}
              id={tableRows[index - 1]?.model === row.model ? undefined : toSearchAnchor(row.model)}
              className="scroll-mt-24 bg-white align-top"
            >
              <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3 text-left font-medium text-black">
                <ModelNameCell row={row} />
              </th>
              <td className="w-[120px] min-w-[120px] whitespace-nowrap px-4 py-3 text-black/70">{compareSizeLabel(row)}</td>
              <td className="px-4 py-3 text-black/60">{row.shape}</td>
              <td className="px-4 py-3 text-black/60">{row.springSystem ?? '-'}</td>
              <td className="px-4 py-3">{priceCell(row)}</td>
              <td className="px-4 py-3 text-black/60">{sizeLabel(row)}</td>
              <td className="px-4 py-3 text-black/60">{matLabel(row)}</td>
              <td className="px-4 py-3 text-black/60">{cmLabel(row.totalHeightCm)}</td>
              <td className="px-4 py-3 text-black/60">{kgLabel(row.maxWeightKg)}</td>
              <td className="px-4 py-3 text-black/60">{kgLabel(row.combinedWeightKg)}</td>
              <td className="px-4 py-3 text-black/60">{row.springCount ?? '-'}</td>
              <td className="px-4 py-3 text-black/60">{warrantyLabel(row.warrantyFrameYrs)}</td>
              <td className="px-4 py-3 text-black/60">{warrantyLabel(row.warrantyMatYrs)}</td>
              <td className="px-4 py-3 text-black/60">{warrantyLabel(row.warrantyNetYrs)}</td>
              <td className="px-4 py-3 text-black/60">{standardLabel(row)}</td>
              <td className="px-4 py-3 text-xs"><ShopLink row={row} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function generateStaticParams() {
  return getAllBrands().map((brand) => ({ slug: brand.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) return {};

  const rows = getBrandRows(brand.name);
  const price = priceRangeLabel(rows);
  const subject = brandTitle(brand.name);
  const title = `${subject}: Models, Prices and Specs`;
  const description =
    `Compare ${subject}${price ? ` from ${price}` : ''}. ` +
    `See sizes, spring type, warranty, weight ratings and Australian standard details.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/brands/${brand.slug}/` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/brands/${brand.slug}/`,
      siteName: 'Bounce Arena',
      type: 'website',
      images: [{
        url: `${SITE_URL}/images/posts/kids-bouncing-on-trampoline.jpg`,
        width: 1200,
        height: 800,
        alt: `${subject} in Australia`,
      }],
    },
  };
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) notFound();

  const rows = getBrandRows(brand.name);
  if (rows.length === 0) notFound();

  const groups = groupRows(rows);
  const featured = featuredGroups(rows);
  const price = priceRangeLabel(rows);
  const largest = largestSize(rows);
  const {
    certified: certifiedModelCount,
    partiallyCertified: partiallyCertifiedModelCount,
  } = modelStandardCoverage(groups);
  const springRange = springRangeLabel(rows);
  const promos = buildPromosForBrands([brand.name]);
  const showDisclosure = hasAffiliateLink(rows);
  const title = brandTitle(brand.name);
  const canonical = `${SITE_URL}/brands/${brand.slug}/`;

  // Internal links: every comparison featuring this brand, its own reviews, the
  // other brands we cover, and the guides that help narrow a shortlist.
  const comparisons: RelatedLink[] = getComparePages()
    .filter((page) => comparePageBrands(page).includes(brand.name))
    .map((page) => ({ href: comparePageHref(page.slug), label: page.title }));

  const postSlugs = new Set(getAllPosts().map((post) => post.slug));
  const reviews: RelatedLink[] = getReviewLinks(rows)
    .map((review) => {
      const post = getPost(review.slug);
      return post ? { href: `/${review.slug}/`, label: post.title } : null;
    })
    .filter((link): link is RelatedLink => link !== null);

  const otherBrands: RelatedLink[] = getAllBrands()
    .filter((other) => other.slug !== brand.slug && getBrandRows(other.name).length > 0)
    .slice(0, 8)
    .map((other) => ({ href: `/brands/${other.slug}/`, label: brandTitle(other.name) }));

  const guides: RelatedLink[] = [
    { href: '/compare/', label: 'All trampoline comparisons' },
    { href: '/models/', label: 'Compare every model side-by-side' },
    { href: '/springless-vs-spring-trampolines/', label: 'Springless vs spring trampolines' },
    { href: '/trampoline-size/', label: 'Trampoline size guide' },
    { href: '/best-trampolines-australia-2025/', label: 'Best trampolines in Australia' },
  ].filter((link) => {
    const slugOnly = link.href.replace(/\//g, '');
    return ['compare', 'models'].includes(slugOnly) || postSlugs.has(slugOnly);
  });

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Brands', item: `${SITE_URL}/brands/` },
      { '@type': 'ListItem', position: 3, name: brand.name, item: canonical },
    ],
  };

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: rows.map((row, index) => {
      const href = productUrl(row, true);

      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: `${row.brand} ${row.model} ${row.size}`,
          brand: { '@type': 'Brand', name: row.brand },
          ...(row.priceAud
            ? {
                offers: {
                  '@type': 'Offer',
                  priceCurrency: 'AUD',
                  price: row.priceAud,
                  url: href?.startsWith('/') ? `${SITE_URL}${href}` : href ?? undefined,
                },
              }
            : {}),
        },
      };
    }),
  };

  return (
    <article className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <JsonLd data={breadcrumb} />
      <JsonLd data={itemList} />

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-black/40">
        <Link href="/" className="transition-colors hover:text-black">Home</Link>
        <span>/</span>
        <Link href="/brands/" className="transition-colors hover:text-black">Brands</Link>
        <span>/</span>
        <span className="text-black/60">{brand.name}</span>
      </nav>

      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#38b1ab]">Brand guide</span>
            {price && <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-medium text-black/55">{price}</span>}
          </div>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-black sm:text-4xl">{title}</h1>
        </div>
        <BrandLogoAvatar
          name={brand.name}
          width={230}
          height={124}
          className="shadow-sm"
          imageClassName="p-4"
          priority
        />
      </div>

      {showDisclosure && <p className="mb-6 max-w-3xl text-sm leading-relaxed text-black/45">{AFFILIATE_DISCLOSURE}</p>}

      <section className="mb-10 max-w-3xl space-y-4">
        <p className="text-base leading-7 text-black/72">{brand.blurb}</p>
        <p className="text-base leading-7 text-black/72">
          {brand.name} sells {groups.length} model{groups.length === 1 ? '' : 's'} in Australia, across{' '}
          {rows.length} size{rows.length === 1 ? '' : 's'} — {shapeSummary(rows).toLowerCase()}
          {largest ? `, up to ${largest}` : ''}. {standardSummary(groups, brand.name)} {brand.warranty}
        </p>
      </section>

      <ul className="mb-10 flex flex-wrap gap-x-6 gap-y-2 border-y border-black/[0.08] py-3 text-sm text-black/60">
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#38b1ab]" aria-hidden="true" />
          <span><strong className="font-semibold text-black">{groups.length}</strong> {groups.length === 1 ? 'model' : 'models'}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#38b1ab]" aria-hidden="true" />
          <span><strong className="font-semibold text-black">{rows.length}</strong> listed {rows.length === 1 ? 'size' : 'sizes'}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#38b1ab]" aria-hidden="true" />
          <span>{springRange}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#38b1ab]" aria-hidden="true" />
          <span>
            {certifiedModelCount > 0 ? (
              <>
                <strong className="font-semibold text-black">{certifiedModelCount}</strong>{' '}
                {certifiedModelCount === 1 ? 'model' : 'models'} meeting the AU standard
                {partiallyCertifiedModelCount > 0 && (
                  <>; <strong className="font-semibold text-black">{partiallyCertifiedModelCount}</strong>{' '}
                    {partiallyCertifiedModelCount === 1 ? 'model has' : 'models have'} some sizes confirmed</>
                )}
              </>
            ) : partiallyCertifiedModelCount > 0 ? (
              <>
                <strong className="font-semibold text-black">{partiallyCertifiedModelCount}</strong>{' '}
                {partiallyCertifiedModelCount === 1 ? 'model has' : 'models have'} some sizes confirmed for the AU standard
              </>
            ) : (
              'AU standard not confirmed'
            )}
          </span>
        </li>
      </ul>

      <ComparePromoCta promos={promos} />

      <section className="mb-12">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black">Featured models</h2>
            <p className="mt-1 text-sm text-black/55">
              The top of the {brand.name} range, starting with the most expensive.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((group, index) => (
            <FeaturedModelCard key={group.key} group={group} priority={index === 0} />
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-black">Full spec table</h2>
        <SpecTable rows={rows} />
        <p className="mt-3 text-xs text-black/35">{PRICE_FOOTNOTE}</p>
      </section>

      <ArticleQuizCta className="mt-10" />

      {comparisons.length > 0 && (
        <RelatedComparisons heading={`${brand.name} comparisons`} links={comparisons} />
      )}

      {reviews.length > 0 && (
        <RelatedComparisons heading={`${brand.name} reviews`} links={reviews} />
      )}

      {otherBrands.length > 0 && (
        <RelatedComparisons heading="Other trampoline brands" links={otherBrands} />
      )}

      <RelatedComparisons heading="Buying guides" links={guides} />
    </article>
  );
}
