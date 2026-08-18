import type { Trampoline } from '@/data/trampolines';
import { getRawVulyAffiliateLink, isRawVulyAffiliateHref } from '@/lib/links';

export type GroupedTrampoline = {
  key: string;
  brand: string;
  model: string;
  shape: string;
  variants: Trampoline[];
};

export const AFFILIATE_DISCLOSURE =
  'This page contains affiliate links and we may earn a commission on purchases.';

export const PRICE_FOOTNOTE = 'Prices sourced from manufacturer websites and may change.';

export const BRAND_COLORS: Record<string, string> = {
  Vuly: 'bg-[#f15a01]/10 text-[#c44900] border-[#f15a01]/30',
  Jumpflex: 'bg-[#98c84e]/15 text-black border-[#98c84e]/70',
  Springfree: 'bg-[#0088CE]/10 text-[#0074AE] border-[#0088CE]/60',
  'Oz Trampolines': 'bg-[#0066B3]/10 text-[#005999] border-[#0066B3]/30',
  'Jump Star': 'bg-[#ED1C24]/10 text-[#C9151C] border-[#ED1C24]/30',
  'Lifespan Kids': 'bg-[#0054A6]/10 text-[#004887] border-[#0054A6]/30',
  Kahuna: 'bg-[#FF6C11]/10 text-[#B84A00] border-[#FF6C11]/30',
  Kmart: 'bg-[#E31B23]/10 text-[#B3151B] border-[#E31B23]/30',
  GeeTramp: 'bg-[#1a1a1a]/5 text-black/70 border-black/20',
  ACON: 'bg-[#003057]/10 text-[#00294a] border-[#003057]/30',
  BERG: 'bg-[#FFD500]/20 text-black/70 border-[#d4b200]/50',
  Plum: 'bg-[#7B2D82]/10 text-[#632468] border-[#7B2D82]/30',
  'Mr Trampoline': 'bg-[#2F6B3A]/10 text-[#28592f] border-[#2F6B3A]/30',
};

export const FALLBACK_BRAND_COLOR = 'bg-gray-50 text-gray-600 border-gray-200';

export function sizeLabel(t: Trampoline) {
  if (t.shape === 'Round') return t.overallDiamCm ? `${t.overallDiamCm} cm` : t.size;
  if (t.overallLenCm && t.overallWidCm) return `${t.overallLenCm}×${t.overallWidCm} cm`;
  return t.size;
}

export function formatFeet(valueCm: number): string {
  const feet = valueCm / 30.48;
  const rounded = Math.round(feet * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} ft`;
}

export function springfreeFamilyModel(model: string): string | null {
  const match = model.match(/^(Mini|Compact|Medium|Large|Jumbo)\s+(Round|Oval|Square)\s+Trampoline$/i);
  if (!match) return null;

  return `${match[2]} Trampoline`;
}

export function springfreeSizeLabel(model: string): string | null {
  const match = model.match(/^(Mini|Compact|Medium|Large|Jumbo)\s+(Round|Oval|Square)\s+Trampoline$/i);
  if (!match) return null;

  return match[1];
}

export function compareSizeLabel(t: Trampoline): string {
  if (t.brand === 'Springfree') {
    const springfreeLabel = springfreeSizeLabel(t.model);
    const maxDimensionCm = longestFootprintCm(t);

    if (springfreeLabel && maxDimensionCm) {
      return `${formatFeet(maxDimensionCm)} (${springfreeLabel})`;
    }
  }

  if (/^[SMLX]+$/i.test(t.size)) {
    if (t.shape === 'Round' && t.overallDiamCm) {
      return `${formatFeet(t.overallDiamCm)} (${t.size})`;
    }

    if (t.overallLenCm && t.overallWidCm) {
      return `${formatFeet(t.overallWidCm)} × ${formatFeet(t.overallLenCm)} (${t.size})`;
    }
  }

  return t.size.replace(/\s*x\s*/i, ' × ');
}

export function sizeStringToMaxDimensionCm(size: string): number | null {
  const normalized = size.toLowerCase().replace(/×/g, 'x');
  const matches = [...normalized.matchAll(/(\d+(?:\.\d+)?)/g)].map((match) => Number(match[1]));
  if (matches.length === 0) return null;

  const maxDimension = Math.max(...matches);

  if (normalized.includes('ft')) {
    return maxDimension * 30.48;
  }

  if (normalized.includes('m')) {
    return maxDimension * 100;
  }

  return null;
}

export function longestFootprintCm(t: Trampoline): number | null {
  return t.overallDiamCm ?? t.overallLenCm ?? sizeStringToMaxDimensionCm(t.size);
}

export function cmToFeet(valueCm: number): number {
  return valueCm / 30.48;
}

export function variantKey(group: GroupedTrampoline, variant: Trampoline): string {
  return [
    group.key,
    variant.goSlug ?? variant.model,
    variant.size,
    variant.overallDiamCm ?? 'd',
    variant.overallLenCm ?? 'l',
    variant.overallWidCm ?? 'w',
  ].join('|');
}

export function productUrl(t: Trampoline, useAffiliate: boolean): string | null {
  if (t.brand === 'Vuly') {
    if (t.goSlug) return getRawVulyAffiliateLink(t.goSlug);
    return t.sourceUrl && isRawVulyAffiliateHref(t.sourceUrl) ? t.sourceUrl : null;
  }

  if (t.brand === 'Springfree' && t.goSlug) return `/go/${t.goSlug}/`;
  if (useAffiliate && t.goSlug) return getRawVulyAffiliateLink(t.goSlug) ?? `/go/${t.goSlug}/`;
  return t.sourceUrl ?? null;
}

export function groupKey(t: Trampoline): string {
  if (t.brand === 'Springfree') {
    const familyModel = springfreeFamilyModel(t.model);
    if (familyModel) return `${t.brand}|${familyModel}`;
  }

  return `${t.brand}|${t.model}`;
}

export function groupRows(rows: Trampoline[]): GroupedTrampoline[] {
  const groups = new Map<string, GroupedTrampoline>();

  for (const row of rows) {
    const key = groupKey(row);

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        brand: row.brand,
        model: row.brand === 'Springfree' ? (springfreeFamilyModel(row.model) ?? row.model) : row.model,
        shape: row.shape,
        variants: [],
      });
    }

    groups.get(key)?.variants.push(row);
  }

  return [...groups.values()].map((group) => ({
    ...group,
    variants: [...group.variants].sort((a, b) => {
      const aSize = longestFootprintCm(a) ?? Infinity;
      const bSize = longestFootprintCm(b) ?? Infinity;
      return aSize - bSize;
    }),
  }));
}

export function formatRange(values: Array<number | null | undefined>, unit: string) {
  const present = values.filter((value): value is number => typeof value === 'number');
  if (present.length === 0) return '—';

  const low = Math.min(...present);
  const high = Math.max(...present);

  if (low === high) return `${low} ${unit}`;
  return `${low}-${high} ${unit}`;
}

export function formatWarrantyYears(value: number | null | undefined, style: 'long' | 'short' = 'long') {
  if (typeof value !== 'number') return '-';
  if (style === 'short') return `${value} yr`;
  return `${value} ${value === 1 ? 'year' : 'years'}`;
}

export function formatWarrantyRange(
  values: Array<number | null | undefined>,
  style: 'long' | 'short' = 'long',
) {
  const present = values.filter((value): value is number => typeof value === 'number');
  if (present.length === 0) return '-';

  const low = Math.min(...present);
  const high = Math.max(...present);

  if (low === high) return formatWarrantyYears(low, style);
  return style === 'short' ? `${low}-${high} yr` : `${low}-${high} years`;
}

export function overallSizeSummary(group: GroupedTrampoline): string {
  const labels = [...new Set(group.variants.map((variant) => sizeLabel(variant)))];
  if (labels.length === 0) return '—';
  if (labels.length === 1) return labels[0];
  return `${labels[0]} to ${labels[labels.length - 1]}`;
}

export function groupPriceRange(
  variants: Trampoline[],
): { low: number; high: number; hasFromPrice: boolean } | null {
  const prices = variants
    .map((variant) => variant.priceAud)
    .filter((value): value is number => typeof value === 'number');

  if (prices.length === 0) return null;

  return {
    low: Math.min(...prices),
    high: Math.max(...prices),
    hasFromPrice: variants.some((variant) => variant.priceBasis.toLowerCase().includes('from')),
  };
}

export function groupShopUrl(group: GroupedTrampoline, useAffiliate: boolean): string | null {
  const preferred = group.variants.find((variant) => productUrl(variant, useAffiliate));
  return preferred ? productUrl(preferred, useAffiliate) : null;
}

export function groupReview(group: GroupedTrampoline) {
  return group.variants.find((variant) => variant.reviewSlug || variant.baScore) ?? null;
}
