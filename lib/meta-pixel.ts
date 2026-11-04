// Meta pixel helpers
// window.fbq is injected by the Script tag in app/layout.tsx.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type Params = Record<string, string | number | boolean | undefined>;

function fire(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq !== 'function') return;
  window.fbq(...args);
}

/**
 * Fired on client-side route changes. The first PageView is sent by the
 * snippet in app/layout.tsx when the page loads.
 */
export function trackMetaPageView() {
  fire('track', 'PageView');
}

/** Fired when the user answers or skips a quiz step. */
export function trackMetaQuizStep({
  stepNumber,
  questionId,
  skipped,
}: {
  stepNumber: number;
  questionId: string;
  skipped: boolean;
}) {
  fire('trackCustom', 'QuizStep', {
    step_number: stepNumber,
    question_id: questionId,
    skipped,
  } satisfies Params);
}

/** Fired when the user submits the final step. */
export function trackMetaQuizComplete({
  country,
  topResult,
}: {
  country: string;
  topResult: string | null;
}) {
  fire('trackCustom', 'QuizComplete', {
    country,
    top_result: topResult ?? '(none)',
  } satisfies Params);
}

/**
 * Fired when quiz submit opens the top result in a new tab. Kept separate
 * from OutboundClick so campaigns can optimise on clicks people chose.
 */
export function trackMetaQuizAutoOpen({ url }: { url: string }) {
  fire('trackCustom', 'QuizAutoOpen', {
    link_url: url,
  } satisfies Params);
}

/** Fired when a promo code is copied. */
export function trackMetaPromoCodeCopy({
  code,
  brand,
  location,
}: {
  code: string;
  brand: string;
  location: string;
}) {
  fire('trackCustom', 'PromoCodeCopy', {
    code,
    brand,
    source_location: location,
  } satisfies Params);
}

/** Fired on any outbound/affiliate link click. */
export function trackMetaOutboundClick({ url, location }: { url: string; location: string }) {
  fire('trackCustom', 'OutboundClick', {
    link_url: url,
    source_location: location,
  } satisfies Params);
}
