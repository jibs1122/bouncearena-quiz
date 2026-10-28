import Footer from '@/components/Footer';
import SiteHeader from '@/components/SiteHeader';
import { getAnalyticsStatus, readAnalytics } from '@/lib/analytics';
import { resolveQuizCountry } from '@/lib/geolocation';
import { links, type LinkSlug } from '@/lib/links';
import { buildQuestions } from '@/lib/quiz';
import { ageGroups, backyardSizes, budgetRanges, jumperCounts, shapeChoices, springChoices, standardsChoices } from '@/lib/scoring';
import { trampolines } from '@/lib/trampolines';
import CompareAffiliateToggle from '@/components/CompareAffiliateToggle';

const questions = buildQuestions('AU');
const usQuestions = buildQuestions('US');
const metricKeys = ['bounce', 'durability', 'value', 'warranty'] as const;

const scoringSpec = {
  sourceFiles: {
    questionDefinitions: 'lib/quiz.ts',
    scoringEngine: 'lib/scoring.ts',
    modelPool: 'lib/trampolines.ts',
    linkMap: 'lib/links.ts',
    quizPage: 'app/quiz/page.tsx',
    resultsPage: 'app/results/page.tsx',
  },
  answerSchema: {
    country: ['AU', 'US', 'OTHER'],
    resolvedCountryRule: 'resolveQuizCountry(country): US stays US; AU and OTHER resolve to AU.',
    backyardSize: backyardSizes,
    ages: ageGroups,
    jumpers: jumperCounts,
    shape: shapeChoices,
    springType: springChoices,
    standards: standardsChoices,
    budget: {
      allowed: Object.keys(budgetRanges),
      rule: 'The quiz asks for one range. Older results URLs with two neighbouring ranges still parse.',
    },
  },
  scoringFunctionsInOrder: [
    {
      name: 'scoreSize',
      rules: [
        'backyardSize=not-sure: +12 if fitsYard.medium, else +8 if fitsYard.small, else -20 if fitsYard.large, else -10 if fitsYard.longNarrow, else -20.',
        'backyardSize=long-narrow: +40 for shape oval or rectangle, -10 for square, -20 for round.',
        'backyardSize=small/medium/large: yard tier small=1, medium=2, large=3. A model fits if any fitsYard tier is <= the yard tier; otherwise -100 hard exclusion.',
        'Target tier = yard tier, except jumpers=1-2 caps it at medium (2).',
        'Model offers the target tier: +30. Fits but only in bigger tiers than the target: +15. One tier smaller: +20 for 1-2 jumpers, otherwise +5. Two tiers smaller (small-only model, large yard, 3+ jumpers): -100.',
      ],
    },
    {
      name: 'scoreUsers',
      rules: [
        'ages=under-8: springless +35; traditional with advancedSafety 0; other traditional -15.',
        'ages=8-12: traditional with advancedSafety +30; other traditional +15; springless 0.',
        'ages=teens: rectangle +35, square +25, oval +5, round 0; -15 more if the largest size is under 10ft.',
        'ages=mixed: +15 if springless or advancedSafety, otherwise 0.',
        'ages=not-sure: 0.',
      ],
    },
    {
      name: 'scoreShape',
      rules: [
        'shape=no-preference: 0.',
        'shape=round: round +40, oval +15, rectangle/square -100 hard exclusion.',
        'shape=rectangle: rectangle +40, square +30, round/oval -100 hard exclusion.',
      ],
    },
    {
      name: 'scoreBudget',
      rules: [
        'budget includes flexible, or no budget is selected: 0.',
        'priceFrom within selected min/max budget range: +25.',
        'priceFrom below selected budget range: 0. There is intentionally no below-budget bonus.',
        'priceFrom above selected max but <= 1.5x selected max: -30.',
        'priceFrom above 1.5x selected max: -100 hard exclusion.',
      ],
    },
    {
      name: 'scoreSpringType',
      rules: [
        'springType=not-sure: 0.',
        'springType=traditional/springless: +40 if trampoline.springType matches, otherwise -100 hard exclusion.',
      ],
    },
    {
      name: 'scoreStandards',
      rules: [
        'standards=no: 0.',
        'standards=yes (question: "Does it need to meet..."): +20 if the model meets the standard for the resolved country, otherwise -100 hard exclusion.',
        'For AU, mixed-status families are first narrowed to their compliant size options (resolveTrampolineForAnswers).',
      ],
    },
  ],
  hardExclusionRules: [
    'A model is hard excluded before raw scoring if scoreSize, scoreShape, scoreBudget, scoreSpringType or scoreStandards is <= -100.',
  ],
  normalRanking: [
    'Eligible models come from getEligibleTrampolines(country), filtered by availableIn after resolving country. Prices and Australian-standard status are derived from the Aus-tab comparison rows.',
    'rawScore = scoreSize + scoreUsers + scoreShape + scoreBudget + scoreSpringType + scoreStandards.',
    'After scoring, keep only models where rawScore > 0.',
    'Sort by rawScore descending, then baseMeritScore descending, then priceFrom ascending.',
    'Return the top 3 after Vuly tiebreak logic and top-two brand diversity.',
  ],
  lowSignalFallback: [
    'If countSignals(answers) <= 1, bypass normal score ranking and use getDiverseRecommendations.',
    'Signals counted: backyardSize is not not-sure; ages is not not-sure; shape is not no-preference; budget does not include flexible; springType is not not-sure; standards is yes.',
    'Fallback pool removes hard exclusions and negative budget fit.',
    'Fallback sorts by scoreShape, then scoreUsers, then scoreSize, then baseMeritScore descending, then priceFrom ascending.',
    'baseMeritScore = bounce + durability + value + warranty + 3 if advancedSafety.',
    'Fallback tries to pick one springless model, one traditional model from a new brand, and then another new-brand model before filling remaining slots.',
  ],
  vulyBias: [
    'Vuly receives no score bonus.',
    'After normal sorting only: find top Vuly and top non-Vuly.',
    'If top Vuly rawScore exactly equals top non-Vuly rawScore, promote that Vuly model to #1.',
    'If Vuly is already ahead, no change. If Vuly trails by any amount, no promotion.',
    'Low-signal fallback does not call applyVulyBias.',
  ],
  brandDiversity: [
    'After Vuly tiebreak logic, if spots 1 and 2 have the same brand, move the highest-scoring later model from a different brand into spot 2.',
    'If no different-brand model exists, keep the same-brand results so the list still reaches three.',
  ],
  closeMatches: [
    'If fewer than three models match every answer (normal or low-signal path), fill the remaining slots from models that still fit the yard and meet a required standard.',
    'Fill-ins relax budget first, then shape, then spring type, closest first; each carries closeMatch labels shown on the results card ("Close match: over your budget").',
    'Normal matches priced over the selected range (up to 1.5x, which the scorer allows) also carry the "Over your budget" label.',
  ],
  recommendedSizeDisplay: [
    'Single-size models return displaySize.',
    'Size-aware families and multi-size models choose the size closest to the target feet.',
    'Targets: small=8ft (10ft for 3+ jumpers), medium=12ft, large=14ft (12ft for 1-2 jumpers), long-narrow=12ft, not-sure=12ft.',
  ],
  resultBehavior: [
    'Tapping a standards answer (the last step) computes recommendations in app/quiz/page.tsx.',
    'If the top result is an affiliate recommendation and a link exists, it opens that affiliate link in a new tab synchronously, then navigates to /results with encoded answers.',
    'Results page parses URL params with parseAnswers; invalid params fall back to a retake prompt.',
    'Results page records one quiz completion through /api/analytics/quiz-completion.',
    'Retake link points to /quiz/.',
  ],
  matchReasonSelection: [
    'selectMatchReasons returns up to 4 reasons, without duplicates.',
    'Order: spring type preference, who-will-use-it fit, shape preference, recommended size for the yard and jumpers, standards compliance (when the model meets it), budget fit.',
    'Budget reasons are generated from the current Aus-tab price and are omitted when a recommendation is over the selected maximum.',
  ],
};

function summarizeQuestions(sourceQuestions: typeof questions) {
  return sourceQuestions.map((question, index) => ({
    step: index + 1,
    id: question.id,
    type: question.type,
    title: question.title,
    why: question.why ?? null,
    links: question.links ?? null,
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label,
      description: option.description ?? null,
    })),
    groups:
      question.groups?.map((group) => ({
        id: group.id,
        label: group.label,
        options: group.options.map((option) => ({ id: option.id, label: option.label })),
      })) ?? null,
  }));
}

function summarizeModelPool() {
  return trampolines.map((trampoline) => ({
    id: trampoline.id,
    slug: trampoline.slug,
    brand: trampoline.brand,
    displayName: trampoline.displayName,
    availableIn: trampoline.availableIn,
    eligibleInResolvedCountry: {
      AU: trampoline.availableIn.includes(resolveQuizCountry('AU')),
      US: trampoline.availableIn.includes(resolveQuizCountry('US')),
      OTHER: trampoline.availableIn.includes(resolveQuizCountry('OTHER')),
    },
    isVuly: trampoline.isVuly,
    springType: trampoline.springType,
    shape: trampoline.shape,
    advancedSafety: trampoline.advancedSafety,
    meetsAUStandards: trampoline.meetsAUStandards,
    meetsUSStandards: trampoline.meetsUSStandards,
    priceFrom: trampoline.priceFrom,
    sizesFt: trampoline.sizes,
    displaySize: trampoline.displaySize,
    sizeOptions: trampoline.sizeOptions ?? null,
    fitsYard: trampoline.fitsYard,
    metricScores: trampoline.metricScores,
    bestFor: trampoline.bestFor,
    matchReasonKeysPresent: Object.keys(trampoline.matchReasons),
  }));
}

function buildLlmQuizAudit() {
  const linkEntries = Object.entries(links).map(([slug, config]) => ({
    slug,
    label: config.label,
    affiliate: config.affiliate,
    destination: config.destination,
  }));
  const modelPool = summarizeModelPool();

  return JSON.stringify(
    {
      artifactPurpose:
        'Paste this into another LLM to audit the current Bounce Arena quiz logic, country differences, scoring, ranking, model pool, and link coverage. Treat it as machine-readable source-of-truth documentation generated from the current admin render.',
      generatedAtRuntime: true,
      quizVersionNotes: [
        'Use-case-first order: backyard size, who will use it (ages + number of jumpers), shape, budget, spring type, standards.',
        'There are currently 6 questions, all single-tap with no Next button.',
        'Safety-features and priorities questions were removed (Oct 2026).',
        'Vuly bias is tie-break only, not a score boost.',
        'Below-budget bonus was removed.',
      ],
      australiaVsUsQuizDifferences: {
        countryResolution:
          'detectCountry returns AU/US/OTHER from localStorage override or Vercel geo cookie. resolveQuizCountry maps US to US and maps AU/OTHER to AU.',
        questionFlow:
          'AU and US have the same step IDs, option IDs, order, skip defaults, scoring functions, hard exclusion rules and ranking rules.',
        standardsQuestion: {
          AU: questions.find((question) => question.id === 'standards')?.title,
          US: usQuestions.find((question) => question.id === 'standards')?.title,
          scoringField: 'meetsAUStandards for AU/OTHER, meetsUSStandards for US.',
        },
        eligibleModelPoolCounts: {
          AU: modelPool.filter((model) => model.eligibleInResolvedCountry.AU).length,
          US: modelPool.filter((model) => model.eligibleInResolvedCountry.US).length,
          OTHER: modelPool.filter((model) => model.eligibleInResolvedCountry.OTHER).length,
        },
        eligibleModelIds: {
          AU: modelPool.filter((model) => model.eligibleInResolvedCountry.AU).map((model) => model.id),
          US: modelPool.filter((model) => model.eligibleInResolvedCountry.US).map((model) => model.id),
          OTHER: modelPool.filter((model) => model.eligibleInResolvedCountry.OTHER).map((model) => model.id),
        },
        linkBehavior:
          'getLink resolves country-specific destinations where available. Vuly links are affiliate links for AU and US. Springfree links are affiliate links for AU. Most other product links are AU-only; if a US destination is absent, getLink falls back according to lib/links.ts behavior.',
      },
      questionsByCountry: {
        AU: summarizeQuestions(questions),
        US: summarizeQuestions(usQuestions),
      },
      skipDefaultsInQuizPage: {
        backyardSize: 'not-sure',
        ages: 'not-sure',
        jumpers: 'not-sure',
        shape: 'no-preference',
        budget: ['flexible'],
        springType: 'not-sure',
        standards: 'no',
      },
      budgetRanges,
      scoringSpec,
      modelPool,
      redirectAndExternalLinkMap: linkEntries,
      auditChecklistForLLM: [
        'Check whether scoring weights overweight or underweight any factor relative to user intent.',
        'Check whether hard exclusions remove reasonable alternatives.',
        'Check whether the ages weights push young families to springless and teens to rectangles without hiding good alternatives.',
        'Check whether low-signal fallback returns a useful spread across brands/types/prices.',
        'Check whether Vuly tie-break behavior is limited to exact dead heats.',
        'Check whether every likely top result has a redirect/link destination.',
        'Check whether model prices, sizes, AU/US availability, and standards flags look stale or inconsistent.',
        'Check whether Springfree/Jumpflex/Lifespan/Kahuna/Oz models are disadvantaged by missing metricScores or matchReasons.',
      ],
    },
    null,
    2,
  );
}

const llmQuizAudit = buildLlmQuizAudit();

function yardFitLabel(key: 'small' | 'medium' | 'large' | 'longNarrow') {
  if (key === 'longNarrow') return 'long-narrow';
  return key;
}

export default async function AdminPage() {
  const analytics = await readAnalytics();
  const analyticsStatus = getAnalyticsStatus();
  const topRedirects = Object.entries(analytics.redirects.bySlug)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const topQuizResults = Object.entries(analytics.quizCompletions.byTopResult)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const quizDays = Object.entries(analytics.quizCompletions.byDay)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 14);

  return (
    <main className="min-h-screen bg-white text-black">
      <SiteHeader active="admin" />
      <section className="mx-auto w-full max-w-6xl space-y-8 px-5 py-8 sm:px-8">

        <div className="rounded-3xl border border-black/[0.08] bg-black/[0.02] p-6">
          <h1 className="text-3xl font-bold tracking-tight">Quiz admin</h1>
          <p className="mt-2 max-w-4xl text-black/50 leading-7">
            Quiz flow, scoring weights, redirect map, and the full trampoline pool.
          </p>
          <p className="mt-3 text-sm text-black/45">
            Access is protected by HTTP basic auth via <code className="rounded bg-black/[0.05] px-1.5 py-0.5 text-xs">ADMIN_USERNAME</code>
            {' '}and <code className="rounded bg-black/[0.05] px-1.5 py-0.5 text-xs">ADMIN_PASSWORD</code>.
            Internal analytics traffic is excluded for localhost/private IPs and any IPs listed in <code className="rounded bg-black/[0.05] px-1.5 py-0.5 text-xs">ANALYTICS_EXCLUDE_IPS</code>.
          </p>
          <p className="mt-2 text-sm text-black/45">
            Analytics storage: <span className="font-medium text-black/75">{analyticsStatus.storageMode === 'kv' ? 'persistent KV' : 'local file fallback'}</span>.
            {analyticsStatus.storageMode === 'file' ? ' Production on Vercel should set KV REST env vars so analytics persist across invocations.' : ''}
          </p>
        </div>

        <section className="rounded-3xl border border-black/[0.08] bg-white p-6">
          <h2 className="text-xl font-bold mb-5">Analytics</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-black/[0.06] bg-black/[0.02] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Redirect clicks</p>
              <p className="mt-2 text-3xl font-bold">{analytics.redirects.total}</p>
            </div>
            <div className="rounded-2xl border border-black/[0.06] bg-black/[0.02] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Quiz completions</p>
              <p className="mt-2 text-3xl font-bold">{analytics.quizCompletions.total}</p>
            </div>
            <div className="rounded-2xl border border-black/[0.06] bg-black/[0.02] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40">AU quiz completions</p>
              <p className="mt-2 text-3xl font-bold">{analytics.quizCompletions.byCountry.AU ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-black/[0.06] bg-black/[0.02] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40">US quiz completions</p>
              <p className="mt-2 text-3xl font-bold">{analytics.quizCompletions.byCountry.US ?? 0}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-3">Top redirect slugs</h3>
              <div className="overflow-hidden rounded-2xl border border-black/[0.07]">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-black/[0.03] text-black/55">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Slug</th>
                      <th className="px-4 py-3 font-semibold">Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRedirects.length === 0 ? (
                      <tr className="border-t border-black/[0.05] text-black/45">
                        <td className="px-4 py-3" colSpan={2}>No redirect analytics yet.</td>
                      </tr>
                    ) : (
                      topRedirects.map(([slug, count]) => (
                        <tr key={slug} className="border-t border-black/[0.05] text-black/55">
                          <td className="px-4 py-3 font-medium text-black/80">/go/{slug}</td>
                          <td className="px-4 py-3">{count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Top quiz outcomes</h3>
              <div className="overflow-hidden rounded-2xl border border-black/[0.07]">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-black/[0.03] text-black/55">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Top result slug</th>
                      <th className="px-4 py-3 font-semibold">Completions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topQuizResults.length === 0 ? (
                      <tr className="border-t border-black/[0.05] text-black/45">
                        <td className="px-4 py-3" colSpan={2}>No quiz completion analytics yet.</td>
                      </tr>
                    ) : (
                      topQuizResults.map(([slug, count]) => (
                        <tr key={slug} className="border-t border-black/[0.05] text-black/55">
                          <td className="px-4 py-3 font-medium text-black/80">{slug}</td>
                          <td className="px-4 py-3">{count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-3">Recent quiz completions by day</h3>
            <div className="overflow-hidden rounded-2xl border border-black/[0.07]">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-black/[0.03] text-black/55">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Completions</th>
                  </tr>
                </thead>
                <tbody>
                  {quizDays.length === 0 ? (
                    <tr className="border-t border-black/[0.05] text-black/45">
                      <td className="px-4 py-3" colSpan={2}>No daily quiz data yet.</td>
                    </tr>
                  ) : (
                    quizDays.map(([day, count]) => (
                      <tr key={day} className="border-t border-black/[0.05] text-black/55">
                        <td className="px-4 py-3 font-medium text-black/80">{day}</td>
                        <td className="px-4 py-3">{count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Compare table settings */}
        <section className="rounded-3xl border border-black/[0.08] bg-white p-6">
          <h2 className="text-xl font-bold mb-1">Compare table settings</h2>
          <p className="text-sm text-black/50 mb-5">Controls how &quot;View best price&quot; links behave on the Compare page.</p>
          <CompareAffiliateToggle />
        </section>

        {/* Flow */}
        <section className="rounded-3xl border border-black/[0.08] bg-white p-6">
          <h2 className="text-xl font-bold mb-5">Question flow (AU version)</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {questions.map((question, index) => (
              <div key={question.id} className="rounded-2xl border border-black/[0.07] bg-black/[0.02] p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#38b1ab] mb-2">
                  Step {index + 1}
                </div>
                <h3 className="font-semibold text-sm leading-snug mb-3">{question.title}</h3>
                <ul className="space-y-1.5 text-xs text-black/50">
                  {(question.groups?.flatMap((group) => group.options) ?? question.options).map((option) => (
                    <li key={option.id}>
                      <span className="font-medium text-black/70">{option.label}</span>{' '}
                      <span className="text-black/30">({option.id})</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Weights */}
        <section className="rounded-3xl border border-black/[0.08] bg-white p-6">
          <h2 className="text-xl font-bold mb-5">Scoring weights</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-3">How scoring works</h3>
              <ul className="space-y-2 text-sm text-black/55 leading-7">
                <li>Size: offers the target size = <strong className="text-black">+30</strong>; fits but bigger than 1–2 jumpers need = <strong className="text-black">+15</strong>; one size smaller = <strong className="text-black">+20</strong> for 1–2 jumpers, <strong className="text-black">+5</strong> otherwise; too big for the yard = <strong className="text-black">-100</strong> (hard exclusion). 1–2 jumpers cap the target at medium. Oval/rectangle +40 for long-narrow yards.</li>
                <li>Ages: under 8 → springless <strong className="text-black">+35</strong>, plain spring <strong className="text-black">-15</strong>. 8–12 → spring with safety design <strong className="text-black">+30</strong>, other spring <strong className="text-black">+15</strong>. Teens → rectangle <strong className="text-black">+35</strong>, square <strong className="text-black">+25</strong>. Mixed → springless or safety design <strong className="text-black">+15</strong>.</li>
                <li>Shape: match = <strong className="text-black">+40</strong> (square +30, oval +15 for round), mismatch = <strong className="text-black">-100</strong> (hard exclusion).</li>
                <li>Budget score: <strong className="text-black">+25</strong> if in range, <strong className="text-black">0</strong> if under budget, <strong className="text-black">-30</strong> if over, <strong className="text-black">-100</strong> if &gt;1.5× max (hard exclusion).</li>
                <li>Spring type: match = <strong className="text-black">+40</strong>, mismatch = <strong className="text-black">-100</strong> (hard exclusion), not-sure = <strong className="text-black">0</strong>.</li>
                <li>Standards: required + meets = <strong className="text-black">+20</strong>, required + fails = <strong className="text-black">-100</strong> (hard exclusion).</li>
                <li>Ties break on the model&apos;s merit ratings (bounce + durability + value + warranty), then price.</li>
                <li>Low-signal answers return a diverse top 3 instead of defaulting to the cheapest models.</li>
                <li className="text-[#38b1ab]">Vuly tiebreak: only on an exact dead heat with the top non-Vuly score, Vuly is promoted to #1.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Budget ranges</h3>
              <div className="overflow-hidden rounded-2xl border border-black/[0.07]">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-black/[0.03] text-black/60">
                    <tr>
                      <th className="px-4 py-3 font-semibold">ID</th>
                      <th className="px-4 py-3 font-semibold">Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(budgetRanges).map(([id, [min, max]]) => (
                      <tr key={id} className="border-t border-black/[0.05] text-black/50">
                        <td className="px-4 py-3">{id}</td>
                        <td className="px-4 py-3">
                          ${min.toLocaleString()} → {max >= 999999 ? 'open' : `$${max.toLocaleString()}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <details className="mt-8 rounded-2xl border border-black/[0.07] bg-black/[0.02] p-5">
            <summary className="cursor-pointer list-none font-semibold text-black">
              LLM quiz audit snapshot
            </summary>
            <p className="mt-3 text-sm leading-6 text-black/45">
              Machine-oriented JSON for auditing the current quiz. It includes AU vs US differences,
              scoring rules, hard exclusions, ranking, fallback behaviour, model pool inputs, and link coverage.
            </p>
            <pre className="mt-4 max-h-[42rem] overflow-auto rounded-2xl border border-black/[0.08] bg-gray-950 p-5 text-[11px] leading-5 text-gray-100">
              {llmQuizAudit}
            </pre>
          </details>
        </section>

        {/* Trampolines */}
        <section className="rounded-3xl border border-black/[0.08] bg-white p-6">
          <h2 className="text-xl font-bold mb-5">Trampoline pool ({trampolines.length} models)</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {trampolines.map((t) => (
              <div key={t.id} className="rounded-2xl border border-black/[0.07] p-5">
                <div className="mb-2">
                  <h3 className="font-semibold">
                    {t.brand} {t.displayName}
                  </h3>
                </div>
                <p className="text-sm text-black/45 mb-3">{t.bestFor}</p>
                <div className="grid gap-4 text-xs text-black/55">
                  <div>
                    <p className="mb-2 font-semibold uppercase tracking-wide text-black/35">
                      Scoring inputs
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-black/[0.05] px-2.5 py-1">{t.springType}</span>
                      <span className="rounded-full bg-black/[0.05] px-2.5 py-1">{t.shape}</span>
                      <span className="rounded-full bg-black/[0.05] px-2.5 py-1">
                        {t.advancedSafety ? 'advanced safety' : 'basic safety'}
                      </span>
                      <span className="rounded-full bg-black/[0.05] px-2.5 py-1">
                        AU std {t.meetsAUStandards ? 'yes' : 'no'}
                      </span>
                      <span className="rounded-full bg-black/[0.05] px-2.5 py-1">
                        US std {t.meetsUSStandards ? 'yes' : 'no'}
                      </span>
                      <span className="rounded-full bg-black/[0.05] px-2.5 py-1">
                        from ${t.priceFrom.toLocaleString()}
                      </span>
                      <span className="rounded-full bg-black/[0.05] px-2.5 py-1">
                        sizes {t.sizes.join(', ')} ft
                      </span>
                      <span className="rounded-full bg-black/[0.05] px-2.5 py-1">
                        display {t.displaySize}
                      </span>
                      <span className="rounded-full bg-black/[0.05] px-2.5 py-1">
                        countries {t.availableIn.join(', ')}
                      </span>
                      <span className="rounded-full bg-black/[0.05] px-2.5 py-1">
                        slug {t.slug}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 font-semibold uppercase tracking-wide text-black/35">
                      Yard fit
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(t.fitsYard).map(([yard, fits]) => (
                        <span key={yard} className="rounded-full bg-black/[0.05] px-2.5 py-1">
                          {yardFitLabel(yard as keyof typeof t.fitsYard)}: {fits ? 'yes' : 'no'}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 font-semibold uppercase tracking-wide text-black/35">
                      Priority scores
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {metricKeys.map((priority) => (
                        <span key={priority} className="rounded-full bg-black/[0.05] px-2.5 py-1">
                          {priority} {t.metricScores[priority]}/10
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Redirect map */}
        <section className="rounded-3xl border border-black/[0.08] bg-white p-6">
          <h2 className="text-xl font-bold mb-2">Redirect map</h2>
          <p className="text-sm text-black/45 mb-5">
            Defined in <code className="bg-black/[0.05] px-1.5 py-0.5 rounded text-xs">lib/links.ts</code> ·
            served by <code className="bg-black/[0.05] px-1.5 py-0.5 rounded text-xs">app/go/[slug]/route.ts</code>
          </p>
          <div className="overflow-x-auto overflow-hidden rounded-2xl border border-black/[0.07]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-black/[0.03] text-black/55">
                <tr>
                  <th className="px-4 py-3 font-semibold">Slug</th>
                  <th className="px-4 py-3 font-semibold">Cloaked path</th>
                  <th className="px-4 py-3 font-semibold">AU destination</th>
                  <th className="px-4 py-3 font-semibold">US destination</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(links) as LinkSlug[]).map((slug) => {
                  const link = links[slug];
                  const au = typeof link.destination === 'string' ? link.destination : link.destination.AU;
                  const us =
                    typeof link.destination === 'string'
                      ? link.destination
                      : (link.destination.US ?? '—');

                  return (
                    <tr key={slug} className="border-t border-black/[0.05] align-top text-black/50">
                      <td className="px-4 py-3 font-medium text-black/80">{slug}</td>
                      <td className="px-4 py-3">/go/{slug}</td>
                      <td className="px-4 py-3 break-all text-xs">{au}</td>
                      <td className="px-4 py-3 break-all text-xs">{us}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </section>
      <Footer />
    </main>
  );
}
