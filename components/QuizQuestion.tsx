'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export interface QuizOption {
  id: string;
  label: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export interface Question {
  id: string;
  title: string;
  subtitle?: string;
  subtitleExtra?: string;
  questionImage?: string; // supporting image shown above options
  type: 'single' | 'multi';
  maxSelect?: number;
  options: QuizOption[];
  expandable?: {
    trigger: string;
    content: string;
  };
  affiliateLink?: {
    text: string;
    href: string;
  };
  cardLayout?: boolean;
}

interface QuizQuestionProps {
  question: Question;
  selected: string[];
  onAnswer: (value: string | string[]) => void;
  onSkip: () => void;
  onSelectionChange?: (values: string[]) => void;
  vulyDisclaimer?: boolean;
}

export default function QuizQuestion({
  question,
  selected,
  onAnswer,
  onSkip,
  onSelectionChange,
  vulyDisclaimer = false,
}: QuizQuestionProps) {
  const [expanded, setExpanded] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [localSelected, setLocalSelected] = useState<string[]>(selected);

  useEffect(() => {
    setLocalSelected((current) => {
      if (
        current.length === selected.length &&
        current.every((value, index) => value === selected[index])
      ) {
        return current;
      }

      return selected;
    });
  }, [selected]);

  useEffect(() => {
    if (question.type !== 'multi') return;
    onSelectionChange?.(localSelected);
  }, [localSelected, onSelectionChange, question.type]);

  function handleOptionClick(id: string) {
    if (question.type === 'single') {
      setPendingId(id);
      setTimeout(() => {
        setPendingId(null);
        onAnswer(id);
      }, 280);
      return;
    }

    const max = question.maxSelect ?? 2;
    setLocalSelected((current) => {
      return current.includes(id)
        ? current.filter((v) => v !== id)
        : current.length >= max
          ? [...current.slice(1), id]
          : [...current, id];
    });
  }

  function isSelected(id: string): boolean {
    if (question.type === 'single') return pendingId === id || selected.includes(id);
    return localSelected.includes(id);
  }

  const isPending = pendingId !== null;

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Heading */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl leading-snug">
          {question.title}
        </h1>

        {question.subtitle && (
          <p className="mt-3 text-base leading-7 text-black/55">{question.subtitle}</p>
        )}

        {question.subtitleExtra && (
          <p className="mt-2 text-base leading-7 text-black/55">{question.subtitleExtra}</p>
        )}

        {question.affiliateLink && (
          <p className="mt-2 text-sm">
            <a
              href={question.affiliateLink.href}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="font-medium text-[#38b1ab] underline underline-offset-4 hover:text-[#2e9a94] transition-colors"
            >
              {question.affiliateLink.text} →
            </a>
          </p>
        )}

        {question.expandable && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-black/40 hover:text-black/70 transition-colors"
            >
              <span
                className={`inline-block transition-transform duration-200 text-xs ${expanded ? 'rotate-90' : ''}`}
              >
                ▶
              </span>
              {question.expandable.trigger}
            </button>
            {expanded && (
              <div className="mt-3 rounded-xl border border-black/[0.07] bg-black/[0.02] px-4 py-4 text-sm leading-7 text-black/55">
                {question.expandable.content}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Supporting image — square and slightly smaller to keep the quiz compact */}
      {question.questionImage && (
        <div className="mb-5">
          <div
            className="relative mx-auto w-full max-w-[26rem] overflow-hidden rounded-2xl bg-black/[0.03]"
            style={{ aspectRatio: '1 / 1' }}
          >
            <Image
              src={question.questionImage}
              alt=""
              fill
              className="object-contain"
              sizes="(max-width: 640px) calc(100vw - 2.5rem), 416px"
            />
          </div>
        </div>
      )}

      {/* Options */}
      <div className={`grid gap-2.5 ${question.cardLayout ? 'sm:grid-cols-3' : 'grid-cols-1'}`}>
        {question.options.map((option) => {
          const active = isSelected(option.id);
          const confirming = pendingId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleOptionClick(option.id)}
              disabled={isPending && !confirming}
              className={[
                'text-left rounded-2xl border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38b1ab] focus-visible:ring-offset-2',
                question.cardLayout ? 'p-0 overflow-hidden' : 'px-5 py-4',
                active
                  ? 'border-[#38b1ab] bg-[#38b1ab]/[0.07] shadow-sm'
                  : 'border-black/[0.09] bg-white hover:border-[#38b1ab]/40 hover:bg-black/[0.015]',
                confirming ? 'option-confirming' : '',
                isPending && !confirming ? 'opacity-40 cursor-default' : 'cursor-pointer',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {question.cardLayout ? (
                <div className="flex flex-col h-full">
                  {option.imageSrc && (
                    <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-black/[0.03]">
                      <Image
                        src={option.imageSrc}
                        alt={option.imageAlt ?? option.label}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-4 flex flex-col gap-1">
                    <div
                      className={`font-semibold text-base leading-snug ${active ? 'text-[#38b1ab]' : 'text-black'}`}
                    >
                      {option.label}
                    </div>
                    {option.description && (
                      <div
                        className={`text-sm leading-snug ${active ? 'text-[#38b1ab]/70' : 'text-black/45'}`}
                      >
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3.5">
                  <span
                    className={`mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      active ? 'border-[#38b1ab]' : 'border-black/25'
                    }`}
                  >
                    {active && <span className="h-2 w-2 rounded-full bg-[#38b1ab]" />}
                  </span>
                  <div>
                    <div
                      className={`font-semibold leading-snug text-base ${active ? 'text-[#38b1ab]' : 'text-black'}`}
                    >
                      {option.label}
                    </div>
                    {option.description && (
                      <div
                        className={`mt-0.5 text-sm leading-snug ${active ? 'text-[#38b1ab]/70' : 'text-black/45'}`}
                      >
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Multi-select footer */}
      {question.type === 'multi' && (
        <div className="mt-6 border-t border-black/[0.06] pt-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-black/40">
              {localSelected.length === 0
                ? `Select up to ${question.maxSelect ?? 2}`
                : `${localSelected.length} of ${question.maxSelect ?? 2} selected`}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onSkip}
                className="text-sm text-black/30 underline underline-offset-4 hover:text-black/55 transition-colors"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => onAnswer(localSelected)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all bg-[#38b1ab] text-white hover:bg-[#2e9a94] active:scale-95"
              >
                See my results →
              </button>
            </div>
          </div>
          {vulyDisclaimer && (
            <p className="text-xs text-black/35 text-right">Opens your top match in a new tab</p>
          )}
        </div>
      )}

      {/* Skip — single-select questions */}
      {question.type === 'single' && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onSkip}
            disabled={isPending}
            className="text-sm text-black/30 underline underline-offset-4 hover:text-black/55 transition-colors disabled:opacity-0"
          >
            Skip question
          </button>
        </div>
      )}
    </div>
  );
}
