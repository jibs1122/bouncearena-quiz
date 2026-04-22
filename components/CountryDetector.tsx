'use client';

import { useState } from 'react';
import type { Country } from '@/lib/geolocation';
import { resolveQuizCountry, saveCountry } from '@/lib/geolocation';

interface CountryDetectorProps {
  country: Country;
  onCountryChange: (country: Country) => void;
}

const labels: Record<Country, string> = {
  AU: 'Australia',
  US: 'the USA',
  OTHER: 'another region',
};

const flags: Record<Country, string> = {
  AU: '🇦🇺',
  US: '🇺🇸',
  OTHER: '🌏',
};

export default function CountryDetector({ country, onCountryChange }: CountryDetectorProps) {
  const [open, setOpen] = useState(false);
  const resolvedCountry = resolveQuizCountry(country);

  function updateCountry(nextCountry: Country) {
    saveCountry(nextCountry);
    onCountryChange(nextCountry);
    setOpen(false);
  }

  return (
    <div className="border-b border-black/[0.06] bg-black/[0.02] px-4 py-2.5">
      {!open ? (
        <p className="text-center text-xs leading-5 text-black/45 sm:text-sm">
          {flags[country]} Showing results for {labels[country]}.{' '}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-medium text-[#38b1ab] underline underline-offset-4 hover:text-[#2e9a94] transition-colors"
          >
            Not right? Change country
          </button>
        </p>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
          {(['AU', 'US', 'OTHER'] as Country[]).map((option) => {
            const isActive = country === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => updateCountry(option)}
                className={[
                  'rounded-full px-3.5 py-1.5 font-medium transition-all',
                  isActive
                    ? 'bg-[#38b1ab] text-white'
                    : 'bg-black/[0.05] text-black/60 hover:bg-black/[0.09] hover:text-black',
                ].join(' ')}
              >
                {flags[option]} {option === 'OTHER' ? 'Other' : labels[option]}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-2 py-1.5 text-black/25 hover:text-black/55 transition-colors"
          >
            ✕
          </button>
          {country === 'OTHER' && (
            <span className="text-black/35 text-xs">Using {resolvedCountry} quiz</span>
          )}
        </div>
      )}
    </div>
  );
}
