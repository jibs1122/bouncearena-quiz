// OpenAI Ads pixel helpers
// window.oaiq is injected by the Script tag in app/layout.tsx.

declare global {
  interface Window {
    oaiq?: (...args: unknown[]) => void;
  }
}

/**
 * Fired once per finished quiz, from the results page.
 * eventId is shared with the server-side Conversions API event so OpenAI
 * counts the pair as one conversion.
 */
export function trackQuizFinished(eventId: string) {
  if (typeof window === 'undefined') return;
  if (typeof window.oaiq !== 'function') return;
  window.oaiq(
    'measure',
    'custom',
    { type: 'custom' },
    { custom_event_name: 'quiz_finished', event_id: eventId },
  );
}
