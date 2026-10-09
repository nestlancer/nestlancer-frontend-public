import { withCspNonce } from '@nestlancer/config/csp-middleware.mjs';
import { withRequestLog } from '@nestlancer/config/request-log.mjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { resolveWebAppOriginFromHost } from '@/lib/site-origin';

/** Paths that live on the client portal (app.*), not the marketing site. */
const WEB_APP_PATHS = [
  '/blog',
  '/portfolio',
  '/terms',
  '/privacy',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
] as const;

function matchesWebAppPath(pathname: string): string | null {
  for (const prefix of WEB_APP_PATHS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return pathname;
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const path = matchesWebAppPath(request.nextUrl.pathname);
  if (path) {
    const origin = resolveWebAppOriginFromHost({
      host: request.headers.get('x-forwarded-host') || request.headers.get('host'),
      proto: request.headers.get('x-forwarded-proto'),
    });
    const dest = new URL(path + request.nextUrl.search, origin);
    return withRequestLog(
      withCspNonce(NextResponse.redirect(dest, 307), request),
      request,
      'nl-prod-frontend-landing',
      { setCorrelationCookie: false }
    );
  }

  return withRequestLog(
    withCspNonce(NextResponse.next(), request),
    request,
    'nl-prod-frontend-landing',
    { setCorrelationCookie: false }
  );
}

export const config = {
  // Skip static assets and machine-readable SEO/text routes (no HTML CSP needed).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|llms\\.txt|llms-full\\.txt|\\.well-known/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
