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

/** Fired when the promo codes menu in the quiz header is opened. */
export function trackMetaPromoMenuOpen() {
  fire('trackCustom', 'PromoMenuOpen');
}

/** Fired on every off-site link click, paid or not. */
export function trackMetaOutboundClick({
  url,
  location,
  merchant,
  affiliate,
}: {
  url: string;
  location: string;
  merchant: string;
  affiliate: boolean;
}) {
  fire('trackCustom', 'OutboundClick', {
    link_url: url,
    source_location: location,
    merchant,
    affiliate,
  } satisfies Params);
}

/**
 * The single event campaigns optimise for: an affiliate click or a promo code
 * copy. It uses the standard Lead event so it can be picked as an ad set's
 * conversion event without a custom conversion. Sent once per merchant per
 * session, so a visitor tapping the same retailer twice counts once and Meta
 * learns from people rather than taps.
 */
export function trackMetaAffiliateLead({
  merchant,
  location,
  action,
}: {
  merchant: string;
  location: string;
  action: 'click' | 'code_copy';
}) {
  const key = `ba-meta-lead:${merchant}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {}
  fire('track', 'Lead', {
    content_name: merchant,
    content_category: action,
    source_location: location,
  } satisfies Params);
}
