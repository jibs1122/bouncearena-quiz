'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getGoLinkSlug, isAffiliateLink, isRawVulyAffiliateHref, isRawWebAndWarehouseAffiliateHref } from '@/lib/links';

export interface QuizOption {
  id: string;
  label: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export interface QuizOptionGroup {
  id: string;
  label: string;
  options: QuizOption[];
}

export interface Question {
  id: string;
  title: string;
  /** One line on why we ask, shown under the title. */
  why?: string;
  /** single: one tap advances. pair: one tap in each group advances. */
  type: 'single' | 'pair';
  options: QuizOption[];
  groups?: QuizOptionGroup[];
  cardLayout?: boolean;
  /** Final step: answer immediately so the results tab can open inside the click. */
  submitsQuiz?: boolean;
  links?: {
    intro?: string;
    items: Array<{ text: string; href: string }>;
  };
}

interface QuizQuestionProps {
  question: Question;
  selected: string[];
  onAnswer: (value: string | string[]) => void;
  onSkip: () => void;
  note?: string | null;
}

const ADVANCE_DELAY_MS = 280;

function linkRel(href: string): string {
  const slug = getGoLinkSlug(href);
  const sponsored =
    Boolean(slug && isAffiliateLink(slug)) ||
    isRawVulyAffiliateHref(href) ||
    isRawWebAndWarehouseAffiliateHref(href);

  if (sponsored) return 'nofollow noopener noreferrer sponsored';
  if (href === '/go' || href.startsWith('/go/')) return 'nofollow noopener noreferrer';
  return 'noopener noreferrer';
}

function optionClass(active: boolean, confirming: boolean, dimmed: boolean, extra: string) {
  return [
    'rounded-2xl border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38b1ab] focus-visible:ring-offset-2',
    extra,
    active
      ? 'border-[#38b1ab] bg-[#38b1ab]/[0.07] shadow-sm'
      : 'border-black/[0.09] bg-white hover:border-[#38b1ab]/40 hover:bg-black/[0.015]',
    confirming ? 'option-confirming' : '',
    dimmed ? 'opacity-40 cursor-default' : 'cursor-pointer',
  ]
    .filter(Boolean)
    .join(' ');
}

export default function QuizQuestion({ question, selected, onAnswer, onSkip, note }: QuizQuestionProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  // Pair questions keep one pick per group, in group order.
  const [pairPicks, setPairPicks] = useState<Array<string | undefined>>(() =>
    (question.groups ?? []).map((group) => selected.find((id) => group.options.some((o) => o.id === id))),
  );

  const isPending = pendingId !== null;

  function handleSingleClick(id: string) {
    if (question.submitsQuiz) {
      // window.open for the top match must run inside the click handler.
      setPendingId(id);
      onAnswer(id);
      return;
    }
    setPendingId(id);
    window.setTimeout(() => {
      setPendingId(null);
      onAnswer(id);
    }, ADVANCE_DELAY_MS);
  }

  function handlePairClick(groupIndex: number, id: string) {
    if (isPending) return;
    const next = [...pairPicks];
    next[groupIndex] = id;
    setPairPicks(next);

    if (next.every(Boolean) && next.length === (question.groups?.length ?? 0)) {
      setPendingId(id);
      window.setTimeout(() => {
        setPendingId(null);
        onAnswer(next as string[]);
      }, ADVANCE_DELAY_MS);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Heading */}
      <div className="mb-3">
        <h2 className="text-xl font-bold leading-snug tracking-tight text-black sm:text-3xl">
          {question.title}
        </h2>
        {question.why && (
          <p className="mt-1 text-sm leading-5 text-black/60 sm:text-base sm:leading-6">{question.why}</p>
        )}
      </div>

      {/* Single-tap options */}
      {question.type === 'single' && (
        <div className={`grid gap-2 ${question.cardLayout ? 'sm:grid-cols-3 sm:gap-2.5' : 'grid-cols-1'}`}>
          {question.options.map((option) => {
            const confirming = pendingId === option.id;
            const active = confirming || (!isPending && selected.includes(option.id));

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSingleClick(option.id)}
                disabled={isPending && !confirming}
                className={optionClass(
                  active,
                  confirming,
                  isPending && !confirming,
                  question.cardLayout ? 'overflow-hidden p-0 text-left' : 'px-4 py-2 text-left',
                )}
              >
                {question.cardLayout ? (
                  <div className="flex h-full items-center sm:flex-col sm:items-stretch">
                    {option.imageSrc && (
                      <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden bg-black/[0.03] sm:h-40 sm:w-full">
                        <Image
                          src={option.imageSrc}
                          alt={option.imageAlt ?? option.label}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 96px, 33vw"
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5 px-4 py-3">
                      <div className={`text-base font-semibold leading-snug ${active ? 'text-[#38b1ab]' : 'text-black'}`}>
                        {option.label}
                      </div>
                      {option.description && (
                        <div className={`text-sm leading-snug ${active ? 'text-[#38b1ab]/80' : 'text-black/55'}`}>
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        active ? 'border-[#38b1ab]' : 'border-black/25'
                      }`}
                    >
                      {active && <span className="h-2 w-2 rounded-full bg-[#38b1ab]" />}
                    </span>
                    <div>
                      <div className={`text-base font-semibold leading-snug ${active ? 'text-[#38b1ab]' : 'text-black'}`}>
                        {option.label}
                      </div>
                      {option.description && (
                        <div className={`text-sm leading-snug ${active ? 'text-[#38b1ab]/80' : 'text-black/60'}`}>
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
      )}

      {/* Two quick taps on one screen */}
      {question.type === 'pair' && (
        <div className="space-y-5">
          {(question.groups ?? []).map((group, groupIndex) => (
            <fieldset key={group.id}>
              <legend className="mb-2 text-sm font-semibold text-black/70">{group.label}</legend>
              <div className="grid grid-cols-2 gap-2">
                {group.options.map((option) => {
                  const active = pairPicks[groupIndex] === option.id;
                  const confirming = pendingId === option.id && active;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handlePairClick(groupIndex, option.id)}
                      disabled={isPending}
                      className={optionClass(active, confirming, false, 'px-4 py-3 text-center')}
                    >
                      <span className={`text-base font-semibold ${active ? 'text-[#38b1ab]' : 'text-black'}`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      {/* Supporting guides, below the answers so they never push the first tap down */}
      {question.links && (
        <p className="mt-4 text-sm leading-6 text-black/55">
          {question.links.intro ? <>{question.links.intro} </> : null}
          {question.links.items.map((link, index) => (
            <span key={link.href}>
              {index > 0 ? ' · ' : null}
              <a
                href={link.href}
                target="_blank"
                rel={linkRel(link.href)}
                className="font-medium text-[#38b1ab] underline underline-offset-4 transition-colors hover:text-[#2e9a94]"
              >
                {link.text}
              </a>
            </span>
          ))}
        </p>
      )}

      {note && <p className="mt-4 text-xs text-black/40">{note}</p>}

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onSkip}
          disabled={isPending}
          className="text-sm text-black/35 underline underline-offset-4 transition-colors hover:text-black/60 disabled:opacity-0"
        >
          Skip question
        </button>
      </div>
    </div>
  );
}
