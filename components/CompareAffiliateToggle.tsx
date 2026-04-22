'use client';

import { useState, useEffect } from 'react';

const KEY = 'ba-compare-affiliate';

export default function CompareAffiliateToggle() {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try { setEnabled(localStorage.getItem(KEY) === '1'); } catch {}
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    try { localStorage.setItem(KEY, next ? '1' : '0'); } catch {}
  }

  if (!mounted) return null;

  return (
    <div className="flex items-start gap-4">
      <button
        onClick={toggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
          enabled ? 'bg-[#38b1ab]' : 'bg-black/15'
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      <div>
        <p className="text-sm font-medium text-black">
          Use affiliate links on Compare table
        </p>
        <p className="text-xs text-black/50 mt-0.5">
          {enabled
            ? 'ON — "View best price" links go through /go/ cloaking where available, then fall back to direct URL.'
            : 'OFF — "View best price" links go directly to manufacturer product pages.'}
        </p>
        <p className="text-xs text-black/35 mt-1">Setting stored in this browser only (localStorage).</p>
      </div>
    </div>
  );
}
