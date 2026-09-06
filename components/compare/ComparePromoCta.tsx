'use client';

import { useState } from 'react';
import type { BrandPromo } from '@/lib/promoCtas';

export default function ComparePromoCta({ promos }: { promos: BrandPromo[] }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (promos.length === 0) return null;

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => {
        setCopiedCode((current) => (current === code ? null : current));
      }, 1800);
    } catch {}
  }

  const brandNames = [...new Set(promos.map((promo) => promo.brand))];

  return (
    <section className="not-prose my-8 rounded-2xl border border-[#f0a08b] bg-[#fff3ef] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="lg:flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-[#c94327]">
            {promos.length === 1 ? 'Promo code available' : 'Promo codes available'}
          </p>
          <h2 className="mt-1 text-xl font-bold text-black">Save on {brandNames.join(' and ')}</h2>
          <div className="mt-2 space-y-1 text-sm leading-6 text-black/65">
            {promos.map((promo) => (
              <p key={promo.brand}>{promo.description}</p>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:flex-shrink-0">
          {promos.map((promo) => {
            const [code] = promo.codes;
            const copied = copiedCode === code;

            return (
              <div
                key={promo.brand}
                className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#efad9b] bg-white px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-black/45">
                    {promo.brand}
                  </span>
                  <span className="break-all font-mono text-base font-bold tracking-widest text-[#c94327]">
                    {code}
                  </span>
                </div>

                <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => copyCode(code)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors sm:flex-none ${
                      copied ? 'bg-emerald-600 text-white' : 'bg-[#df5033] text-white hover:bg-[#c94327]'
                    }`}
                    aria-label={`Copy ${promo.brand} promo code ${code}`}
                  >
                    {copied ? 'Copied' : 'Copy code'}
                  </button>
                  <a
                    href={promo.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-[#e78369] px-3 py-2 text-xs font-bold text-[#c94327] transition-colors hover:border-[#c94327] sm:flex-none"
                    aria-label={`Shop ${promo.brand} with promo code ${code}`}
                  >
                    Shop
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
