'use client';

import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { TRAMPOLINES, type Trampoline } from '@/data/trampolines';

type SortKey = 'priceAud' | 'overallDiamCm' | 'maxWeightKg' | 'warrantyFrameYrs';
type SortDir = 'asc' | 'desc';
type GroupedTrampoline = {
  key: string;
  brand: string;
  model: string;
  shape: string;
  variants: Trampoline[];
};

const ALL_BRANDS = [...new Set(TRAMPOLINES.map((t) => t.brand))];
const ALL_SHAPES = [...new Set(TRAMPOLINES.map((t) => t.shape))];
const MAX_PRICE = Math.max(...TRAMPOLINES.map((t) => t.priceAud ?? 0));
// Yard slider: 4 m – 15 m (in whole metres)
const YARD_MIN = 4;
const YARD_MAX = 15;
const CLEARANCE_M = 1.5;
const AFFILIATE_DISCLOSURE =
  'This page contains affiliate links and we may earn a commission on purchases.';

const BRAND_COLORS: Record<string, string> = {
  Vuly: 'bg-purple-50 text-purple-700 border-purple-200',
  Jumpflex: 'bg-orange-50 text-orange-700 border-orange-200',
  Springfree: 'bg-green-50 text-green-700 border-green-200',
  'Oz Trampolines': 'bg-blue-50 text-blue-700 border-blue-200',
  'Jump Star': 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

function Tip({ text }: { text: string }) {
  const [pos, setPos] = useState<{ x: number; y: number; placeBelow: boolean } | null>(null);

  function getTooltipStyle() {
    if (!pos) return undefined;

    const tooltipWidth = 208;
    const gutter = 12;
    const viewportWidth = typeof window === 'undefined' ? tooltipWidth : window.innerWidth;
    const viewportHeight = typeof window === 'undefined' ? 800 : window.innerHeight;
    const left = Math.min(
      Math.max(pos.x, gutter + tooltipWidth / 2),
      viewportWidth - gutter - tooltipWidth / 2,
    );

    return {
      left,
      top: pos.placeBelow
        ? Math.min(pos.y + 24, viewportHeight - gutter)
        : pos.y - 8,
      transform: pos.placeBelow
        ? 'translateX(-50%)'
        : 'translateX(-50%) translateY(-100%)',
    } as const;
  }

  return (
    <span
      className="ml-1 cursor-help inline-block"
      onMouseEnter={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({
          x: r.left + r.width / 2,
          y: r.top,
          placeBelow: r.top < 80,
        });
      }}
      onMouseLeave={() => setPos(null)}
    >
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/10 text-[9px] font-bold text-black/50">?</span>
      {pos && (
        <span
          className="pointer-events-none fixed z-[9999] w-52 whitespace-normal rounded-lg bg-gray-900 px-2.5 py-2 text-xs leading-relaxed text-white shadow-lg"
          style={getTooltipStyle()}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function Cell({ val, unit, highlight }: { val: number | string | null | boolean; unit?: string; highlight?: 'high' | 'low' | null }) {
  if (val === null || val === undefined || val === '') return <span className="text-black/25">—</span>;
  if (typeof val === 'boolean') {
    return val ? <span className="font-semibold text-emerald-600">✓</span> : <span className="text-black/30">✗</span>;
  }
  const cls = highlight === 'high' ? 'text-emerald-600 font-semibold' : highlight === 'low' ? 'text-rose-500' : '';
  return <span className={cls}>{val}{unit ? <span className="text-black/40 text-xs ml-0.5">{unit}</span> : null}</span>;
}

function sizeLabel(t: Trampoline) {
  if (t.shape === 'Round') return t.overallDiamCm ? `${t.overallDiamCm} cm` : t.size;
  if (t.overallLenCm && t.overallWidCm) return `${t.overallLenCm}×${t.overallWidCm} cm`;
  return t.size;
}

function formatFeet(valueCm: number): string {
  const feet = valueCm / 30.48;
  const rounded = Math.round(feet * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} ft`;
}

function compareSizeLabel(t: Trampoline): string {
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

function sizeStringToMaxDimensionCm(size: string): number | null {
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

function longestFootprintCm(t: Trampoline): number | null {
  return t.overallDiamCm ?? t.overallLenCm ?? sizeStringToMaxDimensionCm(t.size);
}

function productUrl(t: Trampoline, useAffiliate: boolean): string | null {
  if (useAffiliate && t.goSlug) return `/go/${t.goSlug}/`;
  return t.sourceUrl ?? null;
}

function groupKey(t: Trampoline): string {
  return `${t.brand}|${t.model}`;
}

function groupRows(rows: Trampoline[]): GroupedTrampoline[] {
  const groups = new Map<string, GroupedTrampoline>();

  for (const row of rows) {
    const key = groupKey(row);

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        brand: row.brand,
        model: row.model,
        shape: row.shape,
        variants: [],
      });
    }

    groups.get(key)?.variants.push(row);
  }

  return [...groups.values()];
}

function formatRange(values: Array<number | null | undefined>, unit: string) {
  const present = values.filter((value): value is number => typeof value === 'number');
  if (present.length === 0) return '—';

  const low = Math.min(...present);
  const high = Math.max(...present);

  if (low === high) return `${low} ${unit}`;
  return `${low}-${high} ${unit}`;
}

function sizeSummary(group: GroupedTrampoline) {
  if (group.variants.length === 1) return compareSizeLabel(group.variants[0]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {group.variants.map((variant) => (
        <span
          key={`${group.key}|size|${variant.size}`}
          className="whitespace-nowrap rounded-full border border-black/10 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-black/60"
        >
          {compareSizeLabel(variant)}
        </span>
      ))}
    </div>
  );
}

function overallSizeSummary(group: GroupedTrampoline) {
  const labels = [...new Set(group.variants.map((variant) => sizeLabel(variant)))];
  if (labels.length === 0) return '—';
  if (labels.length === 1) return labels[0];
  return `${labels[0]} to ${labels[labels.length - 1]}`;
}

function priceSummary(group: GroupedTrampoline) {
  const prices = group.variants
    .map((variant) => variant.priceAud)
    .filter((value): value is number => typeof value === 'number');

  if (prices.length === 0) {
    return <span className="text-black/25">—</span>;
  }

  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const hasFromPrice = group.variants.some((variant) => variant.priceBasis.toLowerCase().includes('from'));

  return (
    <>
      ${low.toLocaleString()}
      {(low !== high || hasFromPrice) ? (
        <span className="ml-0.5 text-[10px] font-normal text-black/30">
          {low !== high ? `to $${high.toLocaleString()}` : 'from'}
        </span>
      ) : null}
    </>
  );
}

function groupShopUrl(group: GroupedTrampoline, useAffiliate: boolean): string | null {
  const preferred = group.variants.find((variant) => productUrl(variant, useAffiliate));
  return preferred ? productUrl(preferred, useAffiliate) : null;
}

function groupReview(group: GroupedTrampoline) {
  return group.variants.find((variant) => variant.reviewSlug || variant.baScore) ?? null;
}

export default function ComparePage() {
  const [brands, setBrands] = useState<string[]>([]);
  const [shapes, setShapes] = useState<string[]>([]);
  const [springlessOnly, setSpringlessOnly] = useState(false);
  const [auStdOnly, setAuStdOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [yardM, setYardM] = useState(YARD_MAX);
  const [sortKey, setSortKey] = useState<SortKey>('priceAud');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [useAffiliate, setUseAffiliate] = useState(false);

  useEffect(() => {
    try {
      setUseAffiliate(localStorage.getItem('ba-compare-affiliate') === '1');
    } catch {}
  }, []);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const maxFootprintCm = yardM < YARD_MAX ? (yardM - CLEARANCE_M * 2) * 100 : Infinity;

  const filtered = useMemo(() => {
    let rows = TRAMPOLINES.filter((t) => {
      if (brands.length && !brands.includes(t.brand)) return false;
      if (shapes.length && !shapes.includes(t.shape)) return false;
      if (springlessOnly && !t.springless) return false;
      if (auStdOnly && !t.meetsAuStd) return false;
      if (t.priceAud !== null && t.priceAud > maxPrice) return false;
      // Yard filter: use longest dimension
      const footprint = longestFootprintCm(t);
      if (footprint !== null && footprint > maxFootprintCm) return false;
      return true;
    });
    rows.sort((a, b) => {
      const av = a[sortKey] ?? (sortDir === 'asc' ? Infinity : -Infinity);
      const bv = b[sortKey] ?? (sortDir === 'asc' ? Infinity : -Infinity);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return rows;
  }, [brands, shapes, springlessOnly, auStdOnly, maxPrice, maxFootprintCm, sortKey, sortDir]);

  const grouped = useMemo(() => groupRows(filtered), [filtered]);

  const allWeights = filtered.map((t) => t.maxWeightKg).filter(Boolean) as number[];
  const maxW = Math.max(...allWeights);
  const minW = Math.min(...allWeights);
  const allWarranties = filtered.map((t) => t.warrantyFrameYrs).filter(Boolean) as number[];
  const maxWar = Math.max(...allWarranties);

  function SortTh({ label, k, tip }: { label: string; k: SortKey; tip: string }) {
    const active = sortKey === k;
    return (
      <th
        className="whitespace-nowrap cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold text-black/50 uppercase tracking-wide hover:text-black transition-colors"
        onClick={() => toggleSort(k)}
      >
        {label}<Tip text={tip} />
        <span className="ml-1 text-[10px]">{active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
      </th>
    );
  }

  const activeFilters: { label: string; clear: () => void }[] = [
    ...brands.map((b) => ({ label: b, clear: () => setBrands((p) => p.filter((x) => x !== b)) })),
    ...shapes.map((s) => ({ label: s, clear: () => setShapes((p) => p.filter((x) => x !== s)) })),
    ...(springlessOnly ? [{ label: 'Springless only', clear: () => setSpringlessOnly(false) }] : []),
    ...(auStdOnly ? [{ label: 'AU Standard', clear: () => setAuStdOnly(false) }] : []),
    ...(maxPrice < MAX_PRICE ? [{ label: `≤ $${maxPrice.toLocaleString()}`, clear: () => setMaxPrice(MAX_PRICE) }] : []),
    ...(yardM < YARD_MAX ? [{ label: `Yard ≤ ${yardM} m`, clear: () => setYardM(YARD_MAX) }] : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">Trampoline Comparison Table</h1>
        <p className="text-black/60 max-w-2xl">
          Compare all major Australian trampolines side-by-side on price, size, weight rating, warranty, and safety certification. Filter and sort to find your match.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-black/45">
          {AFFILIATE_DISCLOSURE}
        </p>
      </div>

      {/* Filter panel */}
      <div className="rounded-2xl border border-black/[0.08] bg-gray-50/60 p-5 mb-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-2">Brand</p>
          <div className="flex flex-wrap gap-2">
            {ALL_BRANDS.map((b) => (
              <button key={b} onClick={() => setBrands((p) => p.includes(b) ? p.filter((x) => x !== b) : [...p, b])}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${brands.includes(b) ? 'bg-[#38b1ab] border-[#38b1ab] text-white' : 'border-black/10 bg-white text-black/60 hover:border-[#38b1ab] hover:text-[#38b1ab]'}`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <div>
            <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-2">Shape</p>
            <div className="flex flex-wrap gap-2">
              {ALL_SHAPES.map((s) => (
                <button key={s} onClick={() => setShapes((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s])}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${shapes.includes(s) ? 'bg-[#38b1ab] border-[#38b1ab] text-white' : 'border-black/10 bg-white text-black/60 hover:border-[#38b1ab] hover:text-[#38b1ab]'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-2">Type</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Springless only', val: springlessOnly, set: setSpringlessOnly },
                { label: 'AU Standard certified', val: auStdOnly, set: setAuStdOnly },
              ].map(({ label, val, set }) => (
                <button key={label} onClick={() => set(!val)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${val ? 'bg-[#38b1ab] border-[#38b1ab] text-white' : 'border-black/10 bg-white text-black/60 hover:border-[#38b1ab] hover:text-[#38b1ab]'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Price slider */}
          <div className="w-[240px] max-w-full">
            <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-2">
              Max price: <span className="text-black">${maxPrice.toLocaleString()}</span>
            </p>
            <input type="range" min={400} max={MAX_PRICE} step={100} value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[#38b1ab]" />
          </div>

          {/* Yard size slider */}
          <div className="w-[280px] max-w-full">
            <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-1">
              Yard size:{' '}
              <span className="text-black">{yardM < YARD_MAX ? `${yardM} m` : 'Any'}</span>
            </p>
            <p className="mb-2 min-h-[1rem] text-[11px] text-black/35">
              {yardM < YARD_MAX
                ? `Fits up to ${(yardM - CLEARANCE_M * 2).toFixed(1)} m trampoline`
                : `Set a yard limit to filter larger models`}
            </p>
            <input type="range" min={YARD_MIN} max={YARD_MAX} step={0.5} value={yardM}
              onChange={(e) => setYardM(Number(e.target.value))} className="w-full accent-[#38b1ab]" />
            <p className="text-[10px] text-black/30 mt-0.5">Assumes {CLEARANCE_M} m clearance each side</p>
          </div>
        </div>
      </div>

      {/* Active filters + count */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm text-black/50">
          {grouped.length} model{grouped.length === 1 ? '' : 's'} from {filtered.length} matching size
          {filtered.length === 1 ? '' : 's'}
        </span>
        {activeFilters.map((f) => (
          <button key={f.label} onClick={f.clear}
            className="flex items-center gap-1 rounded-full bg-[#38b1ab]/10 border border-[#38b1ab]/30 px-2.5 py-0.5 text-xs font-medium text-[#38b1ab] hover:bg-[#38b1ab]/20 transition-colors">
            {f.label} <span>×</span>
          </button>
        ))}
        {activeFilters.length > 0 && (
          <button onClick={() => { setBrands([]); setShapes([]); setSpringlessOnly(false); setAuStdOnly(false); setMaxPrice(MAX_PRICE); setYardM(YARD_MAX); }}
            className="text-xs text-black/40 hover:text-black underline">Clear all</button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-black/[0.08] shadow-sm">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-gray-50 border-b border-black/[0.06]">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-black/50 uppercase tracking-wide whitespace-nowrap">Model</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-black/50 uppercase tracking-wide whitespace-nowrap sm:table-cell">Size</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-black/50 uppercase tracking-wide whitespace-nowrap">Spring type</th>
              <SortTh label="Price" k="priceAud" tip="AUD price. 'from' prices show the model's lowest available size." />
              <SortTh label="Max weight" k="maxWeightKg" tip="Maximum single-user weight rating in kg." />
              <SortTh label="Overall size" k="overallDiamCm" tip="Overall footprint — diameter for round, longest dimension for other shapes. Manufacturers generally recommend 1–2 m clearance on all sides." />
              <SortTh label="Frame warranty" k="warrantyFrameYrs" tip="Manufacturer's frame warranty in years." />
              <th className="px-4 py-3 text-left text-xs font-semibold text-black/50 uppercase tracking-wide whitespace-nowrap">
                AU Std<Tip text="Meets AS4989:2015, the Australian trampoline safety standard." />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {grouped.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-black/40">No trampolines match your filters.</td></tr>
            )}
            {grouped.map((group) => {
              const isExpanded = expanded.has(group.key);
              const weightValues = group.variants.map((variant) => variant.maxWeightKg).filter(Boolean) as number[];
              const warrantyValues = group.variants.map((variant) => variant.warrantyFrameYrs).filter(Boolean) as number[];
              const groupMaxWeight = weightValues.length ? Math.max(...weightValues) : null;
              const groupMinWeight = weightValues.length ? Math.min(...weightValues) : null;
              const weightHighlight: 'high' | 'low' | null =
                groupMaxWeight !== null && groupMaxWeight === maxW ? 'high' :
                groupMinWeight !== null && groupMinWeight === minW ? 'low' :
                null;
              const groupMaxWarranty = warrantyValues.length ? Math.max(...warrantyValues) : null;
              const warHighlight: 'high' | null =
                groupMaxWarranty !== null && groupMaxWarranty === maxWar ? 'high' : null;
              const brandColor = BRAND_COLORS[group.brand] ?? 'bg-gray-50 text-gray-600 border-gray-200';
              const shopUrl = groupShopUrl(group, useAffiliate);
              const review = groupReview(group);
              const allMeetAuStd = group.variants.every((variant) => variant.meetsAuStd);

              return (
                <React.Fragment key={group.key}>
                  <tr
                    className={`cursor-pointer hover:bg-gray-50/80 transition-colors ${isExpanded ? 'bg-gray-50/60' : ''}`}
                    onClick={() => toggleExpand(group.key)}
                  >
                    {/* Model */}
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-black">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] mt-0.5 text-black/30">{isExpanded ? '▲' : '▼'}</span>
                        <div>
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold mb-0.5 ${brandColor}`}>{group.brand}</span>
                          <div className="text-xs leading-tight text-black/70">{group.model}</div>
                          {group.variants.length > 1 && (
                            <div className="mt-1 text-[11px] text-black/35">
                              {group.variants.length} matching sizes
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Size */}
                    <td className="hidden px-4 py-3 text-black/60 sm:table-cell">{sizeSummary(group)}</td>
                    {/* Spring */}
                    <td className="px-4 py-3 text-xs text-black/40">{group.variants[0].springSystem ?? '—'}</td>
                    {/* Price + shop link */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="font-semibold text-black">{priceSummary(group)}</div>
                      {shopUrl && (
                        <a href={shopUrl} target="_blank" rel="nofollow noopener noreferrer"
                          className="text-[11px] text-[#38b1ab] hover:underline whitespace-nowrap">
                          View best price →
                        </a>
                      )}
                    </td>
                    {/* Max weight */}
                    <td className="px-4 py-3">
                      <Cell val={formatRange(group.variants.map((variant) => variant.maxWeightKg), 'kg')} highlight={weightHighlight} />
                    </td>
                    {/* Overall size */}
                    <td className="px-4 py-3 text-black/60">{overallSizeSummary(group)}</td>
                    {/* Frame warranty */}
                    <td className="px-4 py-3">
                      <Cell val={formatRange(group.variants.map((variant) => variant.warrantyFrameYrs), 'yr')} highlight={warHighlight} />
                    </td>
                    {/* AU Std */}
                    <td className="px-4 py-3"><Cell val={allMeetAuStd} /></td>
                  </tr>

                  {/* Expanded detail row */}
                  {isExpanded && (
                    <tr className="bg-gray-50/70">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[760px] text-xs">
                            <thead>
                              <tr className="border-b border-black/8 text-left text-[11px] uppercase tracking-wide text-black/40">
                                <th className="py-2 pr-4">Size</th>
                                <th className="py-2 pr-4">Price</th>
                                <th className="py-2 pr-4">Overall</th>
                                <th className="py-2 pr-4">Weight</th>
                                <th className="py-2 pr-4">Frame</th>
                                <th className="py-2 pr-4">AU Std</th>
                                <th className="py-2 pr-0">Link</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/[0.05]">
                              {group.variants.map((variant) => {
                                const variantShopUrl = productUrl(variant, useAffiliate);

                                return (
                                  <tr key={`${group.key}|variant|${variant.size}`}>
                                    <td className="py-2.5 pr-4 font-medium text-black/70">{compareSizeLabel(variant)}</td>
                                    <td className="py-2.5 pr-4 text-black/70">
                                      {variant.priceAud ? `$${variant.priceAud.toLocaleString()}` : '—'}
                                    </td>
                                    <td className="py-2.5 pr-4 text-black/60">{sizeLabel(variant)}</td>
                                    <td className="py-2.5 pr-4 text-black/60">
                                      {variant.maxWeightKg ? `${variant.maxWeightKg} kg` : '—'}
                                    </td>
                                    <td className="py-2.5 pr-4 text-black/60">
                                      {variant.warrantyFrameYrs ? `${variant.warrantyFrameYrs} yr` : '—'}
                                    </td>
                                    <td className="py-2.5 pr-4 text-black/60">
                                      {variant.meetsAuStd ? (variant.auStdDetail ?? 'Yes') : 'Not confirmed'}
                                    </td>
                                    <td className="py-2.5 pr-0">
                                      {variantShopUrl ? (
                                        <a
                                          href={variantShopUrl}
                                          target="_blank"
                                          rel="nofollow noopener noreferrer"
                                          className="whitespace-nowrap text-[#38b1ab] hover:underline"
                                        >
                                          View price →
                                        </a>
                                      ) : (
                                        <span className="text-black/25">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {review?.reviewSlug && (
                          <div className="mt-3 flex items-center gap-3">
                            <Link href={`/${review.reviewSlug}/`} className="text-xs text-[#38b1ab] hover:underline">
                              Read our in-depth review →
                            </Link>
                            {review.baScore && <span className="text-xs text-black/40">Our score: {review.baScore}/10</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-black/35">
        Prices sourced from manufacturer websites and may change. Model rows combine all sizes that match your filters. Click any row to expand size-specific specs.
      </p>

      {/* Quiz CTA */}
      <div className="mt-10 rounded-2xl bg-[#38b1ab]/8 border border-[#38b1ab]/20 p-7 text-center">
        <p className="font-semibold text-black mb-1">Not sure which trampoline fits your yard and budget?</p>
        <p className="text-sm text-black/60 mb-4">Our 2-minute quiz asks the right questions and recommends the best match for your family.</p>
        <Link href="/quiz/" className="inline-flex items-center gap-1 rounded-xl bg-[#38b1ab] hover:bg-[#2e9a94] text-white font-semibold px-6 py-2.5 text-sm transition-colors">
          Take the trampoline quiz →
        </Link>
      </div>
    </div>
  );
}
