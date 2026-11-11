import type { NextRequest } from 'next/server';
import { getClientIp, isInternalTraffic, trackRedirectClick } from '@/lib/analytics';
import { getLinkDestination, isSpringfreeLinkSlug } from '@/lib/links';
import type { Country } from '@/lib/geolocation';
import { withNetworkSubId } from '@/lib/subid';

export async function GET(request: NextRequest, context: RouteContext<'/go/[slug]'>) {
  const { slug } = await context.params;
  const country = request.nextUrl.searchParams.get('country') as Country | null;
  const destination = getLinkDestination(slug, country);

  if (!destination) {
    return new Response('Not found', { status: 404 });
  }

  const ip = getClientIp(request);
  if (!isInternalTraffic(ip)) {
    void trackRedirectClick(slug);
  }

  return Response.redirect(withNetworkSubId(destination, request.nextUrl.searchParams.get('sid')), isSpringfreeLinkSlug(slug) ? 308 : 302);
}
