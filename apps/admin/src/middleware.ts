import { createAuthMiddleware } from '@nestlancer/auth';
import { withCspNonce } from '@nestlancer/config/csp-middleware.mjs';
import { withRequestLog } from '@nestlancer/config/request-log.mjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const auth = createAuthMiddleware({
  loginPath: '/login',
  publicPrefixes: ['/', '/login'],
});

const protectedMatchers = [
  '/dashboard',
  '/users',
  '/requests',
  '/quotes',
  '/projects',
  '/payments',
  '/analytics',
  '/content',
  '/contact',
  '/moderation',
  '/integrations',
  '/audit',
  '/messages',
  '/system',
  '/portfolio',
  '/media',
  '/pipeline',
  '/notifications',
  '/api-keys',
];

/**
 * Probe-as-absent paths that would otherwise match `/[resource]/[id]` and soft-404
 * under the streamed dashboard layout (HTTP 200 + not-found UI). Rewritten to
 * `/nl-absent` (Route Handler) which returns a real document 404 (NL-UI-RERUN-002 /
 * NL-BUG-ADMIN-003). Note: App Router treats `_`-prefixed folders as private, so
 * do not use `__absent`.
 */
const HARD_ABSENT_PATHS = new Set([
  '/users/bulk',
  '/users/roles',
  '/quotes/library',
  '/quotes/line-items',
]);
const HARD_ABSENT_REWRITE = '/nl-absent';

/** Real static quote subroutes (and intentional hub redirects) — not hard-absent. */
const QUOTE_KNOWN_SEGMENTS = new Set(['drafts', 'new', 'stats', 'payment-schedules', 'templates']);

const ROUTE_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isProtected(pathname: string): boolean {
  return protectedMatchers.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Non-UUID `/quotes/<segment>` that is not a known subroute → hard 404. */
function isHardAbsentQuoteSegment(pathname: string): boolean {
  const match = /^\/quotes\/([^/]+)\/?$/.exec(pathname);
  if (!match) return false;
  const segment = match[1]!;
  if (QUOTE_KNOWN_SEGMENTS.has(segment)) return false;
  if (ROUTE_UUID_RE.test(segment)) return false;
  return true;
}

function isHardAbsentPath(pathname: string): boolean {
  return HARD_ABSENT_PATHS.has(pathname) || isHardAbsentQuoteSegment(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = isProtected(pathname) ? auth(request) : NextResponse.next();

  // Login redirect takes precedence over absent-path rewrite.
  if (response.headers.has('location')) {
    return withRequestLog(withCspNonce(response, request), request, 'nl-prod-frontend-admin');
  }

  if (isHardAbsentPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = HARD_ABSENT_REWRITE;
    const rewritten = NextResponse.rewrite(url);
    response.cookies.getAll().forEach((cookie) => {
      rewritten.cookies.set(cookie.name, cookie.value);
    });
    return withRequestLog(withCspNonce(rewritten, request), request, 'nl-prod-frontend-admin');
  }

  return withRequestLog(withCspNonce(response, request), request, 'nl-prod-frontend-admin');
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
