import type { Country } from '@/lib/geolocation';
import { resolveQuizCountry } from '@/lib/geolocation';
import {
  getEligibleTrampolines,
  type MatchReasonBank,
  type SpringType,
  type Trampoline,
} from '@/lib/trampolines';

export type BudgetId =
  | 'under-500'
  | '500-1000'
  | '1000-1500'
  | '1500-2500'
  | '2500-plus'
  | 'flexible';
export type BudgetSelection = BudgetId[];

export type BackyardSize = 'small' | 'medium' | 'large' | 'long-narrow' | 'not-sure';
export type ShapeChoice = 'round' | 'rectangle' | 'no-preference';
export type AgeGroup = 'under-8' | '8-12' | 'teens' | 'mixed' | 'not-sure';
export type JumperCount = '1-2' | '3-plus' | 'not-sure';
export type SpringChoice = SpringType | 'not-sure';
export type StandardsChoice = 'yes' | 'no';

export interface QuizAnswers {
  country: Country;
  backyardSize: BackyardSize;
  ages: AgeGroup;
  jumpers: JumperCount;
  shape: ShapeChoice;
  budget: BudgetSelection;
  springType: SpringChoice;
  standards: StandardsChoice;
}

export interface ScoredTrampoline extends Trampoline {
  rawScore: number;
  finalScore: number;
  recommendedSizeDisplay: string;
  /** Set on fill-in results: how this model differs from the answers. */
  closeMatch?: string[];
}

export const backyardSizes: BackyardSize[] = ['small', 'medium', 'large', 'long-narrow', 'not-sure'];
export const ageGroups: AgeGroup[] = ['under-8', '8-12', 'teens', 'mixed', 'not-sure'];
export const jumperCounts: JumperCount[] = ['1-2', '3-plus', 'not-sure'];
export const shapeChoices: ShapeChoice[] = ['round', 'rectangle', 'no-preference'];
export const springChoices: SpringChoice[] = ['traditional', 'springless', 'not-sure'];
export const standardsChoices: StandardsChoice[] = ['yes', 'no'];

export const budgetRanges: Record<BudgetId, [number, number]> = {
  'under-500': [0, 500],
  '500-1000': [500, 1000],
  '1000-1500': [1000, 1500],
  '1500-2500': [1500, 2500],
  '2500-plus': [2500, 999999],
  flexible: [0, 999999],
};

export const budgetOrder: BudgetId[] = [
  'under-500',
  '500-1000',
  '1000-1500',
  '1500-2500',
  '2500-plus',
  'flexible',
];

// The quiz now asks for a single range, but results URLs saved before that
// change can still carry two neighbouring ranges.
function isValidBudgetSelection(budget: BudgetSelection): boolean {
  if (budget.length === 0 || budget.length > 2) return false;
  if (budget.includes('flexible')) return budget.length === 1;
  if (budget.length === 1) return true;

  const sortedIndexes = budget
    .map((budgetId) => budgetOrder.indexOf(budgetId))
    .sort((a, b) => a - b);
  return sortedIndexes[1] === sortedIndexes[0] + 1;
}

// ─── Size ─────────────────────────────────────────────────────────────────────

const YARD_TIER = { small: 1, medium: 2, large: 3 } as const;

function trampolineTiers(trampoline: Trampoline): number[] {
  return [
    trampoline.fitsYard.small ? 1 : 0,
    trampoline.fitsYard.medium ? 2 : 0,
    trampoline.fitsYard.large ? 3 : 0,
  ].filter(Boolean);
}

/**
 * The yard sets the largest trampoline that fits. The number of jumpers sets the
 * size we aim for inside that limit: one or two jumpers in a large yard are
 * pointed at a medium trampoline rather than the biggest one that fits.
 */
function targetTier(backyardSize: 'small' | 'medium' | 'large', jumpers: JumperCount): number {
  const yardTier = YARD_TIER[backyardSize];
  return jumpers === '1-2' ? Math.min(yardTier, 2) : yardTier;
}

export function scoreSize(
  trampoline: Trampoline,
  backyardSize: BackyardSize,
  jumpers: JumperCount,
): number {
  if (backyardSize === 'not-sure') {
    if (trampoline.fitsYard.medium) return 12;
    if (trampoline.fitsYard.small) return 8;
    if (trampoline.fitsYard.large) return -20;
    if (trampoline.fitsYard.longNarrow) return -10;
    return -20;
  }
  if (backyardSize === 'long-narrow') {
    if (trampoline.shape === 'oval' || trampoline.shape === 'rectangle') return 40;
    if (trampoline.shape === 'square') return -10;
    return -20; // round trampolines are a poor fit for long narrow yards
  }

  const yardTier = YARD_TIER[backyardSize];
  const fitting = trampolineTiers(trampoline).filter((tier) => tier <= yardTier);
  if (fitting.length === 0) return -100; // too big for the yard

  const target = targetTier(backyardSize, jumpers);
  if (fitting.includes(target)) return 30;

  const nearest = fitting.reduce((best, tier) =>
    Math.abs(tier - target) < Math.abs(best - target) ? tier : best,
  );
  if (nearest > target) return 15; // fits, but bigger than one or two jumpers need
  if (target - nearest > 1) return -100; // a small-only trampoline in a large yard
  return jumpers === '1-2' ? 20 : 5; // one size down suits one or two jumpers
}

// ─── Who will use it ──────────────────────────────────────────────────────────

/**
 * Young kids lean to springless designs (Springfree, Vuly Thunder). Kids 8–12
 * lean to spring trampolines with enclosed-spring safety designs (Vuly Ultra).
 * Teens and adults lean to rectangles for a higher bounce, and away from the
 * smallest frames. A mix of ages leans to either safety design.
 */
export function scoreUsers(trampoline: Trampoline, ages: AgeGroup): number {
  const springless = trampoline.springType === 'springless';

  if (ages === 'under-8') {
    if (springless) return 35;
    return trampoline.advancedSafety ? 0 : -15;
  }
  if (ages === '8-12') {
    if (springless) return 0;
    return trampoline.advancedSafety ? 30 : 15;
  }
  if (ages === 'teens') {
    const shapeScore =
      trampoline.shape === 'rectangle'
        ? 35
        : trampoline.shape === 'square'
          ? 25
          : trampoline.shape === 'oval'
            ? 5
            : 0;
    const tooSmall = Math.max(...trampoline.sizes) < 10 ? -15 : 0;
    return shapeScore + tooSmall;
  }
  if (ages === 'mixed') {
    return springless || trampoline.advancedSafety ? 15 : 0;
  }
  return 0;
}

// ─── Shape and budget ─────────────────────────────────────────────────────────

// Squares are grouped with rectangles in the question card. Ovals read as
// elongated rounds: partial credit for a round preference, excluded for a
// rectangle preference.
function scoreShape(trampoline: Trampoline, shape: ShapeChoice): number {
  if (shape === 'no-preference') return 0;
  if (shape === 'round') {
    if (trampoline.shape === 'round') return 40;
    if (trampoline.shape === 'oval') return 15;
    return -100;
  }
  if (trampoline.shape === 'rectangle') return 40;
  if (trampoline.shape === 'square') return 30;
  return -100;
}

// ─── Spring type and standards ────────────────────────────────────────────────

function scoreSpringType(trampoline: Trampoline, springType: SpringChoice): number {
  if (springType === 'not-sure') return 0;
  return trampoline.springType === springType ? 40 : -100;
}

/** "Does it need to meet the standard?" — yes is a requirement, so a miss is excluded. */
function scoreStandards(
  trampoline: Trampoline,
  standards: StandardsChoice,
  country: 'AU' | 'US',
): number {
  if (standards === 'no') return 0;
  const meets = country === 'US' ? trampoline.meetsUSStandards : trampoline.meetsAUStandards;
  return meets ? 20 : -100;
}

function getBudgetRange(budget: BudgetSelection): [number, number] {
  if (budget.length === 0 || budget.includes('flexible')) return budgetRanges.flexible;

  return budget.reduce<[number, number]>(
    ([currentMin, currentMax], budgetId) => {
      const [min, max] = budgetRanges[budgetId];
      return [Math.min(currentMin, min), Math.max(currentMax, max)];
    },
    [999999, 0],
  );
}

function scoreBudget(trampoline: Trampoline, budget: BudgetSelection): number {
  if (budget.length === 0 || budget.includes('flexible')) return 0;
  const [min, max] = getBudgetRange(budget);
  if (trampoline.priceFrom >= min && trampoline.priceFrom <= max) return 25;
  if (trampoline.priceFrom > max) {
    const ratio = trampoline.priceFrom / Math.max(max, 1);
    return ratio > 1.5 ? -100 : -30;
  }
  return 0;
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

function joinSizeOptionLabels(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? '';
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')} or ${labels.at(-1)}`;
}

/**
 * Narrows mixed-certification model families only when an Australian user says
 * the standard is required. Other users retain the complete family.
 */
export function resolveTrampolineForAnswers(
  trampoline: Trampoline,
  answers: QuizAnswers,
): Trampoline {
  const country = resolveQuizCountry(answers.country);
  if (country !== 'AU' || answers.standards !== 'yes' || !trampoline.sizeOptions) {
    return trampoline;
  }

  const confirmedOptions = trampoline.sizeOptions.filter((option) => option.meetsAUStandards);
  if (confirmedOptions.length === 0 || confirmedOptions.length === trampoline.sizeOptions.length) {
    return trampoline;
  }

  return {
    ...trampoline,
    meetsAUStandards: true,
    priceFrom: Math.min(...confirmedOptions.map((option) => option.priceAud)),
    sizes: confirmedOptions.map((option) => option.approximateFt),
    displaySize: joinSizeOptionLabels(confirmedOptions.map((option) => option.displayLabel)),
    sizeOptions: confirmedOptions,
  };
}

function getScoringPool(answers: QuizAnswers): Trampoline[] {
  return getEligibleTrampolines(answers.country).map((trampoline) =>
    resolveTrampolineForAnswers(trampoline, answers),
  );
}

function isHardExcluded(trampoline: Trampoline, answers: QuizAnswers): boolean {
  return (
    scoreSize(trampoline, answers.backyardSize, answers.jumpers) <= -100 ||
    scoreShape(trampoline, answers.shape) <= -100 ||
    scoreBudget(trampoline, answers.budget) <= -100 ||
    scoreSpringType(trampoline, answers.springType) <= -100 ||
    scoreStandards(trampoline, answers.standards, resolveQuizCountry(answers.country)) <= -100
  );
}

function countSignals(answers: QuizAnswers): number {
  let signals = 0;
  if (answers.backyardSize !== 'not-sure') signals += 1;
  if (answers.ages !== 'not-sure') signals += 1;
  if (answers.shape !== 'no-preference') signals += 1;
  if (answers.budget.length > 0 && !answers.budget.includes('flexible')) signals += 1;
  if (answers.springType !== 'not-sure') signals += 1;
  if (answers.standards === 'yes') signals += 1;
  return signals;
}

/** Tie-breaker only: separates models the answers score equally. */
function baseMeritScore(trampoline: Trampoline): number {
  return (
    trampoline.metricScores.bounce +
    trampoline.metricScores.durability +
    trampoline.metricScores.value +
    trampoline.metricScores.warranty +
    (trampoline.advancedSafety ? 3 : 0)
  );
}

function rawScoreFor(trampoline: Trampoline, answers: QuizAnswers): number {
  return (
    scoreSize(trampoline, answers.backyardSize, answers.jumpers) +
    scoreUsers(trampoline, answers.ages) +
    scoreShape(trampoline, answers.shape) +
    scoreBudget(trampoline, answers.budget) +
    scoreSpringType(trampoline, answers.springType) +
    scoreStandards(trampoline, answers.standards, resolveQuizCountry(answers.country))
  );
}

function getDiverseRecommendations(answers: QuizAnswers): ScoredTrampoline[] {
  const pool = getScoringPool(answers)
    .filter((trampoline) => !isHardExcluded(trampoline, answers))
    .filter((trampoline) => scoreBudget(trampoline, answers.budget) >= 0)
    // Shape first so a stated preference beats merit — e.g. a rectangle answer
    // must rank true rectangles above the ovals that survive as partial matches.
    .sort(
      (a, b) =>
        scoreShape(b, answers.shape) - scoreShape(a, answers.shape) ||
        scoreUsers(b, answers.ages) - scoreUsers(a, answers.ages) ||
        scoreSize(b, answers.backyardSize, answers.jumpers) - scoreSize(a, answers.backyardSize, answers.jumpers) ||
        baseMeritScore(b) - baseMeritScore(a) ||
        a.priceFrom - b.priceFrom,
    );

  const picks: Trampoline[] = [];
  const seenIds = new Set<string>();
  const seenBrands = new Set<string>();

  function pick(predicate: (trampoline: Trampoline) => boolean) {
    const match = pool.find((trampoline) => !seenIds.has(trampoline.id) && predicate(trampoline));
    if (!match) return;
    picks.push(match);
    seenIds.add(match.id);
    seenBrands.add(match.brand);
  }

  pick((trampoline) => trampoline.springType === 'springless');
  pick((trampoline) => trampoline.springType === 'traditional' && !seenBrands.has(trampoline.brand));
  pick((trampoline) => !seenBrands.has(trampoline.brand));

  for (const trampoline of pool) {
    if (picks.length >= 3) break;
    if (seenIds.has(trampoline.id)) continue;
    picks.push(trampoline);
    seenIds.add(trampoline.id);
  }

  const scoredPicks = picks.slice(0, 3).map((trampoline) => ({
    ...trampoline,
    rawScore: 1,
    finalScore: 1,
    recommendedSizeDisplay: getRecommendedSizeDisplay(trampoline, answers.backyardSize, answers.jumpers),
  }));

  return diversifyTopTwoBrands(scoredPicks).slice(0, 3);
}

// ─── Recommended size display ──────────────────────────────────────────────────

function targetFeet(backyardSize: BackyardSize, jumpers: JumperCount): number {
  if (backyardSize === 'small') return jumpers === '3-plus' ? 10 : 8;
  if (backyardSize === 'medium') return 12;
  if (backyardSize === 'large') return jumpers === '1-2' ? 12 : 14;
  return 12; // not-sure or long-narrow
}

export function getRecommendedSizeDisplay(
  trampoline: Trampoline,
  backyardSize: BackyardSize,
  jumpers: JumperCount = 'not-sure',
): string {
  const targetFt = targetFeet(backyardSize, jumpers);

  if (trampoline.sizeOptions?.length) {
    const closest = trampoline.sizeOptions.reduce((best, option) =>
      Math.abs(option.approximateFt - targetFt) < Math.abs(best.approximateFt - targetFt)
        ? option
        : best,
    );
    return closest.displayLabel;
  }

  // Single-size models always use their displaySize
  if (trampoline.sizes.length === 1) return trampoline.displaySize;

  // Multi-size models: pick the closest approximate ft size to the target
  const closest = trampoline.sizes.reduce((best, size) =>
    Math.abs(size - targetFt) < Math.abs(best - targetFt) ? size : best,
  );
  return `${closest}ft`;
}

// ─── Core scoring ─────────────────────────────────────────────────────────────

function scoreAll(answers: QuizAnswers): ScoredTrampoline[] {
  return getScoringPool(answers).map((trampoline) => {
    const rawScore = isHardExcluded(trampoline, answers)
      ? Number.NEGATIVE_INFINITY
      : rawScoreFor(trampoline, answers);
    return {
      ...trampoline,
      rawScore,
      finalScore: rawScore,
      recommendedSizeDisplay: getRecommendedSizeDisplay(trampoline, answers.backyardSize, answers.jumpers),
    };
  });
}

function applyVulyBias(sorted: ScoredTrampoline[]): ScoredTrampoline[] {
  const topVuly = sorted.find((t) => t.isVuly);
  const topNonVuly = sorted.find((t) => !t.isVuly);

  if (!topVuly || !topNonVuly || topVuly.rawScore > topNonVuly.rawScore) {
    return sorted; // Vuly is already ahead, or no competition
  }

  if (topVuly.rawScore === topNonVuly.rawScore) {
    // Dead heat — promote Vuly to #1
    return [topVuly, ...sorted.filter((t) => t.id !== topVuly.id)];
  }

  return sorted;
}

function diversifyTopTwoBrands(sorted: ScoredTrampoline[]): ScoredTrampoline[] {
  const [first, second] = sorted;
  if (!first || !second || first.brand !== second.brand) return sorted;

  const replacementIndex = sorted.findIndex((trampoline, index) => index > 1 && trampoline.brand !== first.brand);
  // No other brand fits: show the same brand again rather than a single result.
  if (replacementIndex === -1) return sorted;

  const replacement = sorted[replacementIndex];
  return [
    first,
    replacement,
    ...sorted.slice(1, replacementIndex),
    ...sorted.slice(replacementIndex + 1),
  ];
}

function applyRankingRules(sorted: ScoredTrampoline[]): ScoredTrampoline[] {
  return diversifyTopTwoBrands(applyVulyBias(sorted));
}

export function getRecommendations(answers: QuizAnswers): ScoredTrampoline[] {
  const ranked = countSignals(answers) <= 1 ? getDiverseRecommendations(answers) : getRankedMatches(answers);
  const filled = ranked.length >= 3 ? ranked : [...ranked, ...getCloseMatches(answers, ranked, 3 - ranked.length)];

  // Soft over-budget matches (up to 1.5× the range) say so, like the fill-ins.
  return filled.map((rec) =>
    !rec.closeMatch && scoreBudget(rec, answers.budget) < 0
      ? { ...rec, closeMatch: [closeMatchLabel('budget', answers)] }
      : rec,
  );
}

function getRankedMatches(answers: QuizAnswers): ScoredTrampoline[] {

  const passing = scoreAll(answers)
    .filter((t) => t.rawScore > 0)
    .sort(
      (a, b) =>
        b.rawScore - a.rawScore ||
        baseMeritScore(b) - baseMeritScore(a) ||
        a.priceFrom - b.priceFrom,
    );

  return applyRankingRules(passing).slice(0, 3);
}

// ─── Fill-in results ──────────────────────────────────────────────────────────

type Relaxation = 'budget' | 'shape' | 'springType';
const RELAXATION_ORDER: Relaxation[] = ['budget', 'shape', 'springType'];

function closeMatchLabel(relaxation: Relaxation, answers: QuizAnswers): string {
  if (relaxation === 'budget') return 'Over your budget';
  if (relaxation === 'shape') return answers.shape === 'round' ? 'Not round' : 'Not a rectangle or square';
  return answers.springType === 'springless' ? 'Has traditional springs' : 'Springless';
}

/**
 * When fewer than three models match every answer, fill the remaining slots
 * with the nearest models and say how each one differs. Yard fit and a required
 * safety standard are never relaxed. Budget is relaxed first, then shape, then
 * spring type.
 */
function getCloseMatches(
  answers: QuizAnswers,
  taken: ScoredTrampoline[],
  slots: number,
): ScoredTrampoline[] {
  const country = resolveQuizCountry(answers.country);
  const takenIds = new Set(taken.map((trampoline) => trampoline.id));

  return getScoringPool(answers)
    .filter((trampoline) => !takenIds.has(trampoline.id))
    .filter((trampoline) => scoreSize(trampoline, answers.backyardSize, answers.jumpers) > -100)
    .filter((trampoline) => scoreStandards(trampoline, answers.standards, country) > -100)
    .map((trampoline) => {
      const misses = RELAXATION_ORDER.filter((relaxation) =>
        relaxation === 'budget'
          ? scoreBudget(trampoline, answers.budget) < 0
          : relaxation === 'shape'
            ? scoreShape(trampoline, answers.shape) <= -100
            : scoreSpringType(trampoline, answers.springType) <= -100,
      );
      const keptScore =
        scoreSize(trampoline, answers.backyardSize, answers.jumpers) +
        scoreUsers(trampoline, answers.ages) +
        scoreStandards(trampoline, answers.standards, country) +
        (misses.includes('shape') ? 0 : scoreShape(trampoline, answers.shape)) +
        (misses.includes('springType') ? 0 : scoreSpringType(trampoline, answers.springType)) +
        (misses.includes('budget') ? 0 : scoreBudget(trampoline, answers.budget));
      // Lower is closer: each relaxation weighs more than the one before it.
      const distance = misses.reduce((sum, miss) => sum + 2 ** RELAXATION_ORDER.indexOf(miss), 0);
      return { trampoline, misses, keptScore, distance };
    })
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        b.keptScore - a.keptScore ||
        a.trampoline.priceFrom - b.trampoline.priceFrom,
    )
    .slice(0, slots)
    .map(({ trampoline, misses, keptScore }) => ({
      ...trampoline,
      rawScore: keptScore,
      finalScore: keptScore,
      recommendedSizeDisplay: getRecommendedSizeDisplay(trampoline, answers.backyardSize, answers.jumpers),
      closeMatch: misses.length > 0 ? misses.map((miss) => closeMatchLabel(miss, answers)) : undefined,
    }));
}

// ─── Match reason selection ────────────────────────────────────────────────────

const yardLabel: Record<'small' | 'medium' | 'large', string> = {
  small: 'small',
  medium: 'medium',
  large: 'large',
};

export function selectMatchReasons(
  rec: ScoredTrampoline,
  answers: QuizAnswers,
  country: 'AU' | 'US',
): string[] {
  const reasons: string[] = [];
  const mr: MatchReasonBank = rec.matchReasons;
  const add = (reason: string | undefined) => {
    if (reason && !reasons.includes(reason)) reasons.push(reason);
  };
  const isRectangular = rec.shape === 'rectangle' || rec.shape === 'square';

  // 1. Spring type preference
  if (answers.springType === 'springless' && rec.springType === 'springless') add(mr.springless);
  else if (answers.springType === 'traditional' && rec.springType === 'traditional') add(mr.traditional);

  // 2. Who will use it
  if (answers.ages === 'under-8' && rec.springType === 'springless') add(mr.springless);
  else if (answers.ages === '8-12' && rec.advancedSafety) add(mr.safetyNiceToHave);
  else if (answers.ages === 'teens' && isRectangular) add(mr.shapeRectangle ?? mr.bounce);
  else if (answers.ages === 'mixed' && rec.advancedSafety) add(mr.safetyNiceToHave ?? mr.springless);

  // 3. Shape preference
  if (answers.shape === 'round' && rec.shape === 'round') add(mr.shapeRound);
  else if (answers.shape === 'rectangle' && isRectangular) add(mr.shapeRectangle);

  // 4. Backyard size fit (always include)
  const yard = answers.backyardSize;
  const hasSizeChoice = Boolean(rec.sizeOptions?.length) || rec.sizes.length > 1;
  if (hasSizeChoice && (yard === 'small' || yard === 'medium' || yard === 'large')) {
    add(
      answers.jumpers === 'not-sure'
        ? `Recommended size: ${rec.recommendedSizeDisplay} for a ${yardLabel[yard]} yard`
        : `Recommended size: ${rec.recommendedSizeDisplay} for ${answers.jumpers === '1-2' ? '1 or 2' : '3 or more'} jumpers in a ${yardLabel[yard]} yard`,
    );
  } else {
    const bankReason =
      yard === 'small'
        ? mr.smallYard
        : yard === 'medium'
          ? mr.mediumYard
          : yard === 'large'
            ? mr.largeYard
            : yard === 'long-narrow'
              ? mr.longNarrowYard
              : undefined;
    add(
      bankReason ??
        (yard === 'small' || yard === 'medium' || yard === 'large'
          ? `${rec.recommendedSizeDisplay}, which fits a ${yardLabel[yard]} yard`
          : undefined),
    );
  }

  // 5. Standards compliance (shown whenever the whole family, or the narrowed sizes, comply)
  const meets = country === 'US' ? rec.meetsUSStandards : rec.meetsAUStandards;
  if (meets) add(mr.meetsStandards);

  // 6. Budget fit
  if (answers.budget.length > 0 && !answers.budget.includes('flexible')) {
    const [min, max] = getBudgetRange(answers.budget);
    if (rec.priceFrom <= max) {
      const price = `$${rec.priceFrom.toLocaleString('en-AU')} AUD`;
      add(
        rec.priceFrom < min
          ? `From ${price}, below your selected budget range`
          : `From ${price}, within your selected budget range`,
      );
    }
  }

  return reasons.slice(0, 4);
}

// ─── Summary text ──────────────────────────────────────────────────────────────

export function buildSummaryText(answers: QuizAnswers): string {
  const yardText: Record<BackyardSize, string | null> = {
    small: 'a small backyard',
    medium: 'a medium backyard',
    large: 'a large backyard',
    'long-narrow': 'a long, narrow backyard',
    'not-sure': null,
  };
  const agesText: Record<AgeGroup, string | null> = {
    'under-8': 'kids under 8',
    '8-12': 'kids aged 8 to 12',
    teens: 'teens or adults',
    mixed: 'a mix of ages',
    'not-sure': null,
  };
  const jumpersText: Record<JumperCount, string | null> = {
    '1-2': '1 or 2 jumpers',
    '3-plus': '3 or more jumpers',
    'not-sure': null,
  };
  const shapeText: Record<ShapeChoice, string | null> = {
    round: 'a round shape',
    rectangle: 'a rectangle or square shape',
    'no-preference': null,
  };
  const springText: Record<SpringChoice, string | null> = {
    springless: 'a springless design',
    traditional: 'traditional springs',
    'not-sure': null,
  };
  const budgetLabel: Record<BudgetId, string> = {
    'under-500': 'under $500',
    '500-1000': '$500–$1,000',
    '1000-1500': '$1,000–$1,500',
    '1500-2500': '$1,500–$2,500',
    '2500-plus': 'above $2,500',
    flexible: '',
  };

  const ages = agesText[answers.ages];
  const jumpers = jumpersText[answers.jumpers];
  const users = ages && jumpers ? `${ages} (${jumpers})` : (ages ?? jumpers);
  const budget =
    answers.budget.length === 0 || answers.budget.includes('flexible')
      ? null
      : `a budget of ${answers.budget
          .slice()
          .sort((a, b) => budgetOrder.indexOf(a) - budgetOrder.indexOf(b))
          .map((id) => budgetLabel[id])
          .join(' to ')}`;

  const standards =
    answers.standards === 'yes'
      ? resolveQuizCountry(answers.country) === 'US'
        ? 'ASTM safety standards'
        : 'the Australian Trampoline Standard'
      : null;

  const parts = [
    yardText[answers.backyardSize],
    users,
    shapeText[answers.shape],
    budget,
    springText[answers.springType],
    standards,
  ].filter(
    (part): part is string => Boolean(part),
  );

  if (parts.length === 0) {
    return 'You skipped the questions, so these are well-rated options from different brands and price points.';
  }

  const list =
    parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
  return `Matched to ${list}.`;
}

// ─── URL serialization ──────────────────────────────────────────────────────────

export function encodeAnswers(answers: QuizAnswers): string {
  const params = new URLSearchParams();
  params.set('country', answers.country);
  params.set('backyardSize', answers.backyardSize);
  params.set('ages', answers.ages);
  params.set('jumpers', answers.jumpers);
  params.set('shape', answers.shape);
  params.set('budget', answers.budget.join(','));
  params.set('springType', answers.springType);
  params.set('standards', answers.standards);
  return params.toString();
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T | null {
  if (value === null) return fallback;
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export function parseAnswers(searchParams: URLSearchParams): QuizAnswers | null {
  const country = searchParams.get('country');
  const backyardSize = searchParams.get('backyardSize');
  // Defaults keep results URLs from earlier quiz versions working
  const ages = oneOf(searchParams.get('ages'), ageGroups, 'not-sure');
  const jumpers = oneOf(searchParams.get('jumpers'), jumperCounts, 'not-sure');
  const shape = oneOf(searchParams.get('shape'), shapeChoices, 'no-preference');
  const springType = oneOf(searchParams.get('springType'), springChoices, 'not-sure');
  const standards = oneOf(searchParams.get('standards'), standardsChoices, 'no');
  const budget = (searchParams.get('budget') ?? '')
    .split(',')
    .filter((value): value is BudgetId => budgetOrder.includes(value as BudgetId));

  if (
    (country !== 'AU' && country !== 'US' && country !== 'OTHER') ||
    !backyardSizes.includes(backyardSize as BackyardSize) ||
    !ages ||
    !jumpers ||
    !shape ||
    !springType ||
    !standards ||
    !isValidBudgetSelection(budget)
  ) {
    return null;
  }

  return {
    country,
    backyardSize: backyardSize as BackyardSize,
    ages,
    jumpers,
    shape,
    budget,
    springType,
    standards,
  };
}
