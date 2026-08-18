import type { Trampoline } from '@/data/trampolines';
import { formatFeet, longestFootprintCm } from '@/lib/compareShared';

/**
 * Deterministic "key differences" generator. Every sentence is derived from
 * data/trampolines.ts — nothing here is authored or inferred, so the takeaways
 * stay correct after each `npm run refresh:compare-data`.
 *
 * Each comparator returns null unless the difference is material, so pages only
 * claim a difference matters when the gap is big enough to change a decision.
 */

type SpringSystemKind = 'coil' | 'leaf' | 'springless' | 'other';
type NumberRange = { min: number | null; max: number | null; distinctCount: number };

export type TakeawaySide = {
  name: string;
  rows: Trampoline[];
};

type SideSummary = {
  name: string;
  rows: Trampoline[];
  prices: number[];
  springSystems: Set<SpringSystemKind>;
  shapes: Set<string>;
  maxFootprintCm: number | null;
  maxFootprintShape: string | null;
  maxFootprintSecondDimCm: number | null;
  maxWeightKg: number | null;
  maxCombinedWeightKg: number | null;
  frameWarrantyYrs: number | null;
  matWarrantyYrs: number | null;
  netWarrantyYrs: number | null;
  warrantyRanges: {
    frameWarrantyYrs: NumberRange;
    matWarrantyYrs: NumberRange;
    netWarrantyYrs: NumberRange;
  };
};

// Materiality thresholds, in AU dollars, years, kilograms and centimetres.
const PRICE_GAP_AUD = 200;
const PRICE_GAP_RATIO = 1.25;
const TOP_END_PRICE_GAP_AUD = 700;
const TOP_END_PRICE_RATIO = 1.5;
const WARRANTY_GAP_YEARS = 2;
const WARRANTY_GAP_RATIO = 1.5;
const WEIGHT_GAP_KG = 35;
const WEIGHT_GAP_RATIO = 1.25;
const COMBINED_WEIGHT_GAP_KG = 70;
const SIZE_GAP_CM = 60;
// A trampoline of at least this footprint counts as full-size for price/weight
// comparisons, so a brand's toddler model never sets its headline numbers.
const FULL_SIZE_CM = 300;

function formatAud(value: number): string {
  return `$${value.toLocaleString('en-AU')}`;
}

function formatYears(years: number): string {
  return `${years} year${years === 1 ? '' : 's'}`;
}

function maxNumber(values: Array<number | null>): number | null {
  const usable = values.filter((value): value is number => value !== null);
  return usable.length > 0 ? Math.max(...usable) : null;
}

function numberRange(values: Array<number | null>): NumberRange {
  const usable = values.filter((value): value is number => value !== null);
  if (usable.length === 0) return { min: null, max: null, distinctCount: 0 };
  return {
    min: Math.min(...usable),
    max: Math.max(...usable),
    distinctCount: new Set(usable).size,
  };
}

function classifySpringSystem(system: string | null): SpringSystemKind | null {
  const normalized = system?.trim().toLowerCase() ?? '';
  if (!normalized) return null;
  if (normalized.includes('leaf')) return 'leaf';
  if (
    normalized.includes('springless') ||
    normalized.includes('rod') ||
    normalized.includes('bungee') ||
    normalized.includes('elastic')
  ) {
    return 'springless';
  }
  if (normalized.includes('spring') || normalized.includes('coil') || normalized.includes('wire')) {
    return 'coil';
  }
  return 'other';
}

function normalizeShape(shape: string): string | null {
  const normalized = shape.trim().toLowerCase();
  if (!normalized || normalized === 'custom') return null;
  if (normalized === 'rectangular') return 'rectangle';
  return normalized;
}

type FootprintDetails = { maxCm: number; shape: string; secondDimCm: number | null };

function footprintDetails(row: Trampoline): FootprintDetails | null {
  const max = longestFootprintCm(row);
  if (max === null) return null;

  const shape = normalizeShape(row.shape) ?? 'round';
  let secondDimCm: number | null = null;

  if (shape === 'rectangle' || shape === 'oval') {
    const dims = [row.overallLenCm, row.overallWidCm].filter((d): d is number => d !== null);
    if (dims.length === 2) secondDimCm = Math.min(...dims);
  }

  return { maxCm: max, shape, secondDimCm };
}

function isFullSize(row: Trampoline): boolean {
  const footprint = longestFootprintCm(row);
  return footprint !== null && footprint >= FULL_SIZE_CM;
}

function summarizeSide(side: TakeawaySide): SideSummary {
  const { rows } = side;

  const frameRange = numberRange(rows.map((row) => row.warrantyFrameYrs));
  const matRange = numberRange(rows.map((row) => row.warrantyMatYrs));
  const netRange = numberRange(rows.map((row) => row.warrantyNetYrs));

  const largest = rows
    .map(footprintDetails)
    .filter((d): d is FootprintDetails => d !== null)
    .reduce<FootprintDetails | null>(
      (best, curr) => (best === null || curr.maxCm > best.maxCm ? curr : best),
      null,
    );

  return {
    name: side.name,
    rows,
    prices: rows.map((row) => row.priceAud).filter((price): price is number => price !== null),
    springSystems: new Set(
      rows
        .map((row) => classifySpringSystem(row.springSystem))
        .filter((system): system is SpringSystemKind => system !== null),
    ),
    shapes: new Set(
      rows.map((row) => normalizeShape(row.shape)).filter((shape): shape is string => shape !== null),
    ),
    maxFootprintCm: largest?.maxCm ?? null,
    maxFootprintShape: largest?.shape ?? null,
    maxFootprintSecondDimCm: largest?.secondDimCm ?? null,
    maxWeightKg: maxNumber(rows.filter(isFullSize).map((row) => row.maxWeightKg)),
    maxCombinedWeightKg: maxNumber(rows.map((row) => row.combinedWeightKg)),
    frameWarrantyYrs: frameRange.max,
    matWarrantyYrs: matRange.max,
    netWarrantyYrs: netRange.max,
    warrantyRanges: {
      frameWarrantyYrs: frameRange,
      matWarrantyYrs: matRange,
      netWarrantyYrs: netRange,
    },
  };
}

function setsDiffer<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return true;
  return [...a].some((value) => !b.has(value));
}

function describeSpringSystems(summary: SideSummary): string {
  const hasCoil = summary.springSystems.has('coil');
  const hasLeaf = summary.springSystems.has('leaf');
  const hasSpringless = summary.springSystems.has('springless');

  const usesRods = summary.rows.some((row) => row.springSystem?.toLowerCase().includes('rod'));
  const usesStraps = summary.rows.some((row) => row.springSystem?.toLowerCase().includes('elastic'));

  if (hasSpringless && !hasCoil && !hasLeaf) {
    if (usesRods) return `${summary.name} uses flexible fibreglass rods instead of springs`;
    if (usesStraps) return `${summary.name} uses elastic straps instead of springs`;
    return `${summary.name} uses a springless design`;
  }
  if (hasCoil && hasLeaf && hasSpringless) {
    return `${summary.name} offers coil, leaf-spring and springless models`;
  }
  if (hasCoil && hasLeaf) return `${summary.name} offers both coil and leaf-spring models`;
  if (hasCoil && hasSpringless) return `${summary.name} offers both coil-spring and springless models`;
  if (hasLeaf && hasSpringless) return `${summary.name} offers both leaf-spring and springless models`;
  if (hasLeaf) return `${summary.name} uses leaf springs`;
  if (hasCoil) return `${summary.name} uses coil springs`;
  return `${summary.name} uses a different spring system`;
}

function buildSpringSystemTakeaway(a: SideSummary, b: SideSummary): string | null {
  if (a.springSystems.size === 0 || b.springSystems.size === 0) return null;
  if (!setsDiffer(a.springSystems, b.springSystems)) return null;
  return `${describeSpringSystems(a)}; ${describeSpringSystems(b)}.`;
}

type PricePick = { row: Trampoline; price: number };

function shortModelName(row: Trampoline): string {
  const pattern = new RegExp(`^${row.brand}\\s+`, 'i');
  return row.model.replace(pattern, '').trim();
}

/** True when a side is already named after the model, e.g. the side "Jumpflex MEGA". */
function sideNamesModel(sideName: string, row: Trampoline): boolean {
  return sideName.toLowerCase().includes(shortModelName(row).toLowerCase());
}

/** "Vuly" -> "Vuly's", but "Oz Trampolines" -> "Oz Trampolines'". */
function possessive(name: string): string {
  return name.endsWith('s') ? `${name}'` : `${name}'s`;
}

function cheapestFullSize(summary: SideSummary): PricePick | null {
  return (
    summary.rows
      .filter(isFullSize)
      .map((row) => (row.priceAud === null ? null : { row, price: row.priceAud }))
      .filter((pick): pick is PricePick => pick !== null)
      .sort((x, y) => x.price - y.price)[0] ?? null
  );
}

function buildPriceTakeaway(a: SideSummary, b: SideSummary): string | null {
  const aEntry = cheapestFullSize(a);
  const bEntry = cheapestFullSize(b);

  if (aEntry && bEntry) {
    const lower = aEntry.price <= bEntry.price ? a : b;
    const higher = lower === a ? b : a;
    const lowerEntry = lower === a ? aEntry : bEntry;
    const higherEntry = higher === a ? aEntry : bEntry;
    const gap = higherEntry.price - lowerEntry.price;

    if (gap >= PRICE_GAP_AUD || higherEntry.price / Math.max(lowerEntry.price, 1) >= PRICE_GAP_RATIO) {
      // On model pages both sides are already named, so quote bare prices rather
      // than repeating the labels.
      if (sideNamesModel(lower.name, lowerEntry.row) && sideNamesModel(higher.name, higherEntry.row)) {
        return `${lower.name} starts lower on comparable full-size models — ${formatAud(lowerEntry.price)} against ${formatAud(higherEntry.price)}.`;
      }

      return `On comparable full-size models, ${lower.name} starts lower — ${shortModelName(lowerEntry.row)} at ${formatAud(lowerEntry.price)} against ${possessive(higher.name)} ${shortModelName(higherEntry.row)} at ${formatAud(higherEntry.price)}.`;
    }
  }

  if (a.prices.length === 0 || b.prices.length === 0) return null;

  const aMax = Math.max(...a.prices);
  const bMax = Math.max(...b.prices);
  const topEndGap = Math.abs(aMax - bMax);

  if (
    topEndGap >= TOP_END_PRICE_GAP_AUD ||
    Math.max(aMax, bMax) / Math.max(Math.min(aMax, bMax), 1) >= TOP_END_PRICE_RATIO
  ) {
    const higherTop = aMax > bMax ? a : b;
    return `${higherTop.name} reaches a higher top-end price (${formatAud(Math.max(aMax, bMax))} against ${formatAud(Math.min(aMax, bMax))}); compare exact models if budget is a factor.`;
  }

  return null;
}

function buildWarrantyTakeaway(a: SideSummary, b: SideSummary): string | null {
  if (a.frameWarrantyYrs === null || b.frameWarrantyYrs === null) {
    // One side publishes no frame warranty in our data. Say so rather than guessing.
    const known = a.frameWarrantyYrs !== null ? a : b.frameWarrantyYrs !== null ? b : null;
    if (!known) return null;
    const unknown = known === a ? b : a;
    return `${known.name} publishes a frame warranty of up to ${formatYears(known.frameWarrantyYrs!)}; ${unknown.name} does not publish frame warranty terms.`;
  }

  if (a.frameWarrantyYrs === b.frameWarrantyYrs) return null;

  const better = a.frameWarrantyYrs > b.frameWarrantyYrs ? a : b;
  const other = better === a ? b : a;
  const betterYears = better.frameWarrantyYrs!;
  const otherYears = other.frameWarrantyYrs!;

  const material =
    betterYears - otherYears >= WARRANTY_GAP_YEARS ||
    betterYears / Math.max(otherYears, 1) >= WARRANTY_GAP_RATIO;
  if (!material) return null;

  if (
    a.warrantyRanges.frameWarrantyYrs.distinctCount > 1 ||
    b.warrantyRanges.frameWarrantyYrs.distinctCount > 1
  ) {
    return `${possessive(better.name)} frame warranty reaches ${formatYears(betterYears)} against ${formatYears(otherYears)}; compare exact models because terms vary by line.`;
  }

  return `${better.name} carries the stronger frame warranty — ${formatYears(betterYears)} against ${formatYears(otherYears)}.`;
}

function buildComponentWarrantyTakeaway(a: SideSummary, b: SideSummary): string | null {
  const components: Array<[keyof Pick<SideSummary, 'matWarrantyYrs' | 'netWarrantyYrs'>, string]> = [
    ['matWarrantyYrs', 'mat'],
    ['netWarrantyYrs', 'net'],
  ];

  const aWins: string[] = [];
  const bWins: string[] = [];

  for (const [key, label] of components) {
    const aYears = a[key];
    const bYears = b[key];
    if (aYears === null || bYears === null || aYears === bYears) continue;
    if (a.warrantyRanges[key].distinctCount > 1 || b.warrantyRanges[key].distinctCount > 1) continue;
    if (aYears > bYears) aWins.push(label);
    else bWins.push(label);
  }

  if (aWins.length === 0 && bWins.length === 0) return null;
  if (aWins.length > 0 && bWins.length > 0) return null;

  const better = aWins.length > 0 ? a : b;
  const winList = aWins.length > 0 ? aWins : bWins;
  const componentStr = winList.length === 1 ? winList[0] : winList.join(' and ');

  return `${better.name} has a longer warranty on the ${componentStr}.`;
}

function pickWeightRow(summary: SideSummary): { row: Trampoline; weight: number } | null {
  const weighted = summary.rows
    .filter(isFullSize)
    .map((row) => (row.maxWeightKg === null ? null : { row, weight: row.maxWeightKg }))
    .filter((pick): pick is { row: Trampoline; weight: number } => pick !== null);

  return [...weighted].sort((x, y) => y.weight - x.weight)[0] ?? null;
}

function buildWeightTakeaway(a: SideSummary, b: SideSummary): string | null {
  const aPick = pickWeightRow(a);
  const bPick = pickWeightRow(b);

  if (aPick && bPick && aPick.weight !== bPick.weight) {
    const higher = aPick.weight > bPick.weight ? a : b;
    const lower = higher === a ? b : a;
    const higherPick = higher === a ? aPick : bPick;
    const lowerPick = lower === a ? aPick : bPick;

    if (
      higherPick.weight - lowerPick.weight >= WEIGHT_GAP_KG ||
      higherPick.weight / Math.max(lowerPick.weight, 1) >= WEIGHT_GAP_RATIO
    ) {
      const higherSubject = sideNamesModel(higher.name, higherPick.row)
        ? 'is rated'
        : `rates its ${shortModelName(higherPick.row)}`;
      const lowerObject = sideNamesModel(lower.name, lowerPick.row)
        ? ''
        : ` on the ${shortModelName(lowerPick.row)}`;

      return `${higher.name} ${higherSubject} to ${higherPick.weight} kg per jumper; ${lower.name} lists ${lowerPick.weight} kg${lowerObject}.`;
    }
  }

  if (a.maxCombinedWeightKg === null || b.maxCombinedWeightKg === null) return null;
  if (a.maxCombinedWeightKg === b.maxCombinedWeightKg) return null;

  const higher = a.maxCombinedWeightKg > b.maxCombinedWeightKg ? a : b;
  const lower = higher === a ? b : a;
  const higherWeight = higher.maxCombinedWeightKg!;
  const lowerWeight = lower.maxCombinedWeightKg!;

  if (higherWeight - lowerWeight < COMBINED_WEIGHT_GAP_KG) return null;
  return `${higher.name} lists a higher combined weight capacity: ${higherWeight} kg against ${lowerWeight} kg.`;
}

function formatShapeList(shapes: Set<string>): string {
  const labels = [...shapes].sort().map((shape) => (shape === 'rectangle' ? 'rectangular' : shape));
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

function buildShapeTakeaway(a: SideSummary, b: SideSummary): string | null {
  if (a.shapes.size === 0 || b.shapes.size === 0) return null;
  if (!setsDiffer(a.shapes, b.shapes)) return null;

  const shared = new Set([...a.shapes].filter((s) => b.shapes.has(s)));
  const onlyA = new Set([...a.shapes].filter((s) => !b.shapes.has(s)));
  const onlyB = new Set([...b.shapes].filter((s) => !a.shapes.has(s)));

  if (onlyA.size > 0 && onlyB.size === 0 && shared.size > 0) {
    return `Both cover ${formatShapeList(shared)} options; ${a.name} also comes in ${formatShapeList(onlyA)}.`;
  }
  if (onlyB.size > 0 && onlyA.size === 0 && shared.size > 0) {
    return `Both cover ${formatShapeList(shared)} options; ${b.name} also comes in ${formatShapeList(onlyB)}.`;
  }

  return `${a.name} comes in ${formatShapeList(a.shapes)}; ${b.name} covers ${formatShapeList(b.shapes)}.`;
}

function describeLargestModel(summary: SideSummary): string {
  const max = summary.maxFootprintCm!;
  const second = summary.maxFootprintSecondDimCm;

  if (summary.maxFootprintShape === 'rectangle' && second !== null) {
    return `${formatFeet(second)} × ${formatFeet(max)} rectangle`;
  }
  if (summary.maxFootprintShape === 'oval' && second !== null) {
    return `${formatFeet(second)} × ${formatFeet(max)} oval`;
  }
  if (summary.maxFootprintShape === 'square') return `${formatFeet(max)} square`;
  if (summary.maxFootprintShape === 'oval') return `${formatFeet(max)} oval`;
  return formatFeet(max);
}

function buildSizeTakeaway(a: SideSummary, b: SideSummary): string | null {
  if (a.maxFootprintCm === null || b.maxFootprintCm === null) return null;
  if (a.maxFootprintCm === b.maxFootprintCm) return null;

  const larger = a.maxFootprintCm > b.maxFootprintCm ? a : b;
  const smaller = larger === a ? b : a;

  if (larger.maxFootprintCm! - smaller.maxFootprintCm! < SIZE_GAP_CM) return null;
  return `If yard space allows, ${larger.name} goes up to a ${describeLargestModel(larger)}; ${smaller.name} tops out at a ${describeLargestModel(smaller)}.`;
}

/**
 * Australian-standard compliance is deliberately never auto-claimed. Certification
 * is the highest-stakes claim on the page and the data records it per row, so it
 * belongs in the spec table where readers see exactly which model it applies to.
 */
function buildStandardsTakeaway(): string | null {
  return null;
}

export function buildCompareTakeaways(sideA: TakeawaySide, sideB: TakeawaySide): string[] {
  const a = summarizeSide(sideA);
  const b = summarizeSide(sideB);

  const priceTakeaway = buildPriceTakeaway(a, b);
  const nonPriceTakeaways = [
    buildSpringSystemTakeaway(a, b),
    buildWarrantyTakeaway(a, b),
    buildWeightTakeaway(a, b),
    buildShapeTakeaway(a, b),
    buildSizeTakeaway(a, b),
    buildComponentWarrantyTakeaway(a, b),
    buildStandardsTakeaway(),
  ].filter((takeaway): takeaway is string => takeaway !== null);

  const takeaways = priceTakeaway
    ? [...nonPriceTakeaways.slice(0, 4), priceTakeaway]
    : nonPriceTakeaways.slice(0, 5);

  if (takeaways.length > 0) return takeaways;

  return [
    'The biggest differences here are model-specific, so use the table below to compare the exact size, warranty, weight rating and price rows for the models you are considering.',
  ];
}
