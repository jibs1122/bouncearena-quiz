'use client';

import { useState } from 'react';
import { trackOutboundClick } from '@/lib/gtag';
import { getAllPromos } from '@/lib/promoCtas';

const PROMOS = getAllPromos();

function CopyCodeButton({
  code,
  active,
  onCopy,
}: {
  code: string;
  active: boolean;
  onCopy: (code: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(code)}
      className={`w-[7.5rem] rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
        active
          ? 'border-[#38b1ab] bg-[#38b1ab] text-white'
          : 'border-black/10 bg-black/[0.03] text-black/65 hover:border-[#38b1ab]/35 hover:text-[#38b1ab]'
      }`}
    >
      <span className="block text-center">{active ? 'Copied' : code}</span>
    </button>
  );
}

function ShopLink({ href, location }: { href: string; location: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow noopener noreferrer sponsored"
      onClick={() => trackOutboundClick({ url: href, label: 'Click to shop', location })}
      className="inline-flex items-center rounded-full bg-[#38b1ab] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#2e9a94]"
    >
      Click to shop
    </a>
  );
}

export default function PromoBell() {
  const [mobileClosed, setMobileClosed] = useState(false);
  const [desktopClosed, setDesktopClosed] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => {
        setCopiedCode((current) => (current === code ? null : current));
      }, 1800);
    } catch {}
  }

  return (
    <>
      {!desktopClosed && (
        <div className="fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 lg:block">
          <div className="relative">
            <div className="flex items-center gap-3 rounded-l-2xl border border-r-0 border-black/10 bg-white/96 px-3 py-3 shadow-[0_16px_40px_-22px_rgba(0,0,0,0.45)] backdrop-blur transition-transform hover:-translate-x-1">
              <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#38b1ab]">
                Promo Codes
              </span>
              <div className="w-[208px] pr-7">
                <p className="text-sm font-semibold leading-5 text-black">Promo codes</p>
                <div className="mt-3 space-y-3">
                  {PROMOS.map((promo) => (
                    <div key={promo.brand}>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-black/45">
                        {promo.brand}
                      </p>
                      <div className="mt-1.5 flex flex-wrap justify-start gap-1.5">
                        {promo.codes.map((code) => (
                          <CopyCodeButton
                            key={code}
                            code={code}
                            active={copiedCode === code}
                            onCopy={copyCode}
                          />
                        ))}
                      </div>
                      <div className="mt-2">
                        <ShopLink href={promo.href} location="promo_pill_desktop" />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-black/45">
                  Click a code to copy.
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close promo codes"
              onClick={() => setDesktopClosed(true)}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black/70"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {!mobileClosed && (
        <div className="fixed inset-x-0 bottom-3 z-30 px-3 lg:hidden">
          <div className="rounded-2xl border border-black/10 bg-white/96 px-4 py-3 shadow-[0_14px_34px_-22px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-[#38b1ab]">Promo codes</span>
              <button
                type="button"
                aria-label="Close promo codes"
                onClick={() => setMobileClosed(true)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black/70"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="mt-1.5 space-y-2">
              {PROMOS.map((promo) => (
                <div key={promo.brand} className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold text-black/55">
                    {promo.brand}: {promo.codes.join(' · ')}
                  </p>
                  <ShopLink href={promo.href} location="promo_pill_mobile" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
