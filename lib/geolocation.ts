export type Country = 'AU' | 'US' | 'OTHER';

export const COUNTRY_STORAGE_KEY = 'ba_quiz_country';
const GEO_COOKIE = 'ba_country';

export function resolveQuizCountry(country: Country): 'AU' | 'US' {
  return country === 'US' ? 'US' : 'AU';
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function codeToCountry(code: string): Country {
  return code === 'AU' ? 'AU' : code === 'US' ? 'US' : 'OTHER';
}

export function detectCountry(): Country {
  if (typeof window === 'undefined') return 'AU';

  // Manual override (user explicitly chose) takes priority
  const stored = localStorage.getItem(COUNTRY_STORAGE_KEY);
  if (stored === 'AU' || stored === 'US' || stored === 'OTHER') return stored;

  // Country set by edge middleware from Vercel's x-vercel-ip-country header
  const code = readCookie(GEO_COOKIE);
  return code ? codeToCountry(code) : 'AU';
}

export function saveCountry(country: Country): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(COUNTRY_STORAGE_KEY, country);
  }
}
