'use client';

import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { TRAMPOLINES } from '@/data/trampolines';
import { isAffiliateRow, outboundRel } from '@/lib/affiliate';
import {
  BRAND_COLORS,
  FALLBACK_BRAND_COLOR,
  type GroupedTrampoline,
  compareSizeLabel,
  cmToFeet,
  formatRange,
  formatWarrantyRange,
  formatWarrantyYears,
  groupPriceRange,
  groupReview,
  groupRows,
  groupShopUrl,
  longestFootprintCm,
  overallSizeSummary,
  productUrl,
  sizeLabel,
  variantKey,
} from '@/lib/compareShared';

type SortKey = 'priceAud' | 'overallDiamCm' | 'maxWeightKg' | 'warrantyFrameYrs';
type SortDir = 'asc' | 'desc';

const ALL_BRANDS = [...new Set(TRAMPOLINES.map((t) => t.brand))];
const ALL_SHAPES = [...new Set(TRAMPOLINES.map((t) => t.shape))];
const MIN_PRICE = 0;
const PRICE_STEP = 100;
const MAX_PRICE = Math.ceil(Math.max(...TRAMPOLINES.map((t) => t.priceAud ?? 0)) / PRICE_STEP) * PRICE_STEP;
// Desired trampoline size filter: users usually think in ft, not total yard size.
const TRAMPOLINE_SIZE_MIN_FT = 4;
const TRAMPOLINE_SIZE_MAX_FT = 20;
const CLEARANCE_M = 1.5;

function Tip({ text }: { text: string }) {
  const [pos, setPos] = useState<{ x: number; y: number; placeBelow: boolean } | null>(null);
  const [isPinned, setIsPinned] = useState(false);

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

  function openTooltip(target: HTMLElement, pinned = false) {
    const r = target.getBoundingClientRect();
    setPos({
      x: r.left + r.width / 2,
      y: r.top,
      placeBelow: r.top < 80,
    });
    setIsPinned(pinned);
  }

  return (
    <span
      className="ml-1 cursor-help inline-block"
      onMouseEnter={(e) => {
        if (isPinned) return;
        openTooltip(e.currentTarget as HTMLElement);
      }}
      onMouseLeave={() => {
        if (!isPinned) setPos(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (isPinned && pos) {
          setPos(null);
          setIsPinned(false);
          return;
        }
        openTooltip(e.currentTarget as HTMLElement, true);
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        e.stopPropagation();
        if (isPinned && pos) {
          setPos(null);
          setIsPinned(false);
          return;
        }
        openTooltip(e.currentTarget as HTMLElement, true);
      }}
      role="button"
      tabIndex={0}
      aria-label={`More info: ${text}`}
      aria-expanded={Boolean(pos)}
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

function Cell({ val, unit }: { val: number | string | null | boolean; unit?: string }) {
  if (val === null || val === undefined || val === '') return <span className="text-black/25">—</span>;
  if (typeof val === 'boolean') {
    return val ? <span className="font-semibold text-emerald-600">✓</span> : <span className="text-black/30">✗</span>;
  }
  return <span>{val}{unit ? <span className="text-black/40 text-xs ml-0.5">{unit}</span> : null}</span>;
}

function formatTrampolineSize(valueFt: number): string {
  const valueM = valueFt * 0.3048;
  return `${valueFt} ft (${valueM.toFixed(1)} m)`;
}

function trampolineSizeFilterLabel(minFt: number, maxFt: number): string {
  if (minFt <= TRAMPOLINE_SIZE_MIN_FT && maxFt >= TRAMPOLINE_SIZE_MAX_FT) return 'Any';
  return `${formatTrampolineSize(minFt)}-${formatTrampolineSize(maxFt)}`;
}

function requiredYardSizeLabel(maxFt: number): string {
  if (maxFt >= TRAMPOLINE_SIZE_MAX_FT) return '';

  const trampolineM = maxFt * 0.3048;
  const yardM = trampolineM + CLEARANCE_M * 2;
  return `Largest selected size needs about ${yardM.toFixed(1)} m clear yard width including ${CLEARANCE_M} m clearance each side`;
}

function priceRangePercent(value: number): number {
  return ((value - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
}

function trampolineSizeRangePercent(value: number): number {
  return ((value - TRAMPOLINE_SIZE_MIN_FT) / (TRAMPOLINE_SIZE_MAX_FT - TRAMPOLINE_SIZE_MIN_FT)) * 100;
}

function sizeSummary(group: GroupedTrampoline) {
  if (group.variants.length === 1) return compareSizeLabel(group.variants[0]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {group.variants.map((variant) => (
        <span
          key={variantKey(group, variant)}
          className="whitespace-nowrap rounded-full border border-black/10 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-black/60"
        >
          {compareSizeLabel(variant)}
        </span>
      ))}
    </div>
  );
}

function priceSummary(group: GroupedTrampoline) {
  const range = groupPriceRange(group.variants);

  if (!range) {
    return <span className="text-black/25">—</span>;
  }

  const { low, high, hasFromPrice } = range;

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

const TABLE_HEAD_CELL_CLASS =
  'sticky top-0 z-20 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-black/50 uppercase tracking-wide whitespace-nowrap shadow-[0_1px_0_rgba(0,0,0,0.06)]';

function SortTh({
  label,
  sortKey,
  tip,
  active,
  sortDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  tip: string;
  active: boolean;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  return (
    <th scope="col" className={TABLE_HEAD_CELL_CLASS}>
      <span className="inline-flex items-center">
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          className="font-semibold uppercase tracking-wide transition-colors hover:text-black"
        >
          {label}
          <span className="ml-1 text-[10px]">
            {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
          </span>
        </button>
        <Tip text={tip} />
      </span>
    </th>
  );
}

export default function ModelsBrowseClient() {
  const [brands, setBrands] = useState<string[]>([]);
  const [shapes, setShapes] = useState<string[]>([]);
  const [springlessOnly, setSpringlessOnly] = useState(false);
  const [auStdOnly, setAuStdOnly] = useState(false);
  const [minPrice, setMinPrice] = useState(MIN_PRICE);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [minTrampolineSizeFt, setMinTrampolineSizeFt] = useState(TRAMPOLINE_SIZE_MIN_FT);
  const [maxTrampolineSizeFt, setMaxTrampolineSizeFt] = useState(TRAMPOLINE_SIZE_MAX_FT);
  const [sortKey, setSortKey] = useState<SortKey>('priceAud');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [useAffiliate, setUseAffiliate] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setUseAffiliate(localStorage.getItem('ba-compare-affiliate') === '1');
      } catch {}
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const rows = TRAMPOLINES.filter((t) => {
      if (brands.length && !brands.includes(t.brand)) return false;
      if (shapes.length && !shapes.includes(t.shape)) return false;
      if (springlessOnly && !t.springless) return false;
      if (auStdOnly && !t.meetsAuStd) return false;
      if (t.priceAud !== null && t.priceAud < minPrice) return false;
      if (t.priceAud !== null && t.priceAud > maxPrice) return false;
      // Trampoline size filter: use longest overall dimension, converted to feet.
      const footprint = longestFootprintCm(t);
      if (footprint !== null) {
        const footprintFt = cmToFeet(footprint);
        if (footprintFt < minTrampolineSizeFt || footprintFt > maxTrampolineSizeFt) return false;
      }
      return true;
    });
    rows.sort((a, b) => {
      const av = a[sortKey] ?? (sortDir === 'asc' ? Infinity : -Infinity);
      const bv = b[sortKey] ?? (sortDir === 'asc' ? Infinity : -Infinity);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return rows;
  }, [brands, shapes, springlessOnly, auStdOnly, minPrice, maxPrice, minTrampolineSizeFt, maxTrampolineSizeFt, sortKey, sortDir]);

  const grouped = useMemo(() => groupRows(filtered), [filtered]);

  const activeFilters: { label: string; clear: () => void }[] = [
    ...brands.map((b) => ({ label: b, clear: () => setBrands((p) => p.filter((x) => x !== b)) })),
    ...shapes.map((s) => ({ label: s, clear: () => setShapes((p) => p.filter((x) => x !== s)) })),
    ...(springlessOnly ? [{ label: 'Springless only', clear: () => setSpringlessOnly(false) }] : []),
    ...(auStdOnly ? [{ label: 'AU Standard', clear: () => setAuStdOnly(false) }] : []),
    ...(minPrice > MIN_PRICE || maxPrice < MAX_PRICE ? [{
      label: `$${minPrice.toLocaleString()}-$${maxPrice.toLocaleString()}`,
      clear: () => { setMinPrice(MIN_PRICE); setMaxPrice(MAX_PRICE); },
    }] : []),
    ...(minTrampolineSizeFt > TRAMPOLINE_SIZE_MIN_FT || maxTrampolineSizeFt < TRAMPOLINE_SIZE_MAX_FT ? [{
      label: `${minTrampolineSizeFt}-${maxTrampolineSizeFt} ft`,
      clear: () => { setMinTrampolineSizeFt(TRAMPOLINE_SIZE_MIN_FT); setMaxTrampolineSizeFt(TRAMPOLINE_SIZE_MAX_FT); },
    }] : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-10">
      {/* Filter panel */}
      <div className="mb-6 grid gap-6 rounded-2xl border border-black/[0.08] bg-gray-50/60 p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-4">
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

          <div className="space-y-4">
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
                  { label: 'Meets AU Standard', val: auStdOnly, set: setAuStdOnly },
                ].map(({ label, val, set }) => (
                  <button key={label} onClick={() => set(!val)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${val ? 'bg-[#38b1ab] border-[#38b1ab] text-white' : 'border-black/10 bg-white text-black/60 hover:border-[#38b1ab] hover:text-[#38b1ab]'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-full flex-col gap-5 lg:pt-0">
            {/* Price range sliders */}
            <div>
              <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-2">
                Price range:{' '}
                <span className="text-black">
                  ${minPrice.toLocaleString()}-${maxPrice.toLocaleString()}
                </span>
              </p>
              <div
                className="relative h-8"
                style={{
                  '--min-pct': `${priceRangePercent(minPrice)}%`,
                  '--max-pct': `${priceRangePercent(maxPrice)}%`,
                } as React.CSSProperties}
              >
                <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-black/10" />
                <div className="absolute left-[var(--min-pct)] right-[calc(100%-var(--max-pct))] top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#38b1ab]" />
                <input
                  aria-label="Minimum price"
                  type="range"
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  step={PRICE_STEP}
                  value={minPrice}
                  onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
                  className="pointer-events-none absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent accent-[#38b1ab] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                />
                <input
                  aria-label="Maximum price"
                  type="range"
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  step={PRICE_STEP}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
                  className="pointer-events-none absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent accent-[#38b1ab] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                />
                <div className="absolute -bottom-2 left-0 right-0 flex justify-between text-[10px] text-black/30">
                  <span>${MIN_PRICE.toLocaleString()}</span>
                  <span>${MAX_PRICE.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Trampoline size slider */}
            <div>
              <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-1">
                Trampoline size:{' '}
                <span className="text-black">{trampolineSizeFilterLabel(minTrampolineSizeFt, maxTrampolineSizeFt)}</span>
              </p>
              {maxTrampolineSizeFt < TRAMPOLINE_SIZE_MAX_FT && (
                <p className="mb-2 min-h-[1rem] text-[11px] text-black/35">
                  {requiredYardSizeLabel(maxTrampolineSizeFt)}
                </p>
              )}
              <div
                className="relative h-8"
                style={{
                  '--min-size-pct': `${trampolineSizeRangePercent(minTrampolineSizeFt)}%`,
                  '--max-size-pct': `${trampolineSizeRangePercent(maxTrampolineSizeFt)}%`,
                } as React.CSSProperties}
              >
                <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-black/10" />
                <div className="absolute left-[var(--min-size-pct)] right-[calc(100%-var(--max-size-pct))] top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#38b1ab]" />
                <input
                  aria-label="Minimum trampoline size"
                  type="range"
                  min={TRAMPOLINE_SIZE_MIN_FT}
                  max={TRAMPOLINE_SIZE_MAX_FT}
                  step={1}
                  value={minTrampolineSizeFt}
                  onChange={(e) => setMinTrampolineSizeFt(Math.min(Number(e.target.value), maxTrampolineSizeFt))}
                  className="pointer-events-none absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent accent-[#38b1ab] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                />
                <input
                  aria-label="Maximum trampoline size"
                  type="range"
                  min={TRAMPOLINE_SIZE_MIN_FT}
                  max={TRAMPOLINE_SIZE_MAX_FT}
                  step={1}
                  value={maxTrampolineSizeFt}
                  onChange={(e) => setMaxTrampolineSizeFt(Math.max(Number(e.target.value), minTrampolineSizeFt))}
                  className="pointer-events-none absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent accent-[#38b1ab] [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                />
                <div className="absolute -bottom-2 left-0 right-0 flex justify-between text-[10px] text-black/30">
                  <span>{TRAMPOLINE_SIZE_MIN_FT} ft</span>
                  <span>Any</span>
                </div>
              </div>
              <p className="pt-2 text-[10px] text-black/30">Uses the model&apos;s longest overall dimension.</p>
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
          <button onClick={() => { setBrands([]); setShapes([]); setSpringlessOnly(false); setAuStdOnly(false); setMinPrice(MIN_PRICE); setMaxPrice(MAX_PRICE); setMinTrampolineSizeFt(TRAMPOLINE_SIZE_MIN_FT); setMaxTrampolineSizeFt(TRAMPOLINE_SIZE_MAX_FT); }}
            className="text-xs text-black/40 hover:text-black underline">Clear all</button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-black/[0.08] shadow-sm">
        <table className="w-full min-w-[860px] text-sm">
          <caption className="sr-only">Australian trampoline model comparison</caption>
          <thead className="border-b border-black/[0.06]">
            <tr>
              <th scope="col" className={`${TABLE_HEAD_CELL_CLASS} left-0 z-30`}>Model</th>
              <th scope="col" className={`${TABLE_HEAD_CELL_CLASS} hidden min-w-[140px] sm:table-cell`}>Size</th>
              <th scope="col" className={TABLE_HEAD_CELL_CLASS}>Spring type</th>
              <SortTh label="Price" sortKey="priceAud" tip="AUD price. 'from' prices show the model's lowest available size." active={sortKey === 'priceAud'} sortDir={sortDir} onSort={toggleSort} />
              <SortTh label="Max weight" sortKey="maxWeightKg" tip="Maximum single-user weight rating in kg." active={sortKey === 'maxWeightKg'} sortDir={sortDir} onSort={toggleSort} />
              <SortTh label="Overall size" sortKey="overallDiamCm" tip="Overall footprint — diameter for round, longest dimension for other shapes. Manufacturers generally recommend 1–2 m clearance on all sides." active={sortKey === 'overallDiamCm'} sortDir={sortDir} onSort={toggleSort} />
              <SortTh label="Frame warranty" sortKey="warrantyFrameYrs" tip="Manufacturer's frame warranty in years." active={sortKey === 'warrantyFrameYrs'} sortDir={sortDir} onSort={toggleSort} />
              <th scope="col" className={TABLE_HEAD_CELL_CLASS}>
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
              const brandColor = BRAND_COLORS[group.brand] ?? FALLBACK_BRAND_COLOR;
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
                    <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3 text-left font-medium text-black">
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
                    </th>
                    {/* Size */}
                    <td className="hidden min-w-[140px] px-4 py-3 text-black/60 sm:table-cell">{sizeSummary(group)}</td>
                    {/* Spring */}
                    <td className="px-4 py-3 text-xs text-black/40">{group.variants[0].springSystem ?? '—'}</td>
                    {/* Price + shop link */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="font-semibold text-black">{priceSummary(group)}</div>
                      {shopUrl && (
                        <a href={shopUrl} target="_blank" rel={outboundRel(useAffiliate && group.variants.some(isAffiliateRow))}
                          className="text-[11px] text-[#38b1ab] hover:underline whitespace-nowrap">
                          View best price →
                        </a>
                      )}
                    </td>
                    {/* Max weight */}
                    <td className="px-4 py-3">
                      <Cell val={formatRange(group.variants.map((variant) => variant.maxWeightKg), 'kg')} />
                    </td>
                    {/* Overall size */}
                    <td className="px-4 py-3 text-black/60">{overallSizeSummary(group)}</td>
                    {/* Frame warranty */}
                    <td className="px-4 py-3">
                      <Cell val={formatWarrantyRange(group.variants.map((variant) => variant.warrantyFrameYrs), 'short')} />
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
                            <caption className="sr-only">Size details for {group.brand} {group.model}</caption>
                            <thead>
                              <tr className="border-b border-black/8 text-left text-[11px] uppercase tracking-wide text-black/40">
                                <th scope="col" className="min-w-[100px] whitespace-nowrap py-2 pr-4">Size</th>
                                <th scope="col" className="py-2 pr-4">Price</th>
                                <th scope="col" className="py-2 pr-4">Overall</th>
                                <th scope="col" className="py-2 pr-4">Weight</th>
                                <th scope="col" className="py-2 pr-4">Frame warranty</th>
                                <th scope="col" className="py-2 pr-4">AU Std</th>
                                <th scope="col" className="py-2 pr-0">Link</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/[0.05]">
                              {group.variants.map((variant) => {
                                const variantShopUrl = productUrl(variant, useAffiliate);

                                return (
                                  <tr key={variantKey(group, variant)}>
                                    <th scope="row" className="min-w-[100px] whitespace-nowrap py-2.5 pr-4 text-left font-medium text-black/70">{compareSizeLabel(variant)}</th>
                                    <td className="py-2.5 pr-4 text-black/70">
                                      {variant.priceAud ? `$${variant.priceAud.toLocaleString()}` : '—'}
                                    </td>
                                    <td className="py-2.5 pr-4 text-black/60">{sizeLabel(variant)}</td>
                                    <td className="py-2.5 pr-4 text-black/60">
                                      {variant.maxWeightKg ? `${variant.maxWeightKg} kg` : '—'}
                                    </td>
                                    <td className="py-2.5 pr-4 text-black/60">
                                      {formatWarrantyYears(variant.warrantyFrameYrs, 'short')}
                                    </td>
                                    <td className="py-2.5 pr-4 text-black/60">
                                      {variant.meetsAuStd ? (variant.auStdDetail ?? 'Yes') : 'Not confirmed'}
                                    </td>
                                    <td className="py-2.5 pr-0">
                                      {variantShopUrl ? (
                                        <a
                                          href={variantShopUrl}
                                          target="_blank"
                                          rel={outboundRel(useAffiliate && isAffiliateRow(variant))}
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
