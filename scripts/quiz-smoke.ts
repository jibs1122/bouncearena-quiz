import assert from 'node:assert/strict';
import { TRAMPOLINES as COMPARE_ROWS } from '@/data/trampolines';
import {
  getRecommendedSizeDisplay,
  getRecommendations,
  resolveTrampolineForAnswers,
  selectMatchReasons,
  type QuizAnswers,
  type ScoredTrampoline,
} from '@/lib/scoring';
import { compareMatchers, trampolines, type Trampoline } from '@/lib/trampolines';

const scenarios: Array<{ name: string; answers: QuizAnswers }> = [
  {
    name: 'Premium springless AU family',
    answers: {
      country: 'AU',
      backyardSize: 'medium',
      shape: 'no-preference',
      standards: 'yes',
      safetyFeatures: 'essential',
      springType: 'springless',
      budget: ['1500-2500'],
      priorities: ['durability', 'warranty'],
    },
  },
  {
    name: 'Low-signal user',
    answers: {
      country: 'AU',
      backyardSize: 'not-sure',
      shape: 'no-preference',
      standards: 'no',
      safetyFeatures: 'not-important',
      springType: 'not-sure',
      budget: ['flexible'],
      priorities: [],
    },
  },
  {
    name: 'Long-narrow yard',
    answers: {
      country: 'AU',
      backyardSize: 'long-narrow',
      shape: 'no-preference',
      standards: 'no',
      safetyFeatures: 'nice-to-have',
      springType: 'not-sure',
      budget: ['1000-1500'],
      priorities: ['bounce', 'value'],
    },
  },
  {
    name: 'Budget medium yard',
    answers: {
      country: 'AU',
      backyardSize: 'medium',
      shape: 'no-preference',
      standards: 'yes',
      safetyFeatures: 'not-important',
      springType: 'traditional',
      budget: ['500-1000'],
      priorities: ['value', 'warranty'],
    },
  },
  {
    name: 'Rectangle bounce seeker',
    answers: {
      country: 'AU',
      backyardSize: 'large',
      shape: 'rectangle',
      standards: 'no',
      safetyFeatures: 'not-important',
      springType: 'traditional',
      budget: ['1500-2500'],
      priorities: ['bounce', 'durability'],
    },
  },
  {
    name: 'Springless rectangle',
    answers: {
      country: 'AU',
      backyardSize: 'medium',
      shape: 'rectangle',
      standards: 'no',
      safetyFeatures: 'nice-to-have',
      springType: 'springless',
      budget: ['flexible'],
      priorities: ['bounce'],
    },
  },
];

for (const scenario of scenarios) {
  const results = getRecommendations(scenario.answers);
  console.log(`\n## ${scenario.name}`);
  if (results.length === 0) {
    console.log('No results');
    continue;
  }

  for (const [index, result] of results.entries()) {
    console.log(
      `${index + 1}. ${result.brand} ${result.displayName} | score=${result.rawScore} | price=${result.priceFrom} | size=${result.recommendedSizeDisplay} | slug=${result.slug}`,
    );
  }
}

function requireQuizModel(slug: string): Trampoline {
  const trampoline = trampolines.find((candidate) => candidate.slug === slug);
  assert.ok(trampoline, `Expected quiz model ${slug}`);
  return trampoline;
}

function asScored(trampoline: Trampoline, backyardSize: QuizAnswers['backyardSize']): ScoredTrampoline {
  return {
    ...trampoline,
    rawScore: 1,
    finalScore: 1,
    recommendedSizeDisplay: getRecommendedSizeDisplay(trampoline, backyardSize),
  };
}

const baseAnswers: QuizAnswers = {
  country: 'AU',
  backyardSize: 'medium',
  shape: 'no-preference',
  standards: 'no',
  safetyFeatures: 'not-important',
  springType: 'not-sure',
  budget: ['flexible'],
  priorities: [],
};

assert.ok(
  !trampolines.some((trampoline) => trampoline.slug === 'springfree-jumbo-square'),
  'The obsolete Springfree Jumbo Square must not be recommendable',
);
assert.ok(
  !('springfree-jumbo-square' in compareMatchers),
  'The obsolete Springfree Jumbo Square matcher must stay removed',
);

for (const trampoline of trampolines) {
  const matcher = compareMatchers[trampoline.slug];
  assert.ok(matcher, `${trampoline.slug} must map to Aus-tab catalogue rows`);
  const rows = COMPARE_ROWS.filter((row) =>
    row.brand === matcher.brand
      && row.model === matcher.model
      && (!matcher.size || row.size === matcher.size),
  );
  assert.ok(rows.length > 0, `${trampoline.slug} must resolve to at least one Aus-tab row`);

  const prices = rows.flatMap((row) => row.priceAud === null ? [] : [row.priceAud]);
  assert.ok(prices.length > 0, `${trampoline.slug} must resolve to an Aus-tab price`);
  assert.equal(
    trampoline.priceFrom,
    Math.min(...prices),
    `${trampoline.slug} price must come from the Aus tab`,
  );
  assert.equal(
    trampoline.meetsAUStandards,
    rows.every((row) => row.meetsAuStd),
    `${trampoline.slug} standard status must come from the Aus tab`,
  );
  assert.ok(
    !Object.keys(trampoline.matchReasons).some((key) => key.startsWith('budget_')),
    `${trampoline.slug} must not contain an authored budget reason`,
  );
}

const flare = requireQuizModel('vuly-flare');
const expectedFlareLabels = COMPARE_ROWS
  .filter((row) => row.brand === 'Vuly' && row.model === 'Flare')
  .map((row) => `${row.size} (${row.overallDiamCm}cm overall)`);
assert.deepEqual(
  flare.sizeOptions?.map((option) => option.displayLabel),
  expectedFlareLabels,
  'Flare recommendations must use the current M/L catalogue sizes',
);
assert.equal(getRecommendedSizeDisplay(flare, 'small'), expectedFlareLabels[0]);
assert.equal(getRecommendedSizeDisplay(flare, 'large'), expectedFlareLabels.at(-1));

const aconAir = requireQuizModel('acon-air-gen2');
const unconstrainedAcon = resolveTrampolineForAnswers(aconAir, baseAnswers);
assert.deepEqual(
  unconstrainedAcon.sizeOptions?.map((option) => option.displayLabel),
  ['12ft', '14ft', '15ft'],
  'ACON Air should retain every size when standards are not required',
);
assert.equal(getRecommendedSizeDisplay(unconstrainedAcon, 'medium'), '12ft');

const standardsAcon = resolveTrampolineForAnswers(aconAir, {
  ...baseAnswers,
  standards: 'yes',
});
assert.deepEqual(
  standardsAcon.sizeOptions?.map((option) => option.displayLabel),
  ['14ft', '15ft'],
  'ACON Air 12ft must be excluded when confirmed Australian compliance is required',
);
assert.equal(
  standardsAcon.priceFrom,
  Math.min(...(standardsAcon.sizeOptions ?? []).map((option) => option.priceAud)),
);
assert.equal(getRecommendedSizeDisplay(standardsAcon, 'medium'), '14ft');

const jumpflexFlex10 = requireQuizModel('jumpflex-flex-10ft');
const currentPriceReasons = selectMatchReasons(asScored(jumpflexFlex10, 'small'), {
  ...baseAnswers,
  backyardSize: 'small',
  budget: ['500-1000'],
}, 'AU');
assert.ok(
  currentPriceReasons.includes(
    `From $${jumpflexFlex10.priceFrom.toLocaleString('en-AU')} AUD — within your selected budget range`,
  ),
  'Budget reasons must use the current Aus-tab price',
);

const overBudgetOz = requireQuizModel('oz-summit-8ft');
const overBudgetReasons = selectMatchReasons(asScored(overBudgetOz, 'small'), {
  ...baseAnswers,
  backyardSize: 'small',
  standards: 'yes',
  springType: 'traditional',
  budget: ['under-500'],
  priorities: ['value'],
}, 'AU');
assert.ok(
  !overBudgetReasons.some((reason) => /selected budget|under \$500/i.test(reason)),
  'An over-budget recommendation must never claim to fit the selected budget',
);

console.log('\nQuiz accuracy assertions passed.');
