import SiteHeader from '@/components/SiteHeader';
import { getAnalyticsStatus, readAnalytics } from '@/lib/analytics';
import { links, type LinkSlug } from '@/lib/links';
import { buildQuestions } from '@/lib/quiz';
import { budgetRanges } from '@/lib/scoring';
import { trampolines } from '@/lib/trampolines';
import CompareAffiliateToggle from '@/components/CompareAffiliateToggle';

const questions = buildQuestions('AU');
const priorityKeys = ['bounce', 'durability', 'value', 'assembly', 'warranty'] as const;

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
              Full quiz logic
            </summary>
            <div className="mt-4 space-y-4 text-sm leading-7 text-black/55">
              <p>
                The quiz ranks every eligible trampoline in <code className="rounded bg-black/[0.05] px-1.5 py-0.5 text-xs">lib/trampolines.ts</code>.
                Core scoring lives in <code className="rounded bg-black/[0.05] px-1.5 py-0.5 text-xs">lib/scoring.ts</code>.
                Questions are defined in <code className="rounded bg-black/[0.05] px-1.5 py-0.5 rounded text-xs">lib/quiz.ts</code>.
              </p>
              <ul className="space-y-2">
                <li>Country filter: only models available in the resolved country enter the scoring pool.</li>
                <li>Hard exclusions: size mismatch, spring-type mismatch, and major budget overruns short-circuit the model before ranking.</li>
                <li>Size scoring: small/medium/large uses the trampoline&apos;s <code className="rounded bg-black/[0.05] px-1.5 py-0.5 text-xs">fitsYard</code> flags. Long-narrow strongly prefers oval and rectangle shapes. Not-sure yard now softly prefers compact or medium-fit models and penalises oversized ones.</li>
                <li>Standards scoring: only applied when the user says standards matter. AU users check <code className="rounded bg-black/[0.05] px-1.5 py-0.5 text-xs">meetsAUStandards</code>; US users check <code className="rounded bg-black/[0.05] px-1.5 py-0.5 text-xs">meetsUSStandards</code>.</li>
                <li>Safety scoring: only the dedicated safety question affects safety weighting. There is no separate safety priority any more.</li>
                <li>Budget scoring: in-range = +25, below budget = 0, moderately above = -30, extreme above = -100.</li>
                <li>Priority scoring: up to two priorities are used, each contributing <code className="rounded bg-black/[0.05] px-1.5 py-0.5 text-xs">metricScores[priority] × 2</code>.</li>
                <li>Low-signal fallback: if the user gives almost no signals, the quiz returns a deliberately broader top 3 instead of simply sorting by cheapest.</li>
                <li>Ranking: passing models are sorted by raw score, then lower <code className="rounded bg-black/[0.05] px-1.5 py-0.5 text-xs">priceFrom</code> on ties.</li>
                <li>Vuly tiebreak: only on an exact dead heat with the top non-Vuly model, Vuly is promoted to #1.</li>
                <li>Recommended size display: for multi-size families, the UI picks the closest size to an 8ft small-yard target, 12ft medium-yard target, and 14ft large-yard target.</li>
                <li>Price syncing: quiz <code className="rounded bg-black/[0.05] px-1.5 py-0.5 text-xs">priceFrom</code> values are refreshed from compare data where a slug-to-model match exists, so the quiz no longer depends only on stale hardcoded prices.</li>
              </ul>
            </div>
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
