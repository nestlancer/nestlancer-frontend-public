import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  clearHttpOnlyAuthCookies,
  getGatewayOrigin,
  IMPERSONATION_COOKIE,
  logAuthEvent,
  readImpersonationClaims,
} from '@nestlancer/auth';
import {
  applyCorrelationHeaders,
  resolveCorrelationId,
} from '@nestlancer/config/correlation-id.mjs';
import { withRouteLog } from '@nestlancer/config/route-log.mjs';

const SERVICE = 'nl-prod-frontend-web';

function cookieSecure(): boolean {
  return process.env.NODE_ENV === 'production';
}

function sessionPayload(token: string) {
  const claims = readImpersonationClaims(token);
  if (!claims) return null;
  const expiresIn = Math.max(1, claims.exp - Math.floor(Date.now() / 1000));
  return {
    accessToken: token.trim(),
    sessionId: claims.sessionId,
    email: claims.email ?? '',
    expiresAt: new Date(claims.exp * 1000).toISOString(),
    expiresIn,
  };
}

/** NL-BV-F1-02: claim-shape alone is not enough — gateway must accept the Bearer JWT. */
async function gatewayAcceptsAccessToken(token: string, incoming: Request): Promise<boolean> {
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  applyCorrelationHeaders(
    headers,
    resolveCorrelationId({
      headers: incoming.headers,
      cookieHeader: incoming.headers.get('cookie') ?? undefined,
    })
  );
  try {
    const res = await fetch(`${getGatewayOrigin()}/api/v1/users/profile`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

function applyImpersonationCookie(response: NextResponse, token: string, maxAge: number): void {
  clearHttpOnlyAuthCookies(response);
  response.cookies.set(IMPERSONATION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: cookieSecure(),
    path: '/',
    maxAge,
  });
}

/** Restore a support session after reload. The access JWT stays out of the page URL. */
async function getHandler(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const token = (await cookies()).get(IMPERSONATION_COOKIE)?.value ?? '';
  if (!token) {
    return new NextResponse(null, { status: 204 });
  }

  const session = sessionPayload(token);
  if (!session || !(await gatewayAcceptsAccessToken(session.accessToken, request))) {
    const response = NextResponse.json({ message: 'Support session expired' }, { status: 401 });
    clearHttpOnlyAuthCookies(response);
    return response;
  }

  return NextResponse.json({ status: 'success', data: session });
}

/** Store the support access token in an HttpOnly cookie and drop any real client refresh cookie. */
async function postHandler(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  let accessToken = '';
  try {
    const body = (await request.json()) as { accessToken?: unknown };
    if (typeof body.accessToken === 'string') accessToken = body.accessToken;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const session = sessionPayload(accessToken);
  if (!session || !(await gatewayAcceptsAccessToken(session.accessToken, request))) {
    logAuthEvent({
      event: 'auth.impersonate',
      request,
      outcome: 'rejected',
      portal: 'client',
      serviceFallback: SERVICE,
    });
    return NextResponse.json({ message: 'Support session token was rejected' }, { status: 400 });
  }

  logAuthEvent({
    event: 'auth.impersonate',
    request,
    outcome: 'ok',
    portal: 'client',
    serviceFallback: SERVICE,
  });

  const response = NextResponse.json({ status: 'success', data: session });
  applyImpersonationCookie(response, session.accessToken, session.expiresIn);
  return response;
}

/**
 * Leave the support session on this browser and end the server grant (NL-BUG-IMP-3).
 * Previously relied solely on the admin tab via postMessage — that left orphaned sessions.
 */
async function deleteHandler(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const token = (await cookies()).get(IMPERSONATION_COOKIE)?.value ?? '';
  if (token) {
    const headers = new Headers({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    applyCorrelationHeaders(
      headers,
      resolveCorrelationId({
        headers: request.headers,
        cookieHeader: request.headers.get('cookie') ?? undefined,
      })
    );
    await fetch(`${getGatewayOrigin()}/api/v1/auth/end-impersonation`, {
      method: 'POST',
      headers,
      cache: 'no-store',
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ status: 'success', data: { ended: true } });
  clearHttpOnlyAuthCookies(response);
  return response;
}

export const GET = withRouteLog(getHandler, { service: SERVICE, event: 'http.route' });
export const POST = withRouteLog(postHandler, { service: SERVICE, event: 'http.route' });
export const DELETE = withRouteLog(deleteHandler, { service: SERVICE, event: 'http.route' });
