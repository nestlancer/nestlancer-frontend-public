import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { ACCESS_TOKEN_COOKIE, IMPERSONATION_COOKIE, REFRESH_TOKEN_COOKIE } from './tokenManager';

export interface AuthMiddlewareConfig {
  loginPath?: string;
  publicPrefixes?: string[];
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

/**
 * Edge-compatible guard: presence of HttpOnly refresh cookie (or legacy access cookie).
 * Access JWT for API calls lives in memory only; refresh cookie restores session on load.
 * Full JWT verification runs on the gateway.
 */
export function createAuthMiddleware(config: AuthMiddlewareConfig = {}) {
  const loginPath = config.loginPath ?? '/login';
  const publicPrefixes = [...defaultPublic, ...(config.publicPrefixes ?? [])];

  return function authMiddleware(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;

    if (publicPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
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
