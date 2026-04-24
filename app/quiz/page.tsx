'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CountryDetector from '@/components/CountryDetector';
import ProgressBar from '@/components/ProgressBar';
import QuizQuestion from '@/components/QuizQuestion';
import SiteHeader from '@/components/SiteHeader';
import { detectCountry, type Country } from '@/lib/geolocation';
import { trackOutboundClick, trackQuizComplete, trackQuizStart, trackQuizStep } from '@/lib/gtag';
import { getLink, normalizeCountry } from '@/lib/links';
import { buildQuestions } from '@/lib/quiz';
import { encodeAnswers, getRecommendations, type QuizAnswers } from '@/lib/scoring';
import type { PriorityId } from '@/lib/trampolines';

type PartialQuizAnswers = Partial<QuizAnswers> & { country: Country };

const SKIP_DEFAULTS: Record<string, string | string[]> = {
  safetyFeatures: 'nice-to-have',
  springType: 'not-sure',
  backyardSize: 'not-sure',
  standards: 'no',
  budget: 'flexible',
  priorities: [],
};

function isCompleteAnswers(answers: PartialQuizAnswers): answers is QuizAnswers {
  return Boolean(
    answers.backyardSize &&
      answers.standards &&
      answers.safetyFeatures &&
      answers.springType &&
      answers.budget &&
      Array.isArray(answers.priorities), // allow empty array
  );
}

export default function QuizPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<PartialQuizAnswers>({ country: 'AU', priorities: [] });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [ready, setReady] = useState(false);
  const [previewPriorities, setPreviewPriorities] = useState<PriorityId[]>([]);
  const quizContentRef = useRef<HTMLElement | null>(null);
  const hasMountedQuestionRef = useRef(false);

  const handlePreviewPrioritiesChange = useCallback((vals: string[]) => {
    setPreviewPriorities((current) => {
      if (
        current.length === vals.length &&
        current.every((value, index) => value === vals[index])
      ) {
        return current;
      }

      return vals as PriorityId[];
    });
  }, []);

  useEffect(() => {
    const country = detectCountry();
    setAnswers((current) => ({ ...current, country }));
    setReady(true);
    trackQuizStart(country);
  }, []);

  const questions = useMemo(() => buildQuestions(answers.country), [answers.country]);
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  useEffect(() => {
    if (!ready) return;

    if (!hasMountedQuestionRef.current) {
      hasMountedQuestionRef.current = true;
      return;
    }

    quizContentRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [currentIndex, ready]);

  // Compute whether top result is Vuly when on the priorities question.
  // Used to conditionally show the "Opens your top match in a new tab" disclaimer.
  const topResultIsVuly = useMemo(() => {
    if (currentQuestion.id !== 'priorities') return false;
    if (
      !answers.backyardSize ||
      !answers.standards ||
      !answers.safetyFeatures ||
      !answers.springType ||
      !answers.budget
    )
      return false;
    const preview = { ...answers, priorities: previewPriorities } as QuizAnswers;
    const top = getRecommendations(preview)[0];
    return top?.isVuly ?? false;
  }, [answers, previewPriorities, currentQuestion.id]);

  function selectedValues(questionId: string): string[] {
    if (questionId === 'priorities') return answers.priorities ?? [];
    const value = answers[questionId as keyof PartialQuizAnswers];
    return typeof value === 'string' ? [value] : [];
  }

  function updateCountry(country: Country) {
    setAnswers((current) => ({ ...current, country }));
  }

  function goBack() {
    if (currentIndex === 0) return;
    setDirection('back');
    setCurrentIndex((current) => Math.max(0, current - 1));
  }

  function submitAndNavigate(nextAnswers: QuizAnswers) {
    const country = normalizeCountry(nextAnswers.country);
    const topResults = getRecommendations(nextAnswers);
    const top = topResults[0];

    trackQuizComplete({ country, topResult: top?.slug ?? null });

    // Only open a tab if the top result is Vuly (affiliate).
    // Must stay synchronous in the click handler — no await, no setTimeout.
    if (top?.isVuly) {
      const href = getLink(top.slug, country);
      if (href) {
        trackOutboundClick({ url: href, label: `View on ${top.brand}`, location: 'quiz_auto_open' });
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    }

    router.push(`/results?${encodeAnswers(nextAnswers)}`);
  }

  function handleAnswer(value: string | string[]) {
    const questionId = currentQuestion.id;
    const nextAnswers: PartialQuizAnswers = { ...answers };

    if (questionId === 'priorities') {
      nextAnswers.priorities = value as PriorityId[];
    } else {
      (nextAnswers as Record<string, unknown>)[questionId] = value;
    }

    trackQuizStep({
      stepNumber: currentIndex + 1,
      questionId,
      answerValue: Array.isArray(value) ? value.join(',') : value,
      skipped: false,
    });

    setAnswers(nextAnswers);

    if (questionId === 'priorities') {
      if (!isCompleteAnswers(nextAnswers)) return;
      submitAndNavigate(nextAnswers);
      return;
    }

    setDirection('forward');
    setCurrentIndex((current) => Math.min(questions.length - 1, current + 1));
  }

  function handleSkip() {
    const questionId = currentQuestion.id;
    const skipValue = SKIP_DEFAULTS[questionId] ?? 'not-sure';
    const nextAnswers: PartialQuizAnswers = { ...answers };

    if (questionId === 'priorities') {
      nextAnswers.priorities = [];
    } else {
      (nextAnswers as Record<string, unknown>)[questionId] = skipValue;
    }

    trackQuizStep({
      stepNumber: currentIndex + 1,
      questionId,
      answerValue: '(skipped)',
      skipped: true,
    });

    setAnswers(nextAnswers);

    if (questionId === 'priorities') {
      if (!isCompleteAnswers(nextAnswers)) return;
      submitAndNavigate(nextAnswers);
      return;
    }

    setDirection('forward');
    setCurrentIndex((current) => Math.min(questions.length - 1, current + 1));
  }

  if (!ready) {
    return (
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
          Loading quiz...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <SiteHeader active="quiz" />
      <CountryDetector country={answers.country} onCountryChange={updateCountry} />

      <section ref={quizContentRef} className="scroll-mt-20 mx-auto w-full max-w-3xl px-5 py-8 sm:px-8">
        {currentIndex === 0 && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
              Trampoline quiz - find the right option for your family
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-black/55">
              Answer 6 quick questions and we&apos;ll match you with the right trampoline for your
              family — based on your safety priorities, spring preference, backyard size, and budget.
            </p>
          </div>
        )}

        {/* Progress row */}
        <div className="mb-5 flex items-center gap-4">
          <div className="flex-1">
            <ProgressBar value={progress} />
          </div>
          <div className="text-xs font-medium text-black/35 tabular-nums whitespace-nowrap">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>

        {/* Affiliate disclaimer — only on first question, above the heading */}
        {currentIndex === 0 && (
          <p className="mb-4 text-xs text-black/30">
            This quiz contains affiliate links and we may earn a commission on purchases.
          </p>
        )}

        {/* Question */}
        <div
          key={currentQuestion.id}
          className={direction === 'back' ? 'question-enter-back' : 'question-enter-forward'}
        >
          <QuizQuestion
            question={currentQuestion}
            stepNumber={currentIndex + 1}
            selected={selectedValues(currentQuestion.id)}
            onAnswer={handleAnswer}
            onSkip={handleSkip}
            onSelectionChange={
              currentQuestion.id === 'priorities'
                ? handlePreviewPrioritiesChange
                : undefined
            }
            vulyDisclaimer={topResultIsVuly}
          />
        </div>

        {/* Affiliate disclaimer — priorities step only */}
        {currentQuestion.id === 'priorities' && (
          <p className="mt-6 text-xs text-black/30">
            We earn a commission when you buy through some links. It doesn&apos;t change which trampoline we recommend.
          </p>
        )}

        {/* Back nav */}
        <div className="mt-4 border-t border-black/[0.06] pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={currentIndex === 0}
              className="text-sm font-medium transition-colors disabled:opacity-0 text-black/40 hover:text-black"
            >
              ← Back
            </button>
            <p className="text-xs text-black/25">Tap an answer to continue</p>
          </div>

        </div>
      </section>
    </main>
  );
}
