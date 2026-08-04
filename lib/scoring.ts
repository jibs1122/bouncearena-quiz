import type { Country } from '@/lib/geolocation';
import { resolveQuizCountry } from '@/lib/geolocation';
import {
  getEligibleTrampolines,
  type MatchReasonBank,
  type PriorityId,
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

export type ShapeChoice = 'round' | 'rectangle' | 'no-preference';

export interface QuizAnswers {
  country: Country;
  backyardSize: 'small' | 'medium' | 'large' | 'long-narrow' | 'not-sure';
  shape: ShapeChoice;
  standards: 'yes' | 'no';
  safetyFeatures: 'essential' | 'nice-to-have' | 'not-important';
  springType: SpringType | 'not-sure';
  budget: BudgetSelection;
  priorities: PriorityId[];
}

export interface ScoredTrampoline extends Trampoline {
  rawScore: number;
  finalScore: number;
  recommendedSizeDisplay: string;
}

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

function isValidBudgetSelection(budget: BudgetSelection): boolean {
  if (budget.length === 0 || budget.length > 2) return false;
  if (budget.includes('flexible')) return budget.length === 1;
  if (budget.length === 1) return true;

  const sortedIndexes = budget
    .map((budgetId) => budgetOrder.indexOf(budgetId))
    .sort((a, b) => a - b);
  return sortedIndexes[1] === sortedIndexes[0] + 1;
}

// ─── Individual scoring functions ──────────────────────────────────────────────

function scoreSize(trampoline: Trampoline, backyardSize: QuizAnswers['backyardSize']): number {
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
  const fits =
    backyardSize === 'small'
      ? trampoline.fitsYard.small
      : backyardSize === 'medium'
        ? trampoline.fitsYard.medium
        : trampoline.fitsYard.large;
  return fits ? 30 : -100;
}

function scoreStandards(
  trampoline: Trampoline,
  standards: QuizAnswers['standards'],
  country: 'AU' | 'US',
): number {
  if (standards === 'no') return 0;
  const meets = country === 'US' ? trampoline.meetsUSStandards : trampoline.meetsAUStandards;
  return meets ? 20 : -50;
}

function scoreSafety(
  trampoline: Trampoline,
  safetyFeatures: QuizAnswers['safetyFeatures'],
): number {
  if (safetyFeatures === 'essential') return trampoline.advancedSafety ? 30 : -30;
  if (safetyFeatures === 'nice-to-have') return trampoline.advancedSafety ? 10 : 0;
  return 0;
}

function scoreSpringType(
  trampoline: Trampoline,
  springType: QuizAnswers['springType'],
): number {
  if (springType === 'not-sure') return 0;
  return trampoline.springType === springType ? 40 : -100;
}

// Ovals get partial credit both ways: they read as elongated rounds, and they're
// the only springless non-round options — a springless + rectangle answer must
// still surface Springfree squares/ovals rather than nothing.
function scoreShape(trampoline: Trampoline, shape: ShapeChoice): number {
  if (shape === 'no-preference') return 0;
  if (shape === 'round') {
    if (trampoline.shape === 'round') return 40;
    if (trampoline.shape === 'oval') return 15;
    return -100; // squares are grouped with rectangles in the question
  }
  if (trampoline.shape === 'rectangle') return 40;
  if (trampoline.shape === 'square') return 30;
  if (trampoline.shape === 'oval') return 10;
  return -100;
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

function scorePriorities(trampoline: Trampoline, priorities: PriorityId[]): number {
  return priorities
    .slice(0, 2)
    .reduce(
      (total, priority) =>
        total + trampoline.metricScores[priority] * 2,
      0,
    );
}

function isHardExcluded(
  trampoline: Trampoline,
  answers: QuizAnswers,
): boolean {
  const sizeScore = scoreSize(trampoline, answers.backyardSize);
  if (sizeScore <= -100) return true;

  const springScore = scoreSpringType(trampoline, answers.springType);
  if (springScore <= -100) return true;

  const shapeScore = scoreShape(trampoline, answers.shape);
  if (shapeScore <= -100) return true;

  const budgetScore = scoreBudget(trampoline, answers.budget);
  if (budgetScore <= -100) return true;

  return false;
}

function countSignals(answers: QuizAnswers): number {
  let signals = 0;
  if (answers.backyardSize !== 'not-sure') signals += 1;
  if (answers.shape !== 'no-preference') signals += 1;
  if (answers.standards === 'yes') signals += 1;
  if (answers.safetyFeatures === 'essential') signals += 1;
  if (answers.springType !== 'not-sure') signals += 1;
  if (answers.budget.length > 0 && !answers.budget.includes('flexible')) signals += 1;
  if (answers.priorities.length > 0) signals += 1;
  return signals;
}

function baseMeritScore(trampoline: Trampoline): number {
  return (
    trampoline.metricScores.bounce +
    trampoline.metricScores.durability +
    trampoline.metricScores.value +
    trampoline.metricScores.assembly +
    trampoline.metricScores.warranty +
    (trampoline.advancedSafety ? 3 : 0)
  );
}

function getDiverseRecommendations(answers: QuizAnswers): ScoredTrampoline[] {
  const country = resolveQuizCountry(answers.country);
  const pool = getEligibleTrampolines(answers.country)
    .filter((trampoline) => !isHardExcluded(trampoline, answers))
    .filter((trampoline) => scoreBudget(trampoline, answers.budget) >= 0)
    .filter((trampoline) => scoreStandards(trampoline, answers.standards, country) > -50)
    // Shape first so a stated preference beats merit — e.g. a rectangle answer
    // must rank true rectangles above the ovals that survive as partial matches.
    .sort(
      (a, b) =>
        scoreShape(b, answers.shape) - scoreShape(a, answers.shape) ||
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
    recommendedSizeDisplay: getRecommendedSizeDisplay(trampoline, answers.backyardSize),
  }));

  return diversifyTopTwoBrands(scoredPicks).slice(0, 3);
}

// ─── Recommended size display ──────────────────────────────────────────────────

export function getRecommendedSizeDisplay(
  trampoline: Trampoline,
  backyardSize: QuizAnswers['backyardSize'],
): string {
  // Single-size models always use their displaySize
  if (trampoline.sizes.length === 1) return trampoline.displaySize;

  // Multi-size models (Vuly): pick the closest ft size to the target
  let targetFt: number;
  if (backyardSize === 'small') targetFt = 8;
  else if (backyardSize === 'medium') targetFt = 12;
  else if (backyardSize === 'large') targetFt = 14;
  else targetFt = 12; // not-sure or long-narrow → default 12ft

  const closest = trampoline.sizes.reduce((best, size) =>
    Math.abs(size - targetFt) < Math.abs(best - targetFt) ? size : best,
  );
  return `${closest}ft`;
}

// ─── Core scoring ─────────────────────────────────────────────────────────────

function scoreAll(answers: QuizAnswers): ScoredTrampoline[] {
  const country = resolveQuizCountry(answers.country);
  return getEligibleTrampolines(answers.country).map((trampoline) => {
    if (isHardExcluded(trampoline, answers)) {
      return {
        ...trampoline,
        rawScore: Number.NEGATIVE_INFINITY,
        finalScore: Number.NEGATIVE_INFINITY,
        recommendedSizeDisplay: getRecommendedSizeDisplay(trampoline, answers.backyardSize),
      };
    }

    const rawScore =
      scoreSize(trampoline, answers.backyardSize) +
      scoreShape(trampoline, answers.shape) +
      scoreStandards(trampoline, answers.standards, country) +
      scoreSafety(trampoline, answers.safetyFeatures) +
      scoreSpringType(trampoline, answers.springType) +
      scoreBudget(trampoline, answers.budget) +
      scorePriorities(trampoline, answers.priorities);
    return {
      ...trampoline,
      rawScore,
      finalScore: rawScore,
      recommendedSizeDisplay: getRecommendedSizeDisplay(trampoline, answers.backyardSize),
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
  if (replacementIndex === -1) return [first];

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
  if (countSignals(answers) <= 1) {
    return getDiverseRecommendations(answers);
  }

  const passing = scoreAll(answers)
    .filter((t) => t.rawScore > 0)
    .sort((a, b) => b.rawScore - a.rawScore || a.priceFrom - b.priceFrom);

  return applyRankingRules(passing).slice(0, 3);
}

export function getBestVulyMatch(answers: QuizAnswers): ScoredTrampoline | null {
  const country = resolveQuizCountry(answers.country);
  const scored = getEligibleTrampolines(answers.country)
    .filter((t) => t.isVuly)
    .map((trampoline) => {
      const rawScore =
        scoreSize(trampoline, answers.backyardSize) +
        scoreShape(trampoline, answers.shape) +
        scoreStandards(trampoline, answers.standards, country) +
        scoreSafety(trampoline, answers.safetyFeatures) +
        scoreSpringType(trampoline, answers.springType) +
        scoreBudget(trampoline, answers.budget) +
        scorePriorities(trampoline, answers.priorities);
      return {
        ...trampoline,
        rawScore,
        finalScore: rawScore,
        recommendedSizeDisplay: getRecommendedSizeDisplay(trampoline, answers.backyardSize),
      };
    })
    .filter((t) => t.rawScore > 0)
    .sort((a, b) => b.rawScore - a.rawScore);

  return scored[0] ?? null;
}

// ─── Match reason selection ────────────────────────────────────────────────────

export function selectMatchReasons(
  rec: ScoredTrampoline,
  answers: QuizAnswers,
  country: 'AU' | 'US',
): string[] {
  const reasons: string[] = [];
  const mr: MatchReasonBank = rec.matchReasons;

  // 1. Spring type preference
  if (answers.springType === 'springless' && mr.springless) reasons.push(mr.springless);
  else if (answers.springType === 'traditional' && mr.traditional) reasons.push(mr.traditional);

  // 2. Shape preference
  if (answers.shape === 'round' && mr.shapeRound) reasons.push(mr.shapeRound);
  else if (answers.shape === 'rectangle' && mr.shapeRectangle) reasons.push(mr.shapeRectangle);

  // 3. Backyard size fit (always include)
  const sizeKey = answers.backyardSize;
  const sizeSnippet =
    sizeKey === 'small'
      ? mr.smallYard
      : sizeKey === 'medium'
        ? mr.mediumYard
        : sizeKey === 'large'
          ? mr.largeYard
          : sizeKey === 'long-narrow'
            ? mr.longNarrowYard
            : undefined;
  if (sizeSnippet) reasons.push(sizeSnippet);

  // 4. Safety preference
  if (answers.safetyFeatures === 'essential' && mr.safetyEssential) {
    reasons.push(mr.safetyEssential);
  } else if (answers.safetyFeatures === 'nice-to-have' && mr.safetyNiceToHave) {
    reasons.push(mr.safetyNiceToHave);
  }

  // 5. Standards compliance
  if (answers.standards === 'yes') {
    const meets = country === 'US' ? rec.meetsUSStandards : rec.meetsAUStandards;
    if (meets && mr.meetsStandards) reasons.push(mr.meetsStandards);
  }

  // 6. Budget fit
  const budgetKeyMap: Partial<Record<BudgetId, keyof MatchReasonBank>> = {
    'under-500': 'budget_under_500',
    '500-1000': 'budget_500_1000',
    '1000-1500': 'budget_1000_1500',
    '1500-2500': 'budget_1500_2500',
    '2500-plus': 'budget_2500_plus',
  };
  for (const budget of answers.budget.slice(0, 2)) {
    const budgetKey = budgetKeyMap[budget];
    const budgetSnippet = budgetKey ? mr[budgetKey] : undefined;
    if (budgetSnippet) {
      reasons.push(budgetSnippet);
      break;
    }
  }

  // 7. Priority matches
  for (const priority of answers.priorities.slice(0, 2)) {
    if (reasons.length >= 4) break;
    if (priority === 'bounce' && mr.bounce) reasons.push(mr.bounce);
    else if (priority === 'durability' && mr.durability) reasons.push(mr.durability);
    else if (priority === 'value' && mr.valueForMoney) reasons.push(mr.valueForMoney);
    else if (priority === 'assembly' && mr.assembly) reasons.push(mr.assembly);
    else if (priority === 'warranty' && mr.warranty) reasons.push(mr.warranty);
  }

  return reasons.slice(0, 4);
}

// ─── Summary text ──────────────────────────────────────────────────────────────

export function buildSummaryText(answers: QuizAnswers): string {
  const budgetLabel: Record<BudgetId, string> = {
    'under-500': 'a budget under $500',
    '500-1000': 'a budget of $500–$1,000',
    '1000-1500': 'a budget of $1,000–$1,500',
    '1500-2500': 'a budget of $1,500–$2,500',
    '2500-plus': 'a budget above $2,500',
    flexible: 'a flexible budget',
  };

  const selectedBudgetLabel = answers.budget.includes('flexible') || answers.budget.length === 0
    ? budgetLabel.flexible
    : answers.budget
        .slice()
        .sort((a, b) => budgetOrder.indexOf(a) - budgetOrder.indexOf(b))
        .map((budget) => budgetLabel[budget])
        .join(' to ');

  const springLabel: Record<QuizAnswers['springType'], string> = {
    springless: 'a springless setup',
    traditional: 'traditional springs',
    'not-sure': 'either spring system',
  };

  const shapeClause =
    answers.shape === 'round'
      ? ' in a round shape'
      : answers.shape === 'rectangle'
        ? ' in a rectangle or square shape'
        : '';

  const priorityLabel: Record<PriorityId, string> = {
    bounce: 'bounce quality',
    durability: 'durability',
    value: 'value for money',
    assembly: 'easy assembly',
    warranty: 'warranty and support',
  };

  const priorities =
    answers.priorities.length > 0
      ? answers.priorities
          .slice(0, 2)
          .map((p) => priorityLabel[p])
          .join(' and ')
      : 'overall fit';

  return `Based on your focus on ${priorities}, your preference for ${springLabel[answers.springType]}${shapeClause}, and ${selectedBudgetLabel}, these are the strongest matches for your family.`;
}

// ─── URL serialization ──────────────────────────────────────────────────────────

export function encodeAnswers(answers: QuizAnswers): string {
  const params = new URLSearchParams();
  params.set('country', answers.country);
  params.set('backyardSize', answers.backyardSize);
  params.set('shape', answers.shape);
  params.set('standards', answers.standards);
  params.set('safetyFeatures', answers.safetyFeatures);
  params.set('springType', answers.springType);
  params.set('budget', answers.budget.join(','));
  params.set('priorities', answers.priorities.join(','));
  return params.toString();
}

export function parseAnswers(searchParams: URLSearchParams): QuizAnswers | null {
  const country = searchParams.get('country');
  const backyardSize = searchParams.get('backyardSize');
  // Default keeps pre-shape-question results URLs working
  const shape = searchParams.get('shape') ?? 'no-preference';
  const standards = searchParams.get('standards');
  const safetyFeatures = searchParams.get('safetyFeatures');
  const springType = searchParams.get('springType');
  const budget = (searchParams.get('budget') ?? '')
    .split(',')
    .filter((value): value is BudgetId => budgetOrder.includes(value as BudgetId));
  const priorities = (searchParams.get('priorities') ?? '')
    .split(',')
    .filter((priority): priority is PriorityId =>
      ['bounce', 'durability', 'value', 'assembly', 'warranty'].includes(priority),
    );

  if (
    (country !== 'AU' && country !== 'US' && country !== 'OTHER') ||
    (backyardSize !== 'small' &&
      backyardSize !== 'medium' &&
      backyardSize !== 'large' &&
      backyardSize !== 'long-narrow' &&
      backyardSize !== 'not-sure') ||
    (shape !== 'round' && shape !== 'rectangle' && shape !== 'no-preference') ||
    (standards !== 'yes' && standards !== 'no') ||
    (safetyFeatures !== 'essential' &&
      safetyFeatures !== 'nice-to-have' &&
      safetyFeatures !== 'not-important') ||
    (springType !== 'traditional' &&
      springType !== 'springless' &&
      springType !== 'not-sure') ||
    !isValidBudgetSelection(budget)
  ) {
    return null;
  }

  return {
    country,
    backyardSize,
    shape,
    standards,
    safetyFeatures,
    springType,
    budget,
    priorities,
  };
}
