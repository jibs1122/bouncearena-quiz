import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const GEO_COOKIE = 'ba_country';
const SPRINGFREE_AFFILIATE_URL = 'https://t.cfjump.com/59728/t/87128';
const SPRINGFREE_TRAMPOLINES_AFFILIATE_URL =
  'https://t.cfjump.com/59728/t/87128?Url=https%3a%2f%2fwww.springfreetrampoline.com.au%2fcollections%2ftrampolines';
const SPRINGFREE_SPRING_VS_SPRINGLESS_AFFILIATE_URL =
  'https://t.cfjump.com/59728/t/87128?Url=https%3a%2f%2fwww.springfreetrampoline.com.au%2fblogs%2fbeyond-the-bounce%2fspring-vs-springless';
const SPRINGFREE_TRAMPOLINE_SPACE_AFFILIATE_URL =
  'https://t.cfjump.com/59728/t/87128?Url=https%3a%2f%2fwww.springfreetrampoline.com.au%2fblogs%2fbeyond-the-bounce%2fhow-much-space-do-you-need-for-a-trampoline';
const SPRINGFREE_TRAMPOLINE_STANDARDS_AFFILIATE_URL =
  'https://t.cfjump.com/59728/t/87128?Url=https%3a%2f%2fwww.springfreetrampoline.com.au%2fpages%2ftrampoline-standards';

function springfreeRedirectForPath(pathname: string): string | null {
  const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  if (normalizedPath === '/go/springfree') return SPRINGFREE_AFFILIATE_URL;
  if (normalizedPath === '/go/springfree-trampolines') {
    return SPRINGFREE_TRAMPOLINES_AFFILIATE_URL;
  }
  if (normalizedPath === '/go/spring-vs-springless') {
    return SPRINGFREE_SPRING_VS_SPRINGLESS_AFFILIATE_URL;
  }
  if (normalizedPath === '/go/how-much-space-do-you-need-for-a-trampoline') {
    return SPRINGFREE_TRAMPOLINE_SPACE_AFFILIATE_URL;
  }
  if (normalizedPath === '/go/trampoline-standards') {
    return SPRINGFREE_TRAMPOLINE_STANDARDS_AFFILIATE_URL;
  }

  return null;
}

function setGeoCookie(response: NextResponse, request: NextRequest) {
  if (request.cookies.has(GEO_COOKIE)) return;
  const code = request.headers.get('x-vercel-ip-country') ?? 'AU';
  response.cookies.set(GEO_COOKIE, code, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
  });
}

function unauthorizedResponse() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Bounce Arena Admin"',
    },
  });
}

export function proxy(request: NextRequest) {
  const springfreeRedirect = springfreeRedirectForPath(request.nextUrl.pathname);
  if (springfreeRedirect) {
    return new NextResponse(null, {
      status: 308,
      headers: { Location: springfreeRedirect },
    });
  }

  if (!request.nextUrl.pathname.startsWith('/admin')) {
    const response = NextResponse.next();
    setGeoCookie(response, request);
    return response;
  }

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return new NextResponse(
      [
        'Admin auth is not configured.',
        '',
        'Create a .env.local file with:',
        'ADMIN_USERNAME=your-username',
        'ADMIN_PASSWORD=your-password',
      ].join('\n'),
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Basic ')) {
    return unauthorizedResponse();
  }

  const decoded = atob(authHeader.slice(6));
  const [providedUsername, ...rest] = decoded.split(':');
  const providedPassword = rest.join(':');

  if (providedUsername !== username || providedPassword !== password) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|images/|quiz-images/).*)', '/admin/:path*'],
};
