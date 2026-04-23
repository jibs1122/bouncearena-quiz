import SiteHeader from '@/components/SiteHeader';
import { getAnalyticsStatus, readAnalytics } from '@/lib/analytics';
import { resolveQuizCountry } from '@/lib/geolocation';
import { links, type LinkSlug } from '@/lib/links';
import { buildQuestions } from '@/lib/quiz';
import { budgetRanges } from '@/lib/scoring';
import { trampolines } from '@/lib/trampolines';
import CompareAffiliateToggle from '@/components/CompareAffiliateToggle';

const questions = buildQuestions('AU');
const usQuestions = buildQuestions('US');
const priorityKeys = ['bounce', 'durability', 'value', 'assembly', 'warranty'] as const;

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
    backyardSize: ['small', 'medium', 'large', 'long-narrow', 'not-sure'],
    standards: ['yes', 'no'],
    safetyFeatures: ['essential', 'nice-to-have', 'not-important'],
    springType: ['traditional', 'springless', 'not-sure'],
    budget: Object.keys(budgetRanges),
    priorities: {
      allowed: priorityKeys,
      maxUsedByScoring: 2,
    },
  },
  scoringFunctionsInOrder: [
    {
      name: 'scoreSize',
      rules: [
        'backyardSize=not-sure: +12 if fitsYard.medium, else +8 if fitsYard.small, else -20 if fitsYard.large, else -10 if fitsYard.longNarrow, else -20.',
        'backyardSize=long-narrow: +40 for shape oval or rectangle, -10 for square, -20 for round.',
        'backyardSize=small/medium/large: +30 if matching fitsYard flag is true, otherwise -100 hard exclusion.',
      ],
    },
    {
      name: 'scoreStandards',
      rules: [
        'standards=no: 0.',
        'standards=yes and resolved country AU: +20 if meetsAUStandards true, otherwise -50.',
        'standards=yes and resolved country US: +20 if meetsUSStandards true, otherwise -50.',
      ],
    },
    {
      name: 'scoreSafety',
      rules: [
        'safetyFeatures=essential: +30 if advancedSafety true, otherwise -30.',
        'safetyFeatures=nice-to-have: +10 if advancedSafety true, otherwise 0.',
        'safetyFeatures=not-important: 0.',
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
      name: 'scoreBudget',
      rules: [
        'budget=flexible: 0.',
        'priceFrom within selected min/max budget range: +25.',
        'priceFrom below selected budget range: 0. There is intentionally no below-budget bonus.',
        'priceFrom above selected max but <= 1.5x selected max: -30.',
        'priceFrom above 1.5x selected max: -100 hard exclusion.',
      ],
    },
    {
      name: 'scorePriorities',
      rules: [
        'Use only priorities.slice(0, 2).',
        'For each selected priority add trampoline.metricScores[priority] * 2.',
        'Safety is intentionally not a priority option; safety is scored only by safetyFeatures.',
      ],
    },
  ],
  hardExclusionRules: [
    'A model is hard excluded before raw scoring if scoreSize <= -100.',
    'A model is hard excluded before raw scoring if scoreSpringType <= -100.',
    'A model is hard excluded before raw scoring if scoreBudget <= -100.',
    'Standards failure is not a hard exclusion in the main scorer; it applies -50 and may still pass if the total remains > 0.',
  ],
  normalRanking: [
    'Eligible models are models from getEligibleTrampolines(country), filtered by availableIn after resolving country.',
    'rawScore = scoreSize + scoreStandards + scoreSafety + scoreSpringType + scoreBudget + scorePriorities.',
    'After scoring, keep only models where rawScore > 0.',
    'Sort by rawScore descending, then priceFrom ascending.',
    'Return the top 3 after Vuly tiebreak logic.',
  ],
  lowSignalFallback: [
    'If countSignals(answers) <= 1, bypass normal score ranking and use getDiverseRecommendations.',
    'Signals counted: backyardSize is not not-sure; standards yes; safetyFeatures essential; springType not not-sure; budget not flexible; priorities length > 0.',
    'Fallback pool removes hard exclusions, removes negative budget fit, removes standards failures when standards=yes.',
    'Fallback sorts by baseMeritScore descending then priceFrom ascending.',
    'baseMeritScore = bounce + durability + value + assembly + warranty + 3 if advancedSafety.',
    'Fallback tries to pick one springless model, one traditional model from a new brand, and then another new-brand model before filling remaining slots.',
  ],
  vulyBias: [
    'Vuly receives no score bonus.',
    'After normal sorting only: find top Vuly and top non-Vuly.',
    'If top Vuly rawScore exactly equals top non-Vuly rawScore, promote that Vuly model to #1.',
    'If Vuly is already ahead, no change. If Vuly trails by any amount, no promotion.',
    'Low-signal fallback does not call applyVulyBias.',
  ],
  recommendedSizeDisplay: [
    'Single-size models return displaySize.',
    'Multi-size models choose closest numeric size in trampoline.sizes to target feet.',
    'Targets: small=8ft, medium=12ft, large=14ft, long-narrow=12ft, not-sure=12ft.',
  ],
  resultBehavior: [
    'On final priorities answer, app/quiz/page.tsx computes recommendations.',
    'If top result is Vuly and a link exists, it opens that affiliate link in a new tab synchronously, then navigates to /results with encoded answers.',
    'Results page parses URL params with parseAnswers; invalid params fall back to a retake prompt.',
    'Results page records one quiz completion through /api/analytics/quiz-completion.',
    'Retake link points to /quiz/.',
  ],
  matchReasonSelection: [
    'selectMatchReasons returns up to 4 reasons.',
    'Order: spring type preference, backyard size fit, safety preference, standards compliance, budget fit, selected priorities.',
    'Priority reason keys map value -> valueForMoney; other priorities map directly where available.',
  ],
};

function summarizeQuestions(sourceQuestions: typeof questions) {
  return sourceQuestions.map((question, index) => ({
    step: index + 1,
    id: question.id,
    type: question.type,
    maxSelect: question.maxSelect ?? null,
    title: question.title,
    subtitle: question.subtitle ?? null,
    subtitleExtra: question.subtitleExtra ?? null,
    affiliateLink: question.affiliateLink ?? null,
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label,
      description: option.description ?? null,
    })),
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
        'The old user-type/who-is-it-for step has been removed.',
        'There are currently 6 questions.',
        'The safety priority was removed to avoid double-counting safety; safety is scored through safetyFeatures only.',
        'Vuly bias is tie-break only, not a score boost.',
        'Below-budget bonus was removed.',
      ],
      australiaVsUsQuizDifferences: {
        countryResolution:
          'detectCountry returns AU/US/OTHER from localStorage override or Vercel geo cookie. resolveQuizCountry maps US to US and maps AU/OTHER to AU.',
        questionFlow:
          'AU and US have the same step IDs, option IDs, order, skip defaults, scoring functions, hard exclusion rules, ranking rules, and priority list.',
        standardsQuestion: {
          AU: {
            title: questions.find((question) => question.id === 'standards')?.title,
            subtitle: questions.find((question) => question.id === 'standards')?.subtitle,
            scoringFieldUsedWhenStandardsYes: 'meetsAUStandards',
          },
          US: {
            title: usQuestions.find((question) => question.id === 'standards')?.title,
            subtitle: usQuestions.find((question) => question.id === 'standards')?.subtitle,
            scoringFieldUsedWhenStandardsYes: 'meetsUSStandards',
          },
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
          'getLink resolves country-specific destinations where available. Vuly links are affiliate links for AU and US. Most non-Vuly product links are AU-only; if a US destination is absent, getLink falls back according to lib/links.ts behavior.',
      },
      questionsByCountry: {
        AU: summarizeQuestions(questions),
        US: summarizeQuestions(usQuestions),
      },
      skipDefaultsInQuizPage: {
        safetyFeatures: 'nice-to-have',
        springType: 'not-sure',
        backyardSize: 'not-sure',
        standards: 'no',
        budget: 'flexible',
        priorities: [],
      },
      budgetRanges,
      scoringSpec,
      modelPool,
      redirectAndExternalLinkMap: linkEntries,
      auditChecklistForLLM: [
        'Check whether scoring weights overweight or underweight any factor relative to user intent.',
        'Check whether hard exclusions remove reasonable alternatives.',
        'Check whether standards scoring is too harsh or too weak for AU vs US.',
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
          <p className="text-sm text-black/50 mb-5">Controls how "View best price" links behave on the Compare page.</p>
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
                  {question.options.map((option) => (
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
                <li>Budget score: <strong className="text-black">+25</strong> if in range, <strong className="text-black">0</strong> if under budget, <strong className="text-black">-30</strong> if over, <strong className="text-black">-100</strong> if &gt;1.5× max (hard exclusion).</li>
                <li>Safety: essential + advanced = <strong className="text-black">+30</strong>; essential + no advanced = <strong className="text-black">-30</strong>; nice-to-have + advanced = <strong className="text-black">+10</strong>.</li>
                <li>Spring type: match = <strong className="text-black">+40</strong>, mismatch = <strong className="text-black">-100</strong> (hard exclusion), not-sure = <strong className="text-black">0</strong>.</li>
                <li>Size: fits yard = <strong className="text-black">+30</strong>, doesn&apos;t fit = <strong className="text-black">-100</strong> (hard exclusion). Not-sure yard now lightly prefers compact and mid-size models instead of skipping fit checks. Oval gets +40 for long-narrow yards.</li>
                <li>Each selected priority contributes <strong className="text-black">rating × 2</strong> points (max 2 priorities).</li>
                <li>Standards: required + meets = <strong className="text-black">+20</strong>, required + fails = <strong className="text-black">-50</strong>.</li>
                <li>Low-signal answers now return a more diverse top 3 instead of defaulting to the cheapest models.</li>
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

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-3">Priority scores</h3>
              <ul className="space-y-1.5 text-sm text-black/55">
                {priorityKeys.map((p) => (
                  <li key={p}>
                    <span className="font-medium text-black">{p}</span>: rating × 2 if selected (max 2 priorities)
                  </li>
                ))}
              </ul>
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
                      {priorityKeys.map((priority) => (
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
    </main>
  );
}
