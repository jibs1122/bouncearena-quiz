import { TRAMPOLINES } from '@/data/trampolines';
import { getAllBrands, getBrandRows } from '@/lib/brands';
import { getComparePages } from '@/lib/comparePages';
import { groupRows } from '@/lib/compareShared';
import { getAllPosts } from '@/lib/content';
import { type SearchItem, toSearchAnchor } from '@/lib/search';

const CORE_PAGES: SearchItem[] = [
  {
    id: 'page-quiz',
    title: 'Find Your Trampoline',
    href: '/quiz/',
    kind: 'page',
    description: 'Take the guided quiz and get trampoline recommendations for your family and backyard.',
    keywords: ['quiz', 'recommendation', 'which trampoline', 'help me choose', 'trampoline finder'],
    priority: 100,
    suggested: true,
  },
  {
    id: 'page-models',
    title: 'Compare All Trampoline Models',
    href: '/models/',
    kind: 'page',
    description: 'Filter Australian trampolines by brand, price, size, shape, warranty and safety standard.',
    keywords: [
      'models',
      'trampolines',
      'products',
      'prices',
      'specifications',
      ...TRAMPOLINES.flatMap((row) => [row.brand, row.model]),
    ],
    priority: 95,
    suggested: true,
  },
  {
    id: 'page-brands',
    title: 'Australian Trampoline Brands',
    href: '/brands/',
    kind: 'page',
    description: 'Browse every major trampoline brand, with model ranges, prices and specifications.',
    keywords: ['brands', 'manufacturers', ...getAllBrands().map((brand) => brand.name)],
    priority: 90,
    suggested: true,
  },
  {
    id: 'page-comparisons',
    title: 'Trampoline Comparisons',
    href: '/compare/',
    kind: 'page',
    description: 'Browse brand-versus-brand and model-versus-model trampoline comparisons.',
    keywords: ['compare', 'comparison', 'versus', 'vs', 'which is better'],
    priority: 85,
    suggested: true,
  },
  {
    id: 'page-reviews',
    title: 'Trampoline Reviews',
    href: '/reviews/',
    kind: 'page',
    description: 'Read hands-on trampoline reviews, expert opinions and owner experiences.',
    keywords: ['reviews', 'ratings', 'expert review', 'owner review'],
    priority: 50,
  },
  {
    id: 'page-blog',
    title: 'Trampoline Buying Guides',
    href: '/blog/',
    kind: 'page',
    description: 'Explore buying advice about trampoline size, safety, prices, assembly and warranties.',
    keywords: ['blog', 'guides', 'advice', 'buying guide', 'how to choose'],
    priority: 40,
  },
];

function getBrandItems(): SearchItem[] {
  return getAllBrands().flatMap((brand, index) => {
    const rows = getBrandRows(brand.name);
    if (rows.length === 0) return [];
    const title = /trampolines$/i.test(brand.name) ? brand.name : `${brand.name} Trampolines`;

    return [{
      id: `brand-${brand.slug}`,
      title,
      href: `/brands/${brand.slug}/`,
      kind: 'brand' as const,
      description: brand.blurb,
      keywords: [
        brand.name,
        brand.slug,
        `${brand.name} brand`,
        `${brand.name} models`,
        ...rows.flatMap((row) => [row.model, row.shape, row.springSystem ?? '']),
      ],
      priority: 80 - index,
      suggested: index < 2,
    }];
  });
}

function getModelItems(): SearchItem[] {
  return groupRows(TRAMPOLINES).map((group) => {
    const brand = getAllBrands().find((candidate) => candidate.name === group.brand);
    const shapes = [...new Set(group.variants.map((row) => row.shape.toLowerCase()))];
    const springTypes = [
      ...new Set(group.variants.map((row) => row.springSystem).filter((value): value is string => Boolean(value))),
    ];
    const sizes = [...new Set(group.variants.map((row) => row.size))];

    return {
      id: `model-${toSearchAnchor(`${group.brand}-${group.model}`)}`,
      title: `${group.brand} ${group.model}`,
      href: brand
        ? `/brands/${brand.slug}/#${toSearchAnchor(group.model)}`
        : '/models/',
      kind: 'model',
      description: `${shapes.join(' and ')} model available in ${group.variants.length} listed ${group.variants.length === 1 ? 'size' : 'sizes'}. Compare prices, dimensions, safety and warranty.`,
      keywords: [group.brand, group.model, ...shapes, ...springTypes, ...sizes],
      priority: 30,
    } satisfies SearchItem;
  });
}

function getComparisonItems(): SearchItem[] {
  return getComparePages().map((page) => ({
    id: `comparison-${page.slug}`,
    title: page.title,
    href: `/compare/${page.slug}/`,
    kind: 'comparison',
    description: page.description,
    keywords: [
      page.slug,
      'versus',
      'vs',
      ...page.sides.flatMap((side) => [
        side.label,
        side.brand,
        ...(side.models?.flatMap((model) => [model.model, model.size ?? '']) ?? []),
      ]),
    ],
    priority: 35,
  }));
}

function getPostItems(): SearchItem[] {
  return getAllPosts().map((post) => ({
    id: `post-${post.slug}`,
    title: post.title,
    href: `/${post.slug}/`,
    kind:
      post.category === 'reviews'
        ? 'review'
        : post.category === 'comparisons'
          ? 'comparison'
          : 'guide',
    description: post.description,
    keywords: [post.slug.replace(/-/g, ' '), post.category],
    priority: post.category === 'reviews' ? 25 : 15,
  }));
}

export function getSearchItems(): SearchItem[] {
  const items = [
    ...CORE_PAGES,
    ...getBrandItems(),
    ...getModelItems(),
    ...getComparisonItems(),
    ...getPostItems(),
  ];
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}
