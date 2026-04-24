// GA4 event helpers
// window.gtag is injected by the Script tag in app/layout.tsx.

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

type Params = Record<string, string | number | boolean | undefined>;

function fire(eventName: string, params?: Params) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

/** Fired once when the quiz first renders (step 1). */
export function trackQuizStart(country: string) {
  fire('quiz_start', { country });
}

/**
 * Fired when the user answers or skips a step.
 * answer_value is the raw answer string (or comma-joined array for priorities).
 */
export function trackQuizStep({
  stepNumber,
  questionId,
  answerValue,
  skipped,
}: {
  stepNumber: number;
  questionId: string;
  answerValue: string;
  skipped: boolean;
}) {
  fire('quiz_step_complete', {
    step_number: stepNumber,
    question_id: questionId,
    answer_value: answerValue,
    skipped,
  });
}

/**
 * Fired when the user submits the final step and is navigated to results.
 * top_result is the slug of the #1 recommended trampoline.
 */
export function trackQuizComplete({
  country,
  topResult,
}: {
  country: string;
  topResult: string | null;
}) {
  fire('quiz_complete', {
    country,
    top_result: topResult ?? '(none)',
  });
}

/**
 * Fired on any outbound/affiliate link click.
 * location describes where on the site the click happened (e.g. "results_card", "promo_pill").
 */
export function trackOutboundClick({
  url,
  label,
  location,
}: {
  url: string;
  label: string;
  location: string;
}) {
  fire('outbound_click', {
    link_url: url,
    link_text: label,
    source_location: location,
  });
}
