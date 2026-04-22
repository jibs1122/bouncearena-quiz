import { promises as fs } from 'fs';
import path from 'path';
import type { NextRequest } from 'next/server';

export type AnalyticsData = {
  redirects: {
    total: number;
    bySlug: Record<string, number>;
    byDay: Record<string, Record<string, number>>;
  };
  quizCompletions: {
    total: number;
    byCountry: Record<string, number>;
    byTopResult: Record<string, number>;
    byDay: Record<string, number>;
  };
};

const ANALYTICS_PATH = path.join(process.cwd(), 'data', 'analytics.json');
const LEGACY_CLICKS_PATH = path.join(process.cwd(), 'data', 'clicks.json');
const ANALYTICS_KV_KEY = 'bouncearena:analytics';

const EMPTY_ANALYTICS: AnalyticsData = {
  redirects: {
    total: 0,
    bySlug: {},
    byDay: {},
  },
  quizCompletions: {
    total: 0,
    byCountry: {},
    byTopResult: {},
    byDay: {},
  },
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

type KvCredentials = {
  url: string;
  token: string;
};

function getKvCredentials(): KvCredentials | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  return { url, token };
}

function getAnalyticsStorageMode(): 'kv' | 'file' {
  return getKvCredentials() ? 'kv' : 'file';
}

async function kvRequest<T>(args: string[]): Promise<T | null> {
  const credentials = getKvCredentials();
  if (!credentials) return null;

  const response = await fetch(`${credentials.url}/${args.map(encodeURIComponent).join('/')}`, {
    headers: {
      Authorization: `Bearer ${credentials.token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`KV request failed: ${response.status}`);
  }

  const body = (await response.json()) as { result?: T | null };
  return body.result ?? null;
}

async function readFileAnalytics(): Promise<AnalyticsData> {
  try {
    const raw = await fs.readFile(ANALYTICS_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AnalyticsData>;
    const analytics = {
      redirects: {
        ...EMPTY_ANALYTICS.redirects,
        ...parsed.redirects,
      },
      quizCompletions: {
        ...EMPTY_ANALYTICS.quizCompletions,
        ...parsed.quizCompletions,
      },
    };

    if (
      analytics.redirects.total === 0 &&
      Object.keys(analytics.redirects.bySlug).length === 0
    ) {
      const legacyRaw = await fs.readFile(LEGACY_CLICKS_PATH, 'utf8').catch(() => '{}');
      const legacyCounts = JSON.parse(legacyRaw) as Record<string, number>;
      analytics.redirects.bySlug = legacyCounts;
      analytics.redirects.total = Object.values(legacyCounts).reduce((sum, count) => sum + count, 0);
    }

    return analytics;
  } catch {
    return EMPTY_ANALYTICS;
  }
}

async function writeFileAnalytics(data: AnalyticsData): Promise<void> {
  await fs.writeFile(ANALYTICS_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function readAnalytics(): Promise<AnalyticsData> {
  if (getAnalyticsStorageMode() === 'kv') {
    try {
      const stored = await kvRequest<AnalyticsData>(['get', ANALYTICS_KV_KEY]);
      if (stored) {
        return {
          redirects: {
            ...EMPTY_ANALYTICS.redirects,
            ...stored.redirects,
          },
          quizCompletions: {
            ...EMPTY_ANALYTICS.quizCompletions,
            ...stored.quizCompletions,
          },
        };
      }
    } catch {
      return EMPTY_ANALYTICS;
    }
  }

  return readFileAnalytics();
}

async function writeAnalytics(data: AnalyticsData): Promise<void> {
  if (getAnalyticsStorageMode() === 'kv') {
    await kvRequest(['set', ANALYTICS_KV_KEY, JSON.stringify(data)]);
    return;
  }

  await writeFileAnalytics(data);
}

function increment(map: Record<string, number>, key: string, amount = 1) {
  map[key] = (map[key] ?? 0) + amount;
}

export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? null;
  }

  return request.headers.get('x-real-ip');
}

function isPrivateIp(ip: string): boolean {
  return (
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) ||
    ip.startsWith('fc') ||
    ip.startsWith('fd')
  );
}

export function isInternalTraffic(ip: string | null): boolean {
  if (!ip) return false;

  const configured = (process.env.ANALYTICS_EXCLUDE_IPS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return configured.includes(ip) || isPrivateIp(ip);
}

export async function trackRedirectClick(slug: string): Promise<void> {
  const analytics = await readAnalytics();
  const day = todayKey();

  analytics.redirects.total += 1;
  increment(analytics.redirects.bySlug, slug);
  analytics.redirects.byDay[day] ??= {};
  increment(analytics.redirects.byDay[day], slug);

  await writeAnalytics(analytics);
}

export async function trackQuizCompletion(country: string, topResultSlug: string | null): Promise<void> {
  const analytics = await readAnalytics();
  const day = todayKey();

  analytics.quizCompletions.total += 1;
  increment(analytics.quizCompletions.byCountry, country);
  increment(analytics.quizCompletions.byDay, day);

  if (topResultSlug) {
    increment(analytics.quizCompletions.byTopResult, topResultSlug);
  }

  await writeAnalytics(analytics);
}

export function getAnalyticsStatus() {
  return {
    storageMode: getAnalyticsStorageMode(),
    hasPersistentKv: getAnalyticsStorageMode() === 'kv',
  };
}
