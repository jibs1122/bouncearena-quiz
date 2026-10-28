import assert from 'node:assert/strict';
import { TRAMPOLINES as COMPARE_ROWS } from '@/data/trampolines';
import { getLink } from '@/lib/links';
import { buildQuestions } from '@/lib/quiz';
import {
  ageGroups,
  backyardSizes,
  budgetOrder,
  budgetRanges,
  buildSummaryText,
  encodeAnswers,
  getRecommendedSizeDisplay,
  getRecommendations,
  jumperCounts,
  parseAnswers,
  resolveTrampolineForAnswers,
  scoreSize,
  selectMatchReasons,
  shapeChoices,
  springChoices,
  standardsChoices,
  type QuizAnswers,
  type ScoredTrampoline,
} from '@/lib/scoring';
import { compareMatchers, getEligibleTrampolines, trampolines, type Trampoline } from '@/lib/trampolines';

// ─── Scenario printout ────────────────────────────────────────────────────────

const baseAnswers: QuizAnswers = {
  country: 'AU',
  backyardSize: 'medium',
  ages: 'not-sure',
  jumpers: 'not-sure',
  shape: 'no-preference',
  budget: ['flexible'],
  springType: 'not-sure',
  standards: 'no',
};

const scenarios: Array<{ name: string; answers: QuizAnswers }> = [
  { name: 'Young kids, medium yard', answers: { ...baseAnswers, ages: 'under-8', jumpers: '1-2' } },
  { name: 'Young kids, small yard, under $1,000', answers: { ...baseAnswers, backyardSize: 'small', ages: 'under-8', budget: ['500-1000'] } },
  { name: 'Kids 8–12, medium yard, round, $1,000–$1,500', answers: { ...baseAnswers, ages: '8-12', jumpers: '3-plus', shape: 'round', budget: ['1000-1500'] } },
  { name: 'Teens, large yard', answers: { ...baseAnswers, backyardSize: 'large', ages: 'teens', jumpers: '3-plus' } },
  { name: 'Teens, large yard, $1,500–$2,500', answers: { ...baseAnswers, backyardSize: 'large', ages: 'teens', budget: ['1500-2500'] } },
  { name: 'One kid, large yard', answers: { ...baseAnswers, backyardSize: 'large', ages: 'mixed', jumpers: '1-2' } },
  { name: 'Mixed ages, long-narrow yard', answers: { ...baseAnswers, backyardSize: 'long-narrow', ages: 'mixed', budget: ['1000-1500'] } },
  { name: 'Teens, springless, standard required', answers: { ...baseAnswers, backyardSize: 'large', ages: 'teens', springType: 'springless', standards: 'yes' } },
  { name: 'Kids 8–12, traditional, standard required, $1,000–$1,500', answers: { ...baseAnswers, ages: '8-12', budget: ['1000-1500'], springType: 'traditional', standards: 'yes' } },
  { name: 'Skipped everything', answers: { ...baseAnswers, backyardSize: 'not-sure' } },
];

for (const scenario of scenarios) {
  const results = getRecommendations(scenario.answers);
  console.log(`\n## ${scenario.name}`);
  console.log(buildSummaryText(scenario.answers));
  if (results.length === 0) console.log('No results');
  for (const [index, result] of results.entries()) {
    console.log(
      `${index + 1}. ${result.brand} ${result.displayName} | ${result.springType} ${result.shape} | score=${result.rawScore} | $${result.priceFrom} | ${result.recommendedSizeDisplay}`,
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireQuizModel(slug: string): Trampoline {
  const trampoline = trampolines.find((candidate) => candidate.slug === slug);
  assert.ok(trampoline, `Expected quiz model ${slug}`);
  return trampoline;
}

function asScored(trampoline: Trampoline, answers: QuizAnswers): ScoredTrampoline {
  return {
    ...trampoline,
    rawScore: 1,
    finalScore: 1,
    recommendedSizeDisplay: getRecommendedSizeDisplay(trampoline, answers.backyardSize, answers.jumpers),
  };
}

const top = (answers: QuizAnswers) => getRecommendations(answers);

// ─── Catalogue integrity ──────────────────────────────────────────────────────

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
  assert.equal(trampoline.priceFrom, Math.min(...prices), `${trampoline.slug} price must come from the Aus tab`);
  assert.equal(
    trampoline.meetsAUStandards,
    rows.every((row) => row.meetsAuStd),
    `${trampoline.slug} standard status must come from the Aus tab`,
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

// ─── Questions ────────────────────────────────────────────────────────────────

for (const country of ['AU', 'US'] as const) {
  const questions = buildQuestions(country);
  assert.deepEqual(
    questions.map((question) => question.id),
    ['backyardSize', 'users', 'shape', 'budget', 'springType', 'standards'],
    'Use-case-first order: yard, who, shape, budget, then spring type and standards last',
  );
  for (const question of questions) {
    assert.ok(question.type === 'single' || question.type === 'pair', `${question.id} must be tap-to-advance`);
  }
  assert.ok(questions.at(-1)?.submitsQuiz, 'The last question must submit on tap');
  assert.equal(questions.filter((question) => question.submitsQuiz).length, 1, 'Only the last question submits');
  assert.match(questions.at(-1)!.title, /^Does it need to meet/, 'Standards question wording');
  assert.ok(
    !JSON.stringify(questions[0]).match(/\d+\s?ft\b/),
    'The backyard question must use metres, not feet',
  );
  const shapeLinks = questions[2].links?.items ?? [];
  assert.ok(
    shapeLinks.some((link) => link.href.includes('webandwarehouse.com.au/blog/posts/round-vs-rectangle') && link.href.includes('tracking=6a9550e65374c')),
    'The shape question must link the Web and Warehouse guide with the tracking ID',
  );
}
assert.ok(getLink('webandwarehouse-round-vs-rectangle', 'AU'));

// ─── Who will use it ──────────────────────────────────────────────────────────

const youngMedium = top({ ...baseAnswers, ages: 'under-8' });
assert.equal(youngMedium[0]?.springType, 'springless', 'Kids under 8 must get a springless top match');
assert.ok(
  youngMedium.filter((result) => result.springType === 'springless').length >= 2,
  'Kids under 8 must see mostly springless models',
);
assert.ok(
  youngMedium.some((result) => result.brand === 'Springfree') && youngMedium.some((result) => result.brand === 'Vuly'),
  'Kids under 8 must see springless Springfree and Vuly models',
);

const middleRound = top({ ...baseAnswers, ages: '8-12', shape: 'round', budget: ['1000-1500'] });
assert.equal(middleRound[0]?.springType, 'traditional', 'Kids 8–12 must get a spring trampoline first');
assert.ok(middleRound[0]?.advancedSafety, 'Kids 8–12 must get a spring trampoline with a safety design first');

const teensLarge = top({ ...baseAnswers, backyardSize: 'large', ages: 'teens' });
assert.ok(
  teensLarge[0] && ['rectangle', 'square'].includes(teensLarge[0].shape),
  'Teens must get a rectangle or square top match',
);

// Ages only nudge: a stated shape still wins.
const teensRound = top({ ...baseAnswers, backyardSize: 'large', ages: 'teens', shape: 'round' });
assert.ok(teensRound.length > 0 && teensRound.every((result) => result.shape === 'round' || result.shape === 'oval'));

// ─── Number of jumpers and size ───────────────────────────────────────────────

const thunder2 = requireQuizModel('vuly-thunder-2');
assert.equal(getRecommendedSizeDisplay(thunder2, 'large', '1-2'), '12ft', '1–2 jumpers in a large yard get a 12ft');
assert.equal(getRecommendedSizeDisplay(thunder2, 'large', '3-plus'), '14ft', '3+ jumpers in a large yard get a 14ft');
assert.equal(getRecommendedSizeDisplay(thunder2, 'small', '3-plus'), '10ft');

const hero12 = requireQuizModel('jumpflex-hero-12ft');
const hero15 = requireQuizModel('jumpflex-hero-15ft');
assert.ok(
  scoreSize(hero12, 'large', '1-2') > scoreSize(hero15, 'large', '1-2'),
  'One or two jumpers in a large yard must prefer a 12ft over a 15ft',
);
assert.ok(
  scoreSize(hero15, 'large', '3-plus') > scoreSize(hero12, 'large', '3-plus'),
  'Three or more jumpers in a large yard must prefer the bigger trampoline',
);
assert.ok(scoreSize(hero12, 'large', '1-2') > 0, 'A medium trampoline still fits a large yard');
assert.ok(scoreSize(hero15, 'small', '1-2') <= -100, 'A 15ft must never be shown for a small yard');
assert.ok(
  scoreSize(requireQuizModel('springfree-mini-round'), 'large', '3-plus') <= -100,
  'A small-only trampoline is out for 3+ jumpers in a large yard',
);

const oneKidLarge = top({ ...baseAnswers, backyardSize: 'large', ages: 'mixed', jumpers: '1-2' });
assert.ok(
  oneKidLarge.every((result) => !/1[5-9]ft|1[5-9]\b/.test(result.recommendedSizeDisplay)),
  'One or two jumpers in a large yard must not be pointed at 15ft+ trampolines',
);

// ─── Spring type and standards ────────────────────────────────────────────────

const aconAir = requireQuizModel('acon-air-gen2');
assert.deepEqual(
  resolveTrampolineForAnswers(aconAir, baseAnswers).sizeOptions?.map((option) => option.displayLabel),
  ['12ft', '14ft', '15ft'],
  'ACON Air should retain every size when the standard is not required',
);
const standardsAcon = resolveTrampolineForAnswers(aconAir, { ...baseAnswers, standards: 'yes' });
assert.deepEqual(
  standardsAcon.sizeOptions?.map((option) => option.displayLabel),
  ['14ft', '15ft'],
  'ACON Air 12ft must be excluded when the Australian standard is required',
);
assert.equal(
  standardsAcon.priceFrom,
  Math.min(...(standardsAcon.sizeOptions ?? []).map((option) => option.priceAud)),
);

for (const springType of ['traditional', 'springless'] as const) {
  const results = top({ ...baseAnswers, ages: 'under-8', springType });
  assert.ok(
    results.length > 0 && results.every((result) => result.springType === springType || result.closeMatch),
    `springType=${springType} must filter, apart from labelled close matches`,
  );
}
assert.ok(
  top({ ...baseAnswers, backyardSize: 'large', standards: 'yes' }).every((result) => result.meetsAUStandards),
  'A required Australian standard must leave out non-compliant models',
);

// ─── Match reasons ────────────────────────────────────────────────────────────

const jumpflexFlex10 = requireQuizModel('jumpflex-flex-10ft');
const flexAnswers: QuizAnswers = { ...baseAnswers, backyardSize: 'small', budget: ['500-1000'] };
assert.ok(
  selectMatchReasons(asScored(jumpflexFlex10, flexAnswers), flexAnswers, 'AU').includes(
    `From $${jumpflexFlex10.priceFrom.toLocaleString('en-AU')} AUD, within your selected budget range`,
  ),
  'Budget reasons must use the current Aus-tab price',
);

const overBudgetOz = requireQuizModel('oz-summit-8ft');
const overAnswers: QuizAnswers = { ...baseAnswers, backyardSize: 'small', budget: ['under-500'] };
assert.ok(
  !selectMatchReasons(asScored(overBudgetOz, overAnswers), overAnswers, 'AU').some((reason) =>
    /selected budget|under \$500/i.test(reason),
  ),
  'An over-budget recommendation must never claim to fit the selected budget',
);

const thunderAnswers: QuizAnswers = { ...baseAnswers, backyardSize: 'large', ages: 'under-8', jumpers: '1-2' };
const thunderReasons = selectMatchReasons(asScored(thunder2, thunderAnswers), thunderAnswers, 'AU');
assert.ok(thunderReasons.includes(thunder2.matchReasons.springless!), 'Under-8 reason must mention springless');
assert.ok(
  thunderReasons.includes('Recommended size: 12ft for 1 or 2 jumpers in a large yard'),
  'Size reason must match the recommended size',
);
assert.equal(new Set(thunderReasons).size, thunderReasons.length, 'Reasons must not repeat');

// ─── URLs ─────────────────────────────────────────────────────────────────────

const roundTrip: QuizAnswers = { ...baseAnswers, ages: 'teens', jumpers: '3-plus', shape: 'rectangle', budget: ['1500-2500'], springType: 'springless', standards: 'yes' };
assert.deepEqual(parseAnswers(new URLSearchParams(encodeAnswers(roundTrip))), roundTrip);

const legacy = parseAnswers(
  new URLSearchParams(
    'country=AU&backyardSize=medium&shape=round&standards=yes&safetyFeatures=essential&springType=springless&budget=1000-1500,1500-2500&priorities=durability',
  ),
);
assert.ok(legacy, 'Results URLs from the old 7-question quiz must still parse');
assert.equal(legacy.ages, 'not-sure');
assert.equal(legacy.springType, 'springless', 'Old URLs keep their spring type');
assert.equal(legacy.standards, 'yes', 'Old URLs keep their standards answer');
assert.deepEqual(legacy.budget, ['1000-1500', '1500-2500']);
assert.equal(parseAnswers(new URLSearchParams('country=AU&backyardSize=medium&ages=toddlers&budget=flexible')), null);

// ─── Every answer combination ─────────────────────────────────────────────────

let combinations = 0;
const empty: string[] = [];
for (const country of ['AU', 'US'] as const) {
  const pool = new Set(getEligibleTrampolines(country).map((trampoline) => trampoline.id));
  for (const backyardSize of backyardSizes) {
    for (const ages of ageGroups) {
      for (const jumpers of jumperCounts) {
        for (const shape of shapeChoices) {
          for (const budgetId of budgetOrder) {
          for (const springType of springChoices) {
          for (const standards of standardsChoices) {
            const answers: QuizAnswers = { country, backyardSize, ages, jumpers, shape, budget: [budgetId], springType, standards };
            const results = getRecommendations(answers);
            const label = `${country} ${backyardSize}/${ages}/${jumpers}/${shape}/${budgetId}/${springType}/${standards}`;
            combinations += 1;

            assert.ok(results.length <= 3, `${label}: at most 3 results`);
            if (country === 'AU') assert.equal(results.length, 3, `${label}: AU always gets 3 results`);
            assert.equal(new Set(results.map((result) => result.id)).size, results.length, `${label}: no duplicates`);

            for (const result of results) {
              assert.ok(pool.has(result.id), `${label}: ${result.id} must be sold in ${country}`);
              assert.ok(getLink(result.slug, country), `${label}: ${result.slug} needs a link`);
              assert.ok(result.recommendedSizeDisplay, `${label}: ${result.slug} needs a size`);
              const notes = result.closeMatch ?? [];
              const shapeOk =
                shape === 'round' ? ['round', 'oval'].includes(result.shape)
                : shape === 'rectangle' ? ['rectangle', 'square'].includes(result.shape)
                : true;
              assert.ok(shapeOk || notes.some((note) => note.startsWith('Not ')), `${label}: ${result.slug} shape miss must be labelled`);
              if (budgetId !== 'flexible' && result.priceFrom > budgetRanges[budgetId][1]) {
                assert.ok(notes.includes('Over your budget'), `${label}: ${result.slug} over budget must be labelled`);
              }
              if (backyardSize === 'small') assert.ok(result.fitsYard.small, `${label}: ${result.slug} too big`);
              if (backyardSize === 'medium') assert.ok(result.fitsYard.small || result.fitsYard.medium, `${label}: ${result.slug} too big`);
              assert.ok(selectMatchReasons(result, answers, country).length > 0 || backyardSize === 'not-sure', `${label}: reasons`);
              if (springType !== 'not-sure' && result.springType !== springType) {
                assert.ok(notes.some((note) => /springs|Springless/.test(note)), `${label}: ${result.slug} spring miss must be labelled`);
              }
              if (notes.length === 0 && springType !== 'not-sure') assert.equal(result.springType, springType, `${label}: spring type`);
              if (standards === 'yes') {
                assert.ok(country === 'US' ? result.meetsUSStandards : result.meetsAUStandards, `${label}: ${result.slug} standard`);
              }
            }

            if (results.length === 0) empty.push(label);
          }
          }
          }
        }
      }
    }
  }
}

const auEmpty = empty.filter((label) => label.startsWith('AU'));
console.log(`\nChecked ${combinations} answer combinations. Empty results: ${empty.length} (AU ${auEmpty.length}).`);
assert.equal(auEmpty.length, 0, 'Every AU answer set must return results');

console.log('\nQuiz accuracy assertions passed.');
