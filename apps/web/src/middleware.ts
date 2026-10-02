import { createAuthMiddleware } from '@nestlancer/auth';
import { withCspNonce } from '@nestlancer/config/csp-middleware.mjs';
import { withRequestLog } from '@nestlancer/config/request-log.mjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const auth = createAuthMiddleware({
  publicPrefixes: ['/share', '/contact', '/work', '/terms', '/privacy'],
});

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
  '/blog/bookmarks',
];

function isProtected(pathname: string): boolean {
  return protectedMatchers.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request: NextRequest) {
  const response = isProtected(request.nextUrl.pathname) ? auth(request) : NextResponse.next();
  return withRequestLog(withCspNonce(response, request), request, 'nl-prod-frontend-web');
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
