import type { NextResponse } from 'next/server';

import { resolveApiUpstream } from '@nestlancer/config';
import {
  applyCorrelationHeaders,
  resolveCorrelationId,
} from '@nestlancer/config/correlation-id.mjs';

import {
  ACCESS_TOKEN_COOKIE,
  IMPERSONATION_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REMEMBER_ME_COOKIE,
  SESSION_HINT_COOKIE,
} from './tokenManager';

export interface GatewayAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
}

export type AuthCookieOptions = {
  /** When true, cookies persist ~30 days. When false, session cookies (no Max-Age). */
  rememberMe?: boolean;
};

function gatewayOrigin(): string {
  return resolveApiUpstream();
}

export function getGatewayOrigin(): string {
  return gatewayOrigin();
}

function cookieSecure(): boolean {
  return process.env.NODE_ENV === 'production';
}

const REMEMBER_ME_TTL_SEC = 30 * 24 * 60 * 60;

/** Read the HttpOnly remember-me hint from an incoming request Cookie header. */
export function resolveRememberMeFromRequest(request: Request): boolean {
  const cookie = request.headers.get('cookie') ?? '';
  return /(?:^|;\s*)nl_remember=1(?:;|$)/.test(cookie);
}

/** HttpOnly refresh cookie + readable session hint for silent-refresh gating. */
export function applyHttpOnlyAuthCookies(
  response: NextResponse,
  tokens: GatewayAuthTokens,
  options?: AuthCookieOptions
): void {
  const rememberMe = options?.rememberMe === true;
  const secure = cookieSecure();
  const base = {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure,
    path: '/',
  };
  // Session cookie when rememberMe is off — omit maxAge so the browser clears on exit.
  const lifetime = rememberMe ? { ...base, maxAge: REMEMBER_ME_TTL_SEC } : base;

  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, lifetime);
  // Presence flag only (value is "1"). HttpOnly so it is not a script-readable session signal.
  response.cookies.set(SESSION_HINT_COOKIE, '1', lifetime);
  // Hint for refresh routes to preserve session vs persistent cookie semantics.
  response.cookies.set(REMEMBER_ME_COOKIE, rememberMe ? '1' : '0', lifetime);
}

export function clearHttpOnlyAuthCookies(response: NextResponse): void {
  const secure = cookieSecure();
  const clear = {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure,
    path: '/',
    maxAge: 0,
  };
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', clear);
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', clear);
  response.cookies.set(SESSION_HINT_COOKIE, '', clear);
  response.cookies.set(REMEMBER_ME_COOKIE, '', clear);
  response.cookies.set(IMPERSONATION_COOKIE, '', clear);
}

export async function proxyGatewayAuth(
  path: string,
  init: RequestInit & { refreshToken?: string | null; incomingRequest?: Request } = {}
): Promise<Response> {
  const { refreshToken, incomingRequest, ...fetchInit } = init;
  const headers = new Headers(fetchInit.headers);
  if (refreshToken && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const correlationId = resolveCorrelationId({
    headers: incomingRequest?.headers ?? headers,
    cookieHeader: incomingRequest?.headers.get('cookie') ?? undefined,
  });
  applyCorrelationHeaders(headers, correlationId);

  let body = fetchInit.body;
  if (refreshToken && !body) {
    body = JSON.stringify({ refreshToken });
  }

  return fetch(`${gatewayOrigin()}${path}`, {
    ...fetchInit,
    headers,
    body,
    cache: 'no-store',
  });
}

export type GatewayEnvelope<T> = {
  status?: string;
  data?: T;
  message?: string;
};

export function unwrapGatewayEnvelope<T>(payload: GatewayEnvelope<T>): T | null {
  if (payload?.data && typeof payload.data === 'object') {
    return payload.data;
  }
  return null;
}

/** Detect nested gateway business errors inside a success HTTP response. */
export function extractGatewayError(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (record.status !== 'error') return null;
  const err = record.error;
  if (!err || typeof err !== 'object') return null;
  const message = (err as Record<string, unknown>).message;
  return typeof message === 'string' ? message : null;
}

export function gatewayErrorStatus(data: unknown): number {
  if (!data || typeof data !== 'object') return 400;
  const code = (data as { error?: { code?: string } }).error?.code;
  if (code?.startsWith('AUTH_')) return 401;
  return 400;
}
