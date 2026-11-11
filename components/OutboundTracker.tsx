'use client';

import { useEffect } from 'react';
import { buildSubId, captureAttribution, classifyOutbound, getTrafficSource, withSubId } from '@/lib/attribution';
import { trackLinkClick } from '@/lib/gtag';
import { trackMetaAffiliateLead, trackMetaOutboundClick } from '@/lib/meta-pixel';

/**
 * One listener for every off-site link on the site, so no link can be left
 * untracked. A link (or any parent) can name its spot with
 * data-track-location; otherwise the page path is used. Before the browser
 * follows an affiliate link, the sub-ID is added so the network's commission
 * report shows where the sale came from.
 */
export default function OutboundTracker() {
  useEffect(() => {
    captureAttribution();

    function onClick(event: MouseEvent) {
      // Left click and middle click (open in new tab) both leave the site.
      if (event.type === 'auxclick' && event.button !== 1) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const info = classifyOutbound(anchor.getAttribute('href') ?? '');
      if (!info) return;

      const location =
        anchor.closest<HTMLElement>('[data-track-location]')?.dataset.trackLocation ??
        `page:${window.location.pathname}`;
      const label = (anchor.dataset.trackLabel ?? anchor.textContent ?? '').trim().slice(0, 100);

      // Keep the original href so a second click doesn't stack parameters.
      const original = anchor.dataset.originalHref ?? anchor.getAttribute('href') ?? '';
      anchor.dataset.originalHref = original;
      if (info.affiliate) anchor.href = withSubId(original, buildSubId(location));

      trackLinkClick({
        url: original,
        label,
        location,
        merchant: info.merchant,
        domain: info.domain,
        affiliate: info.affiliate,
        trafficSource: getTrafficSource(),
      });
      trackMetaOutboundClick({ url: original, location, merchant: info.merchant, affiliate: info.affiliate });
      if (info.affiliate) trackMetaAffiliateLead({ merchant: info.merchant, location, action: 'click' });
    }

    document.addEventListener('click', onClick, true);
    document.addEventListener('auxclick', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('auxclick', onClick, true);
    };
  }, []);

  return null;
}
