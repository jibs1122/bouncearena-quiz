'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { getLink, normalizeCountry } from '@/lib/links';
import {
  buildSummaryText,
  getRecommendations,
  parseAnswers,
  selectMatchReasons,
  type ScoredTrampoline,
  type QuizAnswers,
} from '@/lib/scoring';

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({
  rec,
  answers,
  country,
  rank,
}: {
  rec: ScoredTrampoline;
  answers: QuizAnswers;
  country: 'AU' | 'US';
  rank: number;
}) {
  const isTop = rank === 1;
  const reasons = selectMatchReasons(rec, answers, country);
  const href = getLink(rec.slug, country);

  return (
    <article
      className={`card-reveal rounded-3xl border bg-white overflow-hidden ${
        isTop
          ? 'border-2 border-[#38b1ab]'
          : 'border border-black/[0.08]'
      }`}
      style={{
        animationDelay: `${(rank - 1) * 80}ms`,
        boxShadow: isTop
          ? '0 6px 32px rgba(56,177,171,0.13)'
          : '0 2px 12px rgba(0,0,0,0.04)',
      }}
    >
      {/* Mobile: image on top, content below. sm+: image left, content right */}
      <div className="flex flex-col sm:flex-row">
        {/* Product image */}
        <div className={`relative flex-shrink-0 bg-white flex items-center justify-center ${isTop ? 'h-52 sm:h-auto sm:w-64' : 'h-44 sm:h-auto sm:w-52'}`}>
          {rec.image ? (
            <Image
              src={rec.image}
              alt={`${rec.brand} ${rec.displayName}`}
              fill
              className="object-contain p-5"
              sizes="(max-width: 640px) 100vw, 256px"
            />
          ) : (
            <span className="text-xs text-black/25 p-5">Image coming soon</span>
          )}
        </div>

        {/* Content */}
        <div className={`flex-1 min-w-0 ${isTop ? 'p-5 sm:p-6' : 'p-4 sm:p-5'}`}>
          {/* Badge */}
          {isTop && (
            <div className="mb-3">
              <span className="inline-block bg-[#38b1ab] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Your top match
              </span>
            </div>
          )}

          {/* Name + meta */}
          <h2 className={`font-bold text-black leading-tight ${isTop ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
            {rec.brand} {rec.displayName}
          </h2>
          <p className="text-xs text-black/40 mt-1">
            {rec.springType === 'springless' ? 'Springless' : 'Traditional spring'} ·{' '}
            {rec.recommendedSizeDisplay} · From ${rec.priceFrom.toLocaleString()} AUD
          </p>

          {/* Match reasons */}
          {reasons.length > 0 && (
            <ul className={`space-y-1.5 ${isTop ? 'mt-4' : 'mt-3'}`}>
              {reasons.map((reason, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-black/60 leading-snug"
                >
                  <span className="text-[#38b1ab] mt-0.5 flex-shrink-0">✓</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}

          {/* CTA */}
          <div className={isTop ? 'mt-5' : 'mt-4'}>
            {href && (
              <>
                <a
                  href={href}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#38b1ab] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#2e9a94] transition-colors active:scale-95"
                >
                  View on {rec.brand} →
                </a>
                <p className="mt-1.5 text-xs text-black/30">Opens product page in a new tab</p>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Main results component ───────────────────────────────────────────────────

function ResultsContent() {
  const searchParams = useSearchParams();
  const answers = useMemo(() => parseAnswers(searchParams), [searchParams]);
  const trackedRef = useRef(false);

  const recommendations = useMemo(
    () => (answers ? getRecommendations(answers) : []),
    [answers],
  );

  if (!answers) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-5">
        <div className="max-w-md rounded-3xl border border-black/[0.08] p-8 text-center">
          <h1 className="text-2xl font-bold text-black">Quiz answers are missing</h1>
          <p className="mt-3 text-black/50 leading-7">
            Head back and complete the quiz so we can find your best matches.
          </p>
          <Link
            href="/quiz/"
            className="mt-6 inline-flex rounded-xl bg-[#38b1ab] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2e9a94] transition-colors"
          >
            Retake the quiz
          </Link>
        </div>
      </main>
    );
  }

  const resolvedCountry = normalizeCountry(answers.country);
  const queryKey = searchParams.toString();

  useEffect(() => {
    if (trackedRef.current || !answers) return;

    const storageKey = `ba-quiz-tracked:${queryKey}`;
    try {
      if (sessionStorage.getItem(storageKey) === '1') {
        trackedRef.current = true;
        return;
      }
    } catch {}

    trackedRef.current = true;

    void fetch('/api/analytics/quiz-completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country: resolvedCountry,
        topResultSlug: recommendations[0]?.slug ?? null,
      }),
      keepalive: true,
    }).finally(() => {
      try {
        sessionStorage.setItem(storageKey, '1');
      } catch {}
    });
  }, [answers, queryKey, recommendations, resolvedCountry]);

  return (
    <main className="min-h-screen bg-white text-black">
      <SiteHeader active="quiz" />

      <section className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#38b1ab]/10 px-3.5 py-1.5 mb-4">
            <span className="text-[#38b1ab] text-sm font-semibold">Quiz complete ✓</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
            {recommendations.length === 1
              ? 'Your Trampoline Match'
              : 'Your Trampoline Matches'}
          </h1>
          <p className="mt-3 text-base leading-7 text-black/50 max-w-xl">
            {buildSummaryText(answers)}
          </p>
        </div>

        {/* No results */}
        {recommendations.length === 0 && (
          <div className="rounded-3xl border border-black/[0.08] p-8 text-center">
            <p className="text-black/50 leading-7">
              No trampolines matched your exact criteria. Try adjusting your budget or spring
              preference.
            </p>
            <Link
              href="/quiz/"
              className="mt-5 inline-flex rounded-xl bg-[#38b1ab] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2e9a94] transition-colors"
            >
              Retake the quiz
            </Link>
          </div>
        )}

        {/* Recommendation cards */}
        {recommendations.length > 0 && (
          <div className="space-y-6">
            {recommendations.map((rec, i) => (
              <ResultCard
                key={rec.id}
                rec={rec}
                answers={answers}
                country={resolvedCountry}
                rank={i + 1}
              />
            ))}
          </div>
        )}

        {/* ── Bottom section ── */}
        {recommendations.length > 0 && (
          <div className="mt-12 border-t border-black/[0.06] pt-6 space-y-5">
            <div className="text-center">
              <Link
                href="/quiz/"
                className="text-sm text-black/30 underline underline-offset-4 hover:text-black/60 transition-colors"
              >
                ← Retake the quiz
              </Link>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="flex items-center gap-3 text-sm text-black/40">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading your results...
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
