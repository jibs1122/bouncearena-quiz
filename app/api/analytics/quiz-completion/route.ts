import type { NextRequest } from 'next/server';
import { getClientIp, isInternalTraffic, trackQuizCompletion } from '@/lib/analytics';
import { sendQuizFinished } from '@/lib/openai-conversions';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (isInternalTraffic(ip)) {
      return Response.json({ tracked: false, reason: 'internal' });
    }

    const body = (await request.json()) as {
      country?: string;
      topResultSlug?: string | null;
      eventId?: string;
      sourceUrl?: string;
    };

    await Promise.all([
      trackQuizCompletion(body.country === 'US' ? 'US' : 'AU', body.topResultSlug ?? null),
      body.eventId
        ? sendQuizFinished({
            eventId: body.eventId,
            sourceUrl: body.sourceUrl ?? request.nextUrl.origin + '/results',
          })
        : undefined,
    ]);
    return Response.json({ tracked: true });
  } catch {
    return Response.json({ tracked: false }, { status: 400 });
  }
}
