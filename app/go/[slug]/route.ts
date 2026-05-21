import type { NextRequest } from 'next/server';
import { getClientIp, isInternalTraffic, trackRedirectClick } from '@/lib/analytics';
import { getLink, SPRINGFREE_TRAMPOLINES_AFFILIATE_URL } from '@/lib/links';
import type { Country } from '@/lib/geolocation';

export async function GET(request: NextRequest, context: RouteContext<'/go/[slug]'>) {
  const { slug } = await context.params;
  const country = request.nextUrl.searchParams.get('country') as Country | null;
  const destination = getLink(slug, country);

  if (!destination) {
    return new Response('Not found', { status: 404 });
  }

  const ip = getClientIp(request);
  if (!isInternalTraffic(ip)) {
    void trackRedirectClick(slug);
  }

  if (slug === 'springfree-trampolines') {
    return new Response(null, {
      status: 308,
      headers: { Location: SPRINGFREE_TRAMPOLINES_AFFILIATE_URL },
    });
  }

  return Response.redirect(destination, slug === 'springfree' ? 308 : 302);
}
