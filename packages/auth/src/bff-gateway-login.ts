import { NextResponse } from 'next/server';

import { resolveCorrelationId } from '@nestlancer/config/correlation-id.mjs';

import { logAuthEvent } from './auth-log';
import { getGatewayOrigin } from './bff';

export type GatewayLoginPortal = 'client' | 'admin';

export type GatewayLoginBody = {
  status?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    tokenType?: string;
    requires2FA?: boolean;
    authSessionId?: string;
    methodsAvailable?: string[];
    user?: unknown;
  };
  message?: string;
  error?: { message?: string; code?: string };
};

/** True when gateway returned a 2FA challenge payload (tokens not issued yet). */
export function isGateway2FAChallenge(
  data: GatewayLoginBody['data'] | undefined
): data is NonNullable<GatewayLoginBody['data']> & {
  requires2FA: true;
  authSessionId: string;
} {
  if (!data || typeof data !== 'object') return false;
  return (
    data.requires2FA === true &&
    typeof data.authSessionId === 'string' &&
    data.authSessionId.length > 0 &&
    !data.accessToken
  );
}

function extractLoginErrorMessage(body: GatewayLoginBody, upstreamStatus: number): string {
  if (typeof body.error?.message === 'string' && body.error.message.trim()) {
    return body.error.message;
  }
  if (typeof body.message === 'string' && body.message.trim()) {
    return body.message;
  }
  if (upstreamStatus === 403) {
    return 'Login failed — upstream gateway blocked the request. Check API_UPSTREAM points to the internal gateway, not the public Cloudflare URL.';
  }
  return 'Login failed';
}

/** Forward browser IP / UA headers so auth sessions store the real client IP (NL-BUG-AUTH-6). */
export function buildGatewayLoginHeaders(request: Request): HeadersInit {
  const correlationId = resolveCorrelationId({
    headers: request.headers,
    cookieHeader: request.headers.get('cookie') ?? undefined,
  });
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': correlationId,
    'X-Correlation-ID': correlationId,
  };
  if (request.headers.get('user-agent')) {
    headers['User-Agent'] = request.headers.get('user-agent') as string;
  }
  headers['Origin'] = request.headers.get('origin') || new URL(request.url).origin;
  if (request.headers.get('referer')) {
    headers['Referer'] = request.headers.get('referer') as string;
  }
  if (request.headers.get('cf-connecting-ip')) {
    headers['CF-Connecting-IP'] = request.headers.get('cf-connecting-ip') as string;
  }
  if (request.headers.get('x-forwarded-for')) {
    headers['X-Forwarded-For'] = request.headers.get('x-forwarded-for') as string;
  } else if (request.headers.get('x-real-ip')) {
    headers['X-Forwarded-For'] = request.headers.get('x-real-ip') as string;
  }
  return headers;
}

export async function postGatewayLogin(
  request: Request,
  portal: GatewayLoginPortal,
  payload: unknown
): Promise<{ gatewayRes: Response; body: GatewayLoginBody; rawText: string }> {
  const loginBody =
    payload && typeof payload === 'object'
      ? { ...(payload as Record<string, unknown>), portal }
      : payload;

  let gatewayRes: Response;
  try {
    gatewayRes = await fetch(`${getGatewayOrigin()}/api/v1/auth/login`, {
      method: 'POST',
      headers: buildGatewayLoginHeaders(request),
      body: JSON.stringify(loginBody),
      cache: 'no-store',
    });
  } catch (err) {
    logAuthEvent({
      event: 'auth.login',
      request,
      outcome: 'upstream_error',
      portal,
      serviceFallback: portal === 'admin' ? 'nl-prod-frontend-admin' : 'nl-prod-frontend-web',
    });
    throw err;
  }

  const rawText = await gatewayRes.text();
  let body: GatewayLoginBody = {};
  if (rawText.trim()) {
    try {
      body = JSON.parse(rawText) as GatewayLoginBody;
    } catch {
      body = { message: rawText.slice(0, 240) };
    }
  }

  const serviceFallback = portal === 'admin' ? 'nl-prod-frontend-admin' : 'nl-prod-frontend-web';
  if (isGateway2FAChallenge(body.data)) {
    logAuthEvent({
      event: 'auth.login',
      request,
      outcome: '2fa',
      portal,
      upstreamStatus: gatewayRes.status,
      serviceFallback,
    });
  } else if (gatewayRes.ok && body.data?.accessToken) {
    logAuthEvent({
      event: 'auth.login',
      request,
      outcome: 'ok',
      portal,
      upstreamStatus: gatewayRes.status,
      serviceFallback,
    });
  } else if (gatewayRes.status >= 500) {
    logAuthEvent({
      event: 'auth.login',
      request,
      outcome: 'upstream_error',
      portal,
      upstreamStatus: gatewayRes.status,
      serviceFallback,
      code: body.error?.code,
    });
  } else if (!gatewayRes.ok) {
    logAuthEvent({
      event: 'auth.login',
      request,
      outcome: 'rejected',
      portal,
      upstreamStatus: gatewayRes.status,
      serviceFallback,
      code: body.error?.code,
    });
  }

  return { gatewayRes, body, rawText };
}

export function gatewayLoginErrorResponse(
  gatewayRes: Response,
  body: GatewayLoginBody
): NextResponse {
  const message = extractLoginErrorMessage(body, gatewayRes.status);
  const retryAfter = gatewayRes.headers.get('Retry-After');
  const code =
    body.error?.code ??
    (gatewayRes.status === 403 && !body.error?.code ? 'BFF_UPSTREAM_FORBIDDEN' : undefined);

  return NextResponse.json(
    {
      message,
      error: { message, code },
      code,
      upstreamStatus: gatewayRes.status,
    },
    {
      status: gatewayRes.status,
      headers: retryAfter ? { 'Retry-After': retryAfter } : undefined,
    }
  );
}

export { extractLoginErrorMessage };
