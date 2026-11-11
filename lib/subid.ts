/**
 * Passes a click's sub-ID (set by components/OutboundTracker as ?sid=) to
 * Commission Factory as UniqueId, so its commission report shows where each
 * sale came from. Appended as text so the encoded Url= parameter stays exactly
 * as it is. Other destinations are returned unchanged.
 */
export function withNetworkSubId(destination: string, sid: string | null): string {
  const clean = sid?.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  if (!clean) return destination;
  try {
    if (new URL(destination).hostname !== 't.cfjump.com') return destination;
  } catch {
    return destination;
  }
  return `${destination}${destination.includes('?') ? '&' : '?'}UniqueId=${clean}`;
}
