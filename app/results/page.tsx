'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';
import ModelImage from '@/components/ModelImage';
import { useCopyCode } from '@/components/PromoBell';
import SiteHeader from '@/components/SiteHeader';
import { getLink, getLinkRetailerName, isAffiliateLink, normalizeCountry } from '@/lib/links';
import { outboundRel } from '@/lib/affiliate';
import { getPromoForBrand } from '@/lib/promoCtas';
import {
  buildSummaryText,
  getRecommendations,
  parseAnswers,
  selectMatchReasons,
  type ScoredTrampoline,
  type QuizAnswers,
} from '@/lib/scoring';
import { compareMatchers } from '@/lib/trampolines';

// ─── Promo coupon ─────────────────────────────────────────────────────────────

// Orange is kept for promo codes only, so the code stands apart from the teal
// buttons. #C2410C is the darkest step and passes contrast for small text on white.
function PromoCoupon({
  retailer,
  code,
  copied,
  onCopy,
}: {
  retailer: string;
  code: string;
  copied: boolean;
  onCopy: () => void;
}) {
  // Keep it on one line, sized to the coupon's own width rather than the screen,
  // since the card is narrow on phones and beside the image on tablets. When the
  // shop name won't fit it drops to "Promo code:"; the button above names the shop.
  const fullLabel = FULL_LABEL_AT[retailer.length <= 6 ? 'short' : retailer.length <= 13 ? 'medium' : 'long'];
  return (
    <div className="@container mt-3 w-full max-w-sm">
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? `${code} copied` : `Copy promo code ${code}`}
        className="flex w-full items-center gap-3 rounded-xl border-[1.5px] border-dashed border-[#EA580C] bg-[#FFF4ED] px-3 py-2.5 text-left transition-colors hover:bg-[#FFEDD5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:ring-offset-2 active:scale-[0.99]"
      >
        <span className="min-w-0 flex-1 whitespace-nowrap text-sm leading-5 text-[#9A3412]">
          <span className={fullLabel.short}>Promo code:</span>
          <span className={fullLabel.full}>{retailer} promo code:</span>{' '}
          <span className="font-mono font-bold tracking-[0.06em] text-[#C2410C]">{code}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#9A3412]">
          {copied ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="8" width="12" height="12" rx="2" />
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
            </svg>
          )}
          {/* The smallest phones show the icon alone. */}
          <span className="hidden [@container(min-width:260px)]:inline">{copied ? 'Copied' : 'Copy'}</span>
        </span>
      </button>
    </div>
  );
}

// Coupon width needed for "{shop} promo code: CODE" plus Copy on one line,
// measured at 14px: Vuly 278px, Lifespan Kids 326px, Web and Warehouse 363px.
// Written as min-width container queries: Turbopack drops Tailwind's
// @min-[...] variants, which use the newer (width >= ...) range syntax.
const FULL_LABEL_AT = {
  short: { short: '[@container(min-width:290px)]:hidden', full: 'hidden [@container(min-width:290px)]:inline' },
  medium: { short: '[@container(min-width:340px)]:hidden', full: 'hidden [@container(min-width:340px)]:inline' },
  long: { short: '[@container(min-width:372px)]:hidden', full: 'hidden [@container(min-width:372px)]:inline' },
} as const;

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
  const retailerName = getLinkRetailerName(rec.slug, country) ?? rec.brand;
  // Codes are AU-only, and a retailer code only works when this card links to that retailer.
  const promo = country === 'AU' && href ? getPromoForBrand(rec.brand) : null;
  const promoCode = promo && (!promo.retailer || promo.retailer === retailerName) ? promo.codes[0] : null;
  const { copiedCode, copyCode } = useCopyCode(rec.brand, `results_card_rank_${rank}`);

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
          {href ? (
            // Same destination as the button; many people tap the photo first.
            <a
              href={href}
              target="_blank"
              rel={outboundRel(isAffiliateLink(rec.slug))}
              data-track-location={`results_card_rank_${rank}_image`}
              data-track-label={`${rec.brand} ${rec.displayName} image`}
              aria-label={`View ${rec.brand} ${rec.displayName} on ${retailerName}`}
              className="absolute inset-0"
            >
              <ModelImage
                brand={rec.brand}
                model={compareMatchers[rec.slug]?.model ?? rec.displayName}
                className="object-contain p-5"
                sizes="(max-width: 640px) 100vw, 256px"
              />
            </a>
          ) : (
            <ModelImage
              brand={rec.brand}
              model={compareMatchers[rec.slug]?.model ?? rec.displayName}
              className="object-contain p-5"
              sizes="(max-width: 640px) 100vw, 256px"
            />
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
            {href ? (
              <a
                href={href}
                target="_blank"
                rel={outboundRel(isAffiliateLink(rec.slug))}
                data-track-location={`results_card_rank_${rank}_title`}
                className="hover:text-[#38b1ab] transition-colors"
              >
                {rec.brand} {rec.displayName}
              </a>
            ) : (
              <>{rec.brand} {rec.displayName}</>
            )}
          </h2>
          <p className="text-xs text-black/40 mt-1">
            {rec.springType === 'springless' ? 'Springless' : 'Traditional spring'} ·{' '}
            {rec.recommendedSizeDisplay} · From ${rec.priceFrom.toLocaleString()} AUD
          </p>
          {rec.closeMatch && (
            <p className="mt-2 inline-block rounded-full bg-black/[0.05] px-2.5 py-1 text-xs font-medium text-black/65">
              Close match: {rec.closeMatch.join(' · ').toLowerCase()}
            </p>
          )}

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
                  rel={outboundRel(isAffiliateLink(rec.slug))}
                  data-track-location={`results_card_rank_${rank}`}
                  className="flex w-full items-center justify-center gap-2 bg-[#38b1ab] text-white px-5 py-3 rounded-xl font-semibold text-base hover:bg-[#2e9a94] transition-colors active:scale-95 sm:inline-flex sm:w-auto sm:py-2.5 sm:text-sm"
                >
                  View on {retailerName} →
                </a>
                <p className="mt-1.5 text-xs text-black/30">Opens product page in a new tab</p>
                {promoCode && (
                  <PromoCoupon
                    retailer={retailerName}
                    code={promoCode}
                    copied={copiedCode === promoCode}
                    onCopy={() => copyCode(promoCode)}
                  />
                )}
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

  const resolvedCountry = normalizeCountry(answers?.country);
  const queryKey = searchParams.toString();
  const hasAffiliateRecommendations = recommendations.some(
    (rec) => isAffiliateLink(rec.slug) && getLink(rec.slug, resolvedCountry),
  );

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
          {hasAffiliateRecommendations && (
            <p className="mt-3 text-xs text-black/30">
              This page contains affiliate links and we may earn a commission on purchases.
            </p>
          )}
        </div>

        {/* No results */}
        {recommendations.length === 0 && (
          <div className="rounded-3xl border border-black/[0.08] p-8 text-center">
            <p className="text-black/50 leading-7">
              No trampolines matched every answer. A wider budget range, or &ldquo;Not sure&rdquo; on
              spring type, will bring more options back.
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
      <Footer />
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
