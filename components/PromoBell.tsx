'use client';

import { useState } from 'react';
import BrandLogoAvatar from '@/components/BrandLogoAvatar';
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
      aria-label={active ? `${code} copied` : `Copy promo code ${code}`}
      className={`min-h-9 w-full rounded-lg border px-3 py-2 font-mono text-xs font-bold tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b1ab] focus-visible:ring-offset-2 ${
        active
          ? 'border-[#38b1ab] bg-[#38b1ab] text-white'
          : 'border-black/10 bg-black/[0.03] text-black/75 hover:border-[#38b1ab]/45 hover:bg-[#38b1ab]/[0.06] hover:text-[#278984]'
      }`}
    >
      <span className="block text-center">{active ? 'Copied' : code}</span>
    </button>
  );
}

function ShopLink({
  brand,
  href,
  location,
  compact = false,
}: {
  brand: string;
  href: string;
  location: string;
  compact?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow noopener noreferrer sponsored"
      onClick={() => trackOutboundClick({ url: href, label: `Shop ${brand}`, location })}
      aria-label={`Shop ${brand} with the listed promo code`}
      className={`${
        compact ? 'shrink-0 px-3' : 'w-full justify-center px-3.5'
      } inline-flex min-h-9 items-center rounded-lg bg-[#38b1ab] py-2 text-xs font-bold text-white transition-colors hover:bg-[#2e9a94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b1ab] focus-visible:ring-offset-2`}
    >
      {compact ? 'Shop' : `Shop ${brand}`}
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
        <aside
          aria-label="Promo codes"
          className="fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 lg:block"
        >
          <div className="relative">
            <div className="rounded-l-2xl border border-r-0 border-black/10 bg-white/96 px-3.5 py-3.5 shadow-[0_16px_40px_-22px_rgba(0,0,0,0.45)] backdrop-blur transition-transform hover:-translate-x-1">
              <div className="w-[208px] pr-7">
                <p className="text-base font-bold leading-5 text-black">Current promo codes</p>
                <p className="mt-1 text-xs leading-4 text-black/55">Tap a code to copy.</p>
                <div className="mt-3 space-y-2.5">
                  {PROMOS.map((promo) => (
                    <div
                      key={promo.brand}
                      className="rounded-xl border border-black/[0.08] bg-[#fbfdfd] p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span aria-hidden="true">
                          <BrandLogoAvatar
                            name={promo.brand}
                            width={42}
                            height={34}
                            className="rounded-lg"
                            imageClassName="p-1.5"
                          />
                        </span>
                        <p className="text-sm font-bold leading-4 text-black">{promo.brand}</p>
                      </div>
                      <div className="mt-2.5 space-y-1.5">
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
                        <ShopLink
                          brand={promo.brand}
                          href={promo.href}
                          location="promo_pill_desktop"
                        />
                      </div>
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
            </div>
            <button
              type="button"
              aria-label="Close promo codes"
              onClick={() => setDesktopClosed(true)}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b1ab]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>
          </div>
        </aside>
      )}

      {!mobileClosed && (
        <aside aria-label="Promo codes" className="fixed inset-x-0 bottom-3 z-30 px-3 lg:hidden">
          <div className="rounded-2xl border border-black/10 bg-white/96 px-4 py-3 shadow-[0_14px_34px_-22px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-[#278984]">Current promo codes</span>
              <button
                type="button"
                aria-label="Close promo codes"
                onClick={() => setMobileClosed(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b1ab]"
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
                  <div className="flex min-w-0 items-center gap-2">
                    <span aria-hidden="true">
                      <BrandLogoAvatar
                        name={promo.brand}
                        width={34}
                        height={28}
                        className="rounded-md"
                        imageClassName="p-1"
                      />
                    </span>
                    <p className="min-w-0 text-xs text-black/70">
                      <span className="font-bold text-black">{promo.brand}</span>
                      <span className="font-mono">: {promo.codes.join(' · ')}</span>
                    </p>
                  </div>
                  <ShopLink
                    brand={promo.brand}
                    href={promo.href}
                    location="promo_pill_mobile"
                    compact
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-4 text-black/50">
              Affiliate links. We may earn a commission.
            </p>
          </div>
        </aside>
      )}
    </>
  );
}
