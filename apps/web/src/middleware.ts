import { createAuthMiddleware } from '@nestlancer/auth';
import { withCspNonce } from '@nestlancer/config/csp-middleware.mjs';
import { withRequestLog } from '@nestlancer/config/request-log.mjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedMatchers = [
  '/dashboard',
  '/projects',
  '/requests',
  '/quotes',
  '/messages',
  '/notifications',
  '/payments',
  '/invoices',
  '/profile',
  '/settings',
  // Auth island under public `/blog` tree — must win over defaultPublic `/blog` (NL-BUG-P43-001).
  '/blog/bookmarks',
];

const auth = createAuthMiddleware({
  publicPrefixes: ['/share', '/contact', '/work', '/terms', '/privacy'],
  protectedPrefixes: protectedMatchers,
});

function isProtected(pathname: string): boolean {
  return protectedMatchers.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request: NextRequest) {
  // Portal entry redirect must carry CSP like landing/admin middleware redirects.
  // next.config redirects() emit a bare 307 without production CSP (audit S08/A17).
  if (request.nextUrl.pathname === '/') {
    const dest = request.nextUrl.clone();
    dest.pathname = '/login';
    return withRequestLog(
      withCspNonce(NextResponse.redirect(dest, 307), request),
      request,
      'nl-prod-frontend-web'
    );
  }

  const response = isProtected(request.nextUrl.pathname) ? auth(request) : NextResponse.next();
  return withRequestLog(withCspNonce(response, request), request, 'nl-prod-frontend-web');
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
