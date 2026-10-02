import { NextResponse } from 'next/server';

import { readAuthCookiesFromStore } from '@nestlancer/auth/server';
import {
  assertSameOrigin,
  clearHttpOnlyAuthCookies,
  getGatewayOrigin,
  logAuthEvent,
  proxyGatewayAuth,
} from '@nestlancer/auth';
import {
  applyCorrelationHeaders,
  resolveCorrelationId,
} from '@nestlancer/config/correlation-id.mjs';
import { withRouteLog } from '@nestlancer/config/route-log.mjs';

const SERVICE = 'nl-prod-frontend-admin';

/** Same-origin logout — revokes refresh session and clears HttpOnly auth cookies. */
async function postHandler(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  let refreshToken: string | null = null;
  try {
    const body = (await request.json()) as { refreshToken?: string };
    if (body?.refreshToken && typeof body.refreshToken === 'string') {
      refreshToken = body.refreshToken;
    }
  } catch {
    /* optional body */
  }

  const cookieTokens = await readAuthCookiesFromStore();
  if (!refreshToken) {
    refreshToken = cookieTokens.refreshToken;
  }

  if (refreshToken) {
    const logoutHeaders: HeadersInit = {};
    if (cookieTokens.accessToken) {
      logoutHeaders.Authorization = `Bearer ${cookieTokens.accessToken}`;
    }
    await proxyGatewayAuth('/api/v1/auth/logout', {
      method: 'POST',
      refreshToken,
      headers: logoutHeaders,
      incomingRequest: request,
    }).catch(() => undefined);
  } else if (cookieTokens.accessToken) {
    const logoutAllHeaders = new Headers({
      Authorization: `Bearer ${cookieTokens.accessToken}`,
    });
    applyCorrelationHeaders(
      logoutAllHeaders,
      resolveCorrelationId({
        headers: request.headers,
        cookieHeader: request.headers.get('cookie') ?? undefined,
      })
    );
    await fetch(`${getGatewayOrigin()}/api/v1/auth/logout-all`, {
      method: 'POST',
      headers: logoutAllHeaders,
      cache: 'no-store',
    }).catch(() => undefined);
  }

  logAuthEvent({
    event: 'auth.logout',
    request,
    outcome: 'ok',
    portal: 'admin',
    serviceFallback: SERVICE,
  });

  const response = NextResponse.json({ status: 'success', data: { loggedOut: true } });
  clearHttpOnlyAuthCookies(response);
  return response;
}

export const POST = withRouteLog(postHandler, { service: SERVICE, event: 'http.route' });
