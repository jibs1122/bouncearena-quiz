// Reddit pixel helpers
// window.rdt is injected by the Script tag in app/layout.tsx when
// REDDIT_PIXEL_ID is set. Every helper does nothing until then.

declare global {
  interface Window {
    rdt?: (...args: unknown[]) => void;
  }
}

function fire(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  if (typeof window.rdt !== 'function') return;
  window.rdt(...args);
}

/**
 * Fired on client-side route changes. The first PageVisit is sent by the
 * snippet in app/layout.tsx when the page loads.
 */
export function trackRedditPageVisit() {
  fire('track', 'PageVisit');
}

/** Fired when the user submits the final quiz step. */
export function trackRedditQuizComplete() {
  fire('track', 'Custom', { customEventName: 'QuizComplete' });
}

/**
 * The event campaigns optimise for, matching Meta's Lead: an affiliate click
 * or a promo code copy, sent once per merchant per session.
 */
export function trackRedditAffiliateLead({ merchant }: { merchant: string }) {
  const key = `ba-reddit-lead:${merchant}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {}
  fire('track', 'Lead');
}
