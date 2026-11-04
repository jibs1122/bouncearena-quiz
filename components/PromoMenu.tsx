'use client';

import { useEffect, useRef, useState } from 'react';
import { CopyCodeButton, ShopLink, useCopyCode } from '@/components/PromoBell';
import { trackPromoMenuOpen } from '@/lib/gtag';
import { getAllPromos } from '@/lib/promoCtas';

const PROMOS = getAllPromos();
const LOCATION = 'quiz_promo_menu';

/**
 * Phone-only "Promo codes" button for the quiz header. The quiz hides the
 * floating promo card so it doesn't cover the answers; this keeps the codes
 * one tap away for people who leave before the results page.
 */
export default function PromoMenu() {
  const [open, setOpen] = useState(false);
  const { copiedCode, copyCode } = useCopyCode(null, LOCATION);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function toggle() {
    if (!open) trackPromoMenuOpen();
    setOpen((current) => !current);
  }

  return (
    <div ref={rootRef} className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="quiz-promo-menu"
        onClick={toggle}
        className="flex h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[#278984] transition-colors hover:bg-[#38b1ab]/[0.08]"
      >
        <span className="relative">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#38b1ab] px-1 text-[10px] font-bold leading-none text-white">
            {PROMOS.length}
          </span>
        </span>
        <span>Promo codes</span>
      </button>

      {open && (
        <div
          id="quiz-promo-menu"
          className="absolute left-3 right-3 top-full z-50 mt-1 rounded-2xl border border-black/10 bg-white p-3.5 shadow-[0_18px_36px_-20px_rgba(0,0,0,0.4)]"
        >
          <p className="text-sm font-bold text-black">Current promo codes</p>
          <p className="mt-0.5 text-xs text-black/55">Tap a code to copy.</p>
          <div className="mt-3 space-y-3">
            {PROMOS.map((promo) => (
              <div key={promo.brand} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-4 text-black">{promo.brand}</p>
                  {promo.retailer && (
                    <p className="mt-0.5 text-[11px] leading-4 text-black/55">at {promo.retailer}</p>
                  )}
                </div>
                <div className="w-28 shrink-0">
                  <CopyCodeButton
                    code={promo.codes[0]}
                    active={copiedCode === promo.codes[0]}
                    onCopy={(code) => copyCode(code, promo.brand)}
                  />
                </div>
                <ShopLink brand={promo.brand} href={promo.href} location={LOCATION} inline />
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-4 text-black/55">
            Affiliate links. We may earn a commission.
          </p>
          <span className="sr-only" aria-live="polite">
            {copiedCode ? `${copiedCode} copied` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
