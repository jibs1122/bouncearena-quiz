import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Trampoline } from '@/data/trampolines';
import {
  australianStandardLabel,
  compareSizeLabel,
  formatWarrantyRange,
  groupRows,
  longestFootprintCm,
  meetsAs4989,
  PRICE_FOOTNOTE,
  sizeLabel,
  type GroupedTrampoline,
} from '@/lib/compareShared';

/**
 * Spec table rendered from data/trampolines.ts at build time. Comparison pages never
 * hand-write these numbers, so the table stays in step with the data sheet.
 */

type SpecRow = {
  label: string;
  getValue: (group: GroupedTrampoline) => ReactNode;
};

const DASH = '—';

function hasMeaningfulValue(value: ReactNode): boolean {
  return !(typeof value === 'string' && (value.trim() === '' || value.trim() === DASH));
}

function nodeKey(value: ReactNode): string {
  if (value === null || value === undefined) return '\0null';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

function kgRange(values: Array<number | null>): string {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return DASH;

  const low = Math.min(...present);
  const high = Math.max(...present);
  return low === high ? `${low} kg` : `${low}-${high} kg`;
}

function countRange(values: Array<number | null>): string {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return DASH;

  const low = Math.min(...present);
  const high = Math.max(...present);
  return low === high ? `${low}` : `${low}-${high}`;
}

function priceValue(group: GroupedTrampoline): ReactNode {
  const prices = group.variants
    .map((variant) => variant.priceAud)
    .filter((price): price is number => price !== null);

  if (prices.length === 0) return DASH;

  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const fromOnly = group.variants.some((variant) =>
    variant.priceBasis.toLowerCase().includes('from'),
  );

  return (
    <>
      ${low.toLocaleString('en-AU')}
      {(low !== high || fromOnly) && (
        <span className="ml-1 text-[10px] font-normal text-black/35">
          {low !== high ? `to $${high.toLocaleString('en-AU')}` : 'from'}
        </span>
      )}
    </>
  );
}

function footprintValue(group: GroupedTrampoline): string {
  const labels = [...new Set(group.variants.map(sizeLabel))];
  if (labels.length === 0) return DASH;
  if (labels.length === 1) return labels[0];
  return `${labels[0]} to ${labels[labels.length - 1]}`;
}

function sizesValue(group: GroupedTrampoline): string {
  const labels = [...new Set(group.variants.map(compareSizeLabel))];
  return labels.length > 0 ? labels.join(', ') : DASH;
}

function matValue(group: GroupedTrampoline): string {
  const labels = [
    ...new Set(
      group.variants
        .map((variant) => {
          if (variant.matDiamCm) return `${variant.matDiamCm} cm across`;
          if (variant.matLenCm && variant.matWidCm) return `${variant.matLenCm}×${variant.matWidCm} cm`;
          return null;
        })
        .filter((label): label is string => label !== null),
    ),
  ];

  if (labels.length === 0) return DASH;
  if (labels.length === 1) return labels[0];
  return `${labels[0]} to ${labels[labels.length - 1]}`;
}

function heightValue(group: GroupedTrampoline): string {
  const heights = group.variants
    .map((variant) => variant.totalHeightCm)
    .filter((height): height is number => height !== null);

  if (heights.length === 0) return DASH;

  const low = Math.min(...heights);
  const high = Math.max(...heights);
  return low === high ? `${low} cm` : `${low}-${high} cm`;
}

function standardValue(group: GroupedTrampoline): string {
  const certified = group.variants.filter(meetsAs4989);

  if (certified.length === 0) {
    const otherStandard = group.variants.find((variant) => variant.auStdDetail);
    return otherStandard ? australianStandardLabel(otherStandard) : 'Not confirmed';
  }

  const label = australianStandardLabel(certified[0]);

  if (certified.length === group.variants.length) return label;
  return `${label} (${certified.length} of ${group.variants.length} sizes)`;
}

function springlessValue(group: GroupedTrampoline): string {
  const springless = group.variants.filter((variant) => variant.springless).length;
  if (springless === 0) return 'No';
  if (springless === group.variants.length) return 'Yes';
  return 'Varies by model';
}

const SPEC_ROWS: SpecRow[] = [
  { label: 'Sizes compared', getValue: sizesValue },
  { label: 'Shape', getValue: (g) => [...new Set(g.variants.map((v) => v.shape))].join(', ') || DASH },
  {
    label: 'Spring system',
    getValue: (g) =>
      [...new Set(g.variants.map((v) => v.springSystem).filter(Boolean))].join(', ') || DASH,
  },
  { label: 'Springless', getValue: springlessValue },
  { label: 'Price (AUD)', getValue: priceValue },
  { label: 'Overall footprint', getValue: footprintValue },
  { label: 'Jumping mat', getValue: matValue },
  { label: 'Total height', getValue: heightValue },
  { label: 'Max single jumper', getValue: (g) => kgRange(g.variants.map((v) => v.maxWeightKg)) },
  { label: 'Combined weight limit', getValue: (g) => kgRange(g.variants.map((v) => v.combinedWeightKg)) },
  { label: 'Spring count', getValue: (g) => countRange(g.variants.map((v) => v.springCount)) },
  { label: 'Frame warranty', getValue: (g) => formatWarrantyRange(g.variants.map((v) => v.warrantyFrameYrs)) },
  { label: 'Mat warranty', getValue: (g) => formatWarrantyRange(g.variants.map((v) => v.warrantyMatYrs)) },
  { label: 'Net warranty', getValue: (g) => formatWarrantyRange(g.variants.map((v) => v.warrantyNetYrs)) },
  { label: 'Australian standard', getValue: standardValue },
];

function groupFootprint(group: GroupedTrampoline): number {
  return Math.max(...group.variants.map((variant) => longestFootprintCm(variant) ?? 0));
}

/**
 * Keeps the table readable when a side has many models (Springfree brand
 * pages resolve to ten rows). Families are already collapsed by groupRows; this
 * caps how many columns one side contributes.
 */
const MAX_COLUMNS_PER_SIDE = 5;

function limitGroups(groups: GroupedTrampoline[]): { shown: GroupedTrampoline[]; hidden: number } {
  if (groups.length <= MAX_COLUMNS_PER_SIDE) return { shown: groups, hidden: 0 };

  const sorted = [...groups].sort((a, b) => groupFootprint(a) - groupFootprint(b));
  return { shown: sorted.slice(0, MAX_COLUMNS_PER_SIDE), hidden: groups.length - MAX_COLUMNS_PER_SIDE };
}

export default function ComparisonTable({
  sideA,
  sideB,
}: {
  sideA: { label: string; rows: Trampoline[] };
  sideB: { label: string; rows: Trampoline[] };
}) {
  const a = limitGroups(groupRows(sideA.rows));
  const b = limitGroups(groupRows(sideB.rows));
  const groups = [...a.shown, ...b.shown];

  if (groups.length === 0) return null;

  const annotated = SPEC_ROWS.map((row) => {
    const values = groups.map((group) => row.getValue(group));
    return {
      row,
      values,
      hasData: values.some(hasMeaningfulValue),
      allSame: new Set(values.map(nodeKey)).size === 1,
    };
  });

  const collapsible = groups.length > 1;
  const diffRows = collapsible
    ? annotated.filter(({ hasData, allSame }) => hasData && !allSame)
    : annotated.filter(({ hasData }) => hasData);
  const sharedRows = collapsible ? annotated.filter(({ hasData, allSame }) => hasData && allSame) : [];

  if (diffRows.length === 0 && sharedRows.length === 0) return null;

  const hiddenTotal = a.hidden + b.hidden;

  return (
    <div className="not-prose mx-auto w-fit max-w-full space-y-3">
      <div className="max-w-full overflow-x-auto rounded-2xl border border-black/[0.08] shadow-sm">
        <table className="min-w-max border-separate border-spacing-0 text-sm">
          <caption className="sr-only">
            Trampoline specification comparison for {sideA.label} and {sideB.label}
          </caption>
          <thead>
            <tr className="bg-[#38b1ab] text-white">
              <th scope="col" className="sticky left-0 z-30 w-[170px] min-w-[170px] border-r border-[#2e9a94] bg-[#38b1ab] px-4 py-3 text-left font-semibold">
                Specification
              </th>
              {groups.map((group) => (
                <th
                  key={group.key}
                  scope="col"
                  className="w-[165px] min-w-[165px] px-3 py-3 text-left align-top font-semibold"
                >
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/70">
                    {group.brand}
                  </span>
                  <span className="block whitespace-normal break-words text-[13px] leading-snug text-white">
                    {group.model}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {diffRows.map(({ row, values }, i) => (
              <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f7f8f8]'}>
                <th
                  scope="row"
                  className={`sticky left-0 z-20 w-[170px] min-w-[170px] border-r border-black/[0.08] px-4 py-2.5 font-medium text-black/50 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-[#f7f8f8]'
                  }`}
                >
                  {row.label}
                </th>
                {values.map((value, j) => (
                  <td
                    key={groups[j].key}
                    className="w-[165px] min-w-[165px] border-b border-black/[0.05] px-3 py-2.5 text-black/80"
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sharedRows.length > 0 && (
        <div className="rounded-2xl border border-black/[0.08] bg-[#f7f8f8] px-4 py-4">
          <p className="mb-3 text-sm font-medium text-black/50">Shared across these models</p>
          <dl className={`grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 ${groups.length > 3 ? 'lg:grid-cols-4' : ''}`}>
            {sharedRows.map(({ row, values }) => (
              <div key={row.label}>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-black/40">
                  {row.label}
                </dt>
                <dd className="mt-0.5 text-sm text-black/80">{values[0]}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {hiddenTotal > 0 && (
        <p className="text-xs text-black/40">
          Showing the {groups.length} closest models.{' '}
          <Link href="/models/" className="text-[#38b1ab] hover:underline">
            See all {hiddenTotal} other sizes in the full comparison table →
          </Link>
        </p>
      )}

      <p className="text-xs text-black/35">{PRICE_FOOTNOTE}</p>
    </div>
  );
}
