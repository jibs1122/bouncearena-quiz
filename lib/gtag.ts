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
export function trackQuizStart(country: string, trafficSource: string) {
  fire('quiz_start', { country, traffic_source: trafficSource });
}

/**
 * Fired when the user answers or skips a step.
 * step_number is the 1-based question position (registered in GA4 as a custom
 * dimension, with question_id) so drop-off can be read per question.
 * answer_value is the raw answer string ("ages|jumpers" for the users step).
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
  trafficSource,
  adId,
}: {
  country: string;
  topResult: string | null;
  trafficSource: string;
  adId: string;
}) {
  fire('quiz_complete', {
    country,
    top_result: topResult ?? '(none)',
    traffic_source: trafficSource,
    ad_id: adId,
  });
}

/**
 * Fired when a promo code is copied. location is where on the site it was
 * copied; traffic_source and ad_id come from lib/attribution.
 */
export function trackPromoCodeCopy({
  code,
  brand,
  location,
  trafficSource,
  adId,
}: {
  code: string;
  brand: string;
  location: string;
  trafficSource: string;
  adId: string;
}) {
  fire('promo_code_copy', {
    code,
    brand,
    merchant: brand,
    source_location: location,
    traffic_source: trafficSource,
    ad_id: adId,
  });
}

/** Fired when the promo codes menu in the quiz header is opened. */
export function trackPromoMenuOpen() {
  fire('promo_menu_open');
}

/**
 * Fired on every off-site link click by components/OutboundTracker.
 * Paid links send affiliate_click (a GA key event); everything else sends
 * outbound_click, so the key event counts only clicks that can earn.
 */
export function trackLinkClick({
  url,
  label,
  location,
  merchant,
  domain,
  affiliate,
  trafficSource,
  adId,
}: {
  url: string;
  label: string;
  location: string;
  merchant: string;
  domain: string;
  affiliate: boolean;
  trafficSource: string;
  adId: string;
}) {
  fire(affiliate ? 'affiliate_click' : 'outbound_click', {
    link_url: url,
    link_text: label,
    link_domain: domain,
    merchant,
    source_location: location,
    traffic_source: trafficSource,
    ad_id: adId,
  });
}
