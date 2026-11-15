'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import ProgressBar from '@/components/ProgressBar';
import QuizQuestion from '@/components/QuizQuestion';
import SiteHeader from '@/components/SiteHeader';
import { detectCountry, type Country } from '@/lib/geolocation';
import { getAdId, getTrafficSource } from '@/lib/attribution';
import { trackQuizComplete, trackQuizStart, trackQuizStep } from '@/lib/gtag';
import { normalizeCountry } from '@/lib/links';
import { trackMetaQuizComplete, trackMetaQuizStep } from '@/lib/meta-pixel';
import { trackRedditQuizComplete } from '@/lib/reddit-pixel';
import { buildQuestions } from '@/lib/quiz';
import {
  encodeAnswers,
  getRecommendations,
  parseAnswers,
  type AgeGroup,
  type BackyardSize,
  type BudgetId,
  type JumperCount,
  type QuizAnswers,
  type ShapeChoice,
  type SpringChoice,
  type StandardsChoice,
} from '@/lib/scoring';

type PartialQuizAnswers = Partial<QuizAnswers> & { country: Country };

/** Unanswered or skipped questions fall back to the neutral answer. */
function withDefaults(answers: PartialQuizAnswers): QuizAnswers {
  return {
    country: answers.country,
    backyardSize: answers.backyardSize ?? 'not-sure',
    ages: answers.ages ?? 'not-sure',
    jumpers: answers.jumpers ?? 'not-sure',
    shape: answers.shape ?? 'no-preference',
    budget: answers.budget?.length ? answers.budget : ['flexible'],
    springType: answers.springType ?? 'not-sure',
    standards: answers.standards ?? 'no',
  };
}

function applyAnswer(answers: PartialQuizAnswers, questionId: string, value: string | string[] | null) {
  const next: PartialQuizAnswers = { ...answers };
  if (questionId === 'backyardSize') next.backyardSize = (value ?? 'not-sure') as BackyardSize;
  if (questionId === 'users') {
    const [ages, jumpers] = Array.isArray(value) ? value : [];
    next.ages = (ages ?? 'not-sure') as AgeGroup;
    next.jumpers = (jumpers ?? 'not-sure') as JumperCount;
  }
  if (questionId === 'shape') next.shape = (value ?? 'no-preference') as ShapeChoice;
  if (questionId === 'budget') next.budget = [(value ?? 'flexible') as BudgetId];
  if (questionId === 'springType') next.springType = (value ?? 'not-sure') as SpringChoice;
  if (questionId === 'standards') next.standards = (value ?? 'no') as StandardsChoice;
  return next;
}

export default function QuizPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<PartialQuizAnswers>({ country: 'AU' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  // Set when the results page sends someone back to change a single answer.
  const [editing, setEditing] = useState(false);
  const quizContentRef = useRef<HTMLElement | null>(null);
  const hasMountedQuestionRef = useRef(false);

  useEffect(() => {
    const country = detectCountry();
    // The results page links back here with the answers in the URL, so a retake
    // starts filled in, and "?edit=budget" opens that one question.
    const params = new URLSearchParams(window.location.search);
    const previous = parseAnswers(params);
    const editIndex = previous
      ? buildQuestions(country).findIndex((question) => question.id === params.get('edit'))
      : -1;

    const timer = window.setTimeout(() => {
      setAnswers((current) => ({ ...current, ...previous, country }));
      if (editIndex >= 0) {
        setCurrentIndex(editIndex);
        setEditing(true);
      }
    }, 0);
    // Changing one answer is not a new quiz start.
    if (editIndex < 0) trackQuizStart(country, getTrafficSource());

    return () => window.clearTimeout(timer);
  }, []);

  const questions = useMemo(() => buildQuestions(answers.country), [answers.country]);
  const currentQuestion = questions[currentIndex];
  const stepNumber = currentIndex + 1;
  const progress = (currentIndex / questions.length) * 100;

  useEffect(() => {
    if (!hasMountedQuestionRef.current) {
      hasMountedQuestionRef.current = true;
      return;
    }

    quizContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentIndex]);

  function selectedValues(questionId: string): string[] {
    if (questionId === 'users') {
      return [answers.ages, answers.jumpers].filter(
        (value): value is AgeGroup | JumperCount => Boolean(value) && value !== 'not-sure',
      );
    }
    if (questionId === 'budget') return answers.budget ?? [];
    const value = answers[questionId as 'backyardSize' | 'shape' | 'springType' | 'standards'];
    return value ? [value] : [];
  }

  function goBack() {
    if (currentIndex === 0) return;
    setDirection('back');
    setCurrentIndex((current) => Math.max(0, current - 1));
  }

  function submitAndNavigate(nextAnswers: QuizAnswers) {
    if (editing) {
      // Already counted as a completion the first time through.
      router.push(`/results?${encodeAnswers(nextAnswers)}`);
      return;
    }

    const country = normalizeCountry(nextAnswers.country);
    const top = getRecommendations(nextAnswers)[0];

    trackQuizComplete({
      country,
      topResult: top?.slug ?? null,
      trafficSource: getTrafficSource(),
      adId: getAdId(),
    });
    trackMetaQuizComplete({ country, topResult: top?.slug ?? null });
    trackRedditQuizComplete();

    router.push(`/results?${encodeAnswers(nextAnswers)}`);
  }

  function advance(value: string | string[] | null, skipped: boolean) {
    const questionId = currentQuestion.id;
    const nextAnswers = applyAnswer(answers, questionId, value);

    if (editing) {
      setAnswers(nextAnswers);
      submitAndNavigate(withDefaults(nextAnswers));
      return;
    }

    trackQuizStep({
      stepNumber,
      questionId,
      answerValue: skipped ? '(skipped)' : Array.isArray(value) ? value.join('|') : (value ?? ''),
      skipped,
    });
    trackMetaQuizStep({ stepNumber, questionId, skipped });

    setAnswers(nextAnswers);

    if (currentQuestion.submitsQuiz || currentIndex === questions.length - 1) {
      submitAndNavigate(withDefaults(nextAnswers));
      return;
    }

    setDirection('forward');
    setCurrentIndex((current) => Math.min(questions.length - 1, current + 1));
  }

  return (
    <main className="min-h-screen bg-white text-black">
      {/* No promo card here: on phones it sits over the answers. */}
      <SiteHeader active="quiz" showPromo={false} showPromoMenu />

      <section ref={quizContentRef} className="mx-auto w-full max-w-3xl scroll-mt-20 px-4 pb-8 pt-4 sm:px-8 sm:pt-8">
        {currentIndex === 0 && !editing && (
          <div className="mb-3">
            <h1 className="text-xl font-bold tracking-tight text-black sm:text-4xl">Trampoline quiz</h1>
            <p className="mt-0.5 text-sm text-black/60 sm:mt-2 sm:text-base">Answer 6 questions and get 3 suitable trampolines.</p>
            <p className="mt-1 text-[11px] leading-4 text-black/45 sm:text-xs">
              If you buy through a link on this page, the retailer may pay us a commission.
            </p>
          </div>
        )}

        {/* Progress */}
        {editing ? (
          <p className="mb-3 text-xs font-semibold text-black/55">
            Change this answer to update your results.
          </p>
        ) : (
          <div className="mb-3 flex items-center gap-3">
            <div className="whitespace-nowrap text-xs font-semibold tabular-nums text-black/55">
              Question {stepNumber} of {questions.length}
            </div>
            <div className="flex-1">
              <ProgressBar value={progress} />
            </div>
          </div>
        )}

        <div
          key={currentQuestion.id}
          className={direction === 'back' ? 'question-enter-back' : 'question-enter-forward'}
        >
          <QuizQuestion
            question={currentQuestion}
            selected={selectedValues(currentQuestion.id)}
            onAnswer={(value) => advance(value, false)}
            onSkip={() => advance(null, true)}
          />
        </div>

        {editing && (
          <div className="mt-4 border-t border-black/[0.06] pt-4">
            <Link
              href={`/results/?${encodeAnswers(withDefaults(answers))}`}
              className="text-sm font-medium text-black/45 transition-colors hover:text-black"
            >
              ← Back to your results
            </Link>
          </div>
        )}

        {currentIndex > 0 && !editing && (
          <div className="mt-4 border-t border-black/[0.06] pt-4">
            <button
              type="button"
              onClick={goBack}
              className="text-sm font-medium text-black/45 transition-colors hover:text-black"
            >
              ← Back
            </button>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
