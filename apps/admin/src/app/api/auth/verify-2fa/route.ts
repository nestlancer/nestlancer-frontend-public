import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  applyHttpOnlyAuthCookies,
  extractGatewayError,
  gatewayErrorStatus,
  getGatewayOrigin,
  logAuthEvent,
  normalizeUserRole,
  portalRoleMismatchResponse,
  roleFromAccessToken,
  type GatewayAuthTokens,
} from '@nestlancer/auth';
import {
  applyCorrelationHeaders,
  resolveCorrelationId,
} from '@nestlancer/config/correlation-id.mjs';
import { withRouteLog } from '@nestlancer/config/route-log.mjs';

const SERVICE = 'nl-prod-frontend-admin';

type Verify2FABody = {
  status?: string;
  data?: GatewayAuthTokens & { user?: unknown };
  message?: string;
  error?: { message?: string; code?: string };
};

function extractVerifyErrorMessage(body: Verify2FABody, fallback: string): string {
  if (typeof body.error?.message === 'string' && body.error.message.trim()) {
    return body.error.message.trim();
  }
  if (typeof body.message === 'string' && body.message.trim()) {
    return body.message.trim();
  }
  return fallback;
}

async function postHandler(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    logAuthEvent({
      event: 'auth.verify_2fa',
      request,
      outcome: 'invalid_body',
      portal: 'admin',
      serviceFallback: SERVICE,
    });
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const headers = new Headers({ 'Content-Type': 'application/json' });
  applyCorrelationHeaders(
    headers,
    resolveCorrelationId({
      headers: request.headers,
      cookieHeader: request.headers.get('cookie') ?? undefined,
    })
  );
  const gatewayRes = await fetch(`${getGatewayOrigin()}/api/v1/auth/verify-2fa`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const body = (await gatewayRes.json().catch(() => ({}))) as Verify2FABody;

  if (!gatewayRes.ok) {
    logAuthEvent({
      event: 'auth.verify_2fa',
      request,
      outcome: gatewayRes.status >= 500 ? 'upstream_error' : 'rejected',
      portal: 'admin',
      upstreamStatus: gatewayRes.status,
      serviceFallback: SERVICE,
      code: body.error?.code,
    });
    const message = extractVerifyErrorMessage(body, 'Verification failed');
    return NextResponse.json(
      {
        message,
        error: { message, code: body.error?.code },
        code: body.error?.code,
      },
      { status: gatewayRes.status }
    );
  }

  const data = body.data;
  if (!data?.accessToken || !data.refreshToken) {
    const gatewayError = extractGatewayError(data);
    if (gatewayError) {
      logAuthEvent({
        event: 'auth.verify_2fa',
        request,
        outcome: 'rejected',
        portal: 'admin',
        upstreamStatus: gatewayRes.status,
        serviceFallback: SERVICE,
      });
      return NextResponse.json({ message: gatewayError }, { status: gatewayErrorStatus(data) });
    }
    logAuthEvent({
      event: 'auth.verify_2fa',
      request,
      outcome: 'upstream_error',
      portal: 'admin',
      upstreamStatus: gatewayRes.status,
      serviceFallback: SERVICE,
    });
    return NextResponse.json({ message: 'Invalid verification response' }, { status: 502 });
  }

  // NL-BV-F1-01: same portal gate as login — 2FA must not mint admin cookies for clients.
  const portalMismatch = portalRoleMismatchResponse(
    request,
    'admin',
    normalizeUserRole(data.user) || roleFromAccessToken(data.accessToken),
    SERVICE
  );
  if (portalMismatch) return portalMismatch;

  logAuthEvent({
    event: 'auth.verify_2fa',
    request,
    outcome: 'ok',
    portal: 'admin',
    upstreamStatus: gatewayRes.status,
    serviceFallback: SERVICE,
  });

  const response = NextResponse.json({
    status: 'success',
    data: {
      accessToken: data.accessToken,
      expiresIn: data.expiresIn,
      tokenType: data.tokenType,
      user: data.user,
    },
  });

  const rememberMe =
    typeof payload === 'object' &&
    payload !== null &&
    (payload as { rememberMe?: unknown }).rememberMe === true;

  applyHttpOnlyAuthCookies(response, data, { rememberMe });
  return response;
}

export const POST = withRouteLog(postHandler, { service: SERVICE, event: 'http.route' });
