import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { ACCESS_TOKEN_COOKIE, IMPERSONATION_COOKIE, REFRESH_TOKEN_COOKIE } from './tokenManager';

export interface AuthMiddlewareConfig {
  loginPath?: string;
  publicPrefixes?: string[];
  /**
   * Auth-required islands nested under a public prefix (e.g. `/blog/bookmarks` under `/blog`).
   * Checked before publicPrefixes so public trees cannot bypass the gate (NL-BUG-P43-001).
   */
  protectedPrefixes?: string[];
}

const defaultPublic = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/blog',
  '/_next',
  '/favicon.ico',
  '/api',
];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Edge-compatible guard: presence of HttpOnly refresh cookie (or legacy access cookie).
 * Access JWT for API calls lives in memory only; refresh cookie restores session on load.
 * Full JWT verification runs on the gateway.
 */
export function createAuthMiddleware(config: AuthMiddlewareConfig = {}) {
  const loginPath = config.loginPath ?? '/login';
  const publicPrefixes = [...defaultPublic, ...(config.publicPrefixes ?? [])];
  const protectedPrefixes = config.protectedPrefixes ?? [];

  return function authMiddleware(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;

    const forceProtected = matchesPrefix(pathname, protectedPrefixes);
    if (!forceProtected && matchesPrefix(pathname, publicPrefixes)) {
      return NextResponse.next();
    }

    const access = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    const refresh = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    const impersonation = request.cookies.get(IMPERSONATION_COOKIE)?.value;
    if (!access && !refresh && !impersonation) {
      const url = request.nextUrl.clone();
      url.pathname = loginPath;
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  };
}
