import type { NextRequest } from 'next/server';
import { getClientIp, isInternalTraffic, trackQuizCompletion } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (isInternalTraffic(ip)) {
      return Response.json({ tracked: false, reason: 'internal' });
    }

    const body = (await request.json()) as {
      country?: string;
      topResultSlug?: string | null;
    };

    await trackQuizCompletion(body.country === 'US' ? 'US' : 'AU', body.topResultSlug ?? null);
    return Response.json({ tracked: true });
  } catch {
    return Response.json({ tracked: false }, { status: 400 });
  }
}
