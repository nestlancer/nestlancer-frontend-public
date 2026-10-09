import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { readAuthCookiesFromStore } from '@nestlancer/auth/server';
import {
  assertSameOrigin,
  applyHttpOnlyAuthCookies,
  buildGatewayLoginHeaders,
  clearHttpOnlyAuthCookies,
  getGatewayOrigin,
  IMPERSONATION_COOKIE,
  logAuthEvent,
  portalRoleMismatchResponse,
  resolveRememberMeFromRequest,
  roleFromAccessToken,
  type GatewayAuthTokens,
} from '@nestlancer/auth';
import { withRouteLog } from '@nestlancer/config/route-log.mjs';

const SERVICE = 'nl-prod-frontend-web';

type RefreshErrorPayload = {
  status?: string;
  data?: GatewayAuthTokens;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    details?: Array<{ reason?: string; retryAfter?: number } | Record<string, unknown>>;
  };
};

/** Quiet “no usable session” — clears cookies only when there is no refresh cookie. */
function noSessionResponse(): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  clearHttpOnlyAuthCookies(response);
  return response;
}

/** Explicit refresh failure (body token rejected) — NL-BUG-AUTH-002. */
function unauthorizedRefreshResponse(): NextResponse {
  const response = NextResponse.json(
    {
      status: 'error',
      error: {
        code: 'AUTH_004',
        message: 'Invalid or expired refresh token',
      },
    },
    { status: 401 }
  );
  clearHttpOnlyAuthCookies(response);
  return response;
}

/** Upstream/network blip — keep HttpOnly cookies so the session remains recoverable. */
function transientUpstreamResponse(retryAfter = 5): NextResponse {
  return NextResponse.json(
    {
      status: 'error',
      error: {
        code: 'AUTH_UPSTREAM',
        message: 'Auth service temporarily unavailable',
      },
    },
    { status: 503, headers: { 'Retry-After': String(retryAfter) } }
  );
}

function isDefinitiveAuthRejection(status: number): boolean {
  return status === 401 || status === 403;
}

/** Concurrent rotation / lock contention — must NOT wipe cookies (NL-BUG-SESSION-01). */
function isTransientRefreshFailure(status: number, payload: RefreshErrorPayload): boolean {
  if (status === 503 || status === 502 || status === 429) return true;
  const code = payload.error?.code;
  if (code === 'AUTH_REFRESH_BUSY' || code === 'AUTH_UPSTREAM') return true;
  const reason = payload.error?.details?.[0];
  const reasonCode =
    reason && typeof reason === 'object' && 'reason' in reason
      ? String((reason as { reason?: string }).reason ?? '')
      : '';
  return reasonCode === 'refreshInFlight' || reasonCode === 'refreshLockUnavailable';
}

function retryAfterFromPayload(payload: RefreshErrorPayload, headerValue: string | null): number {
  const fromHeader = headerValue ? Number.parseInt(headerValue, 10) : NaN;
  if (Number.isFinite(fromHeader) && fromHeader > 0) return fromHeader;
  const detail = payload.error?.details?.[0] as { retryAfter?: number } | undefined;
  if (typeof detail?.retryAfter === 'number' && detail.retryAfter > 0) return detail.retryAfter;
  return 5;
}

async function postHandler(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  // Support sessions must not be swapped for a leftover client refresh cookie.
  const impersonation = (await cookies()).get(IMPERSONATION_COOKIE)?.value;
  if (impersonation) {
    return new NextResponse(null, { status: 204 });
  }

  let refreshToken: string | null = null;
  let tokenFromBody = false;

  try {
    const body = (await request.json()) as { refreshToken?: string };
    if (body?.refreshToken && typeof body.refreshToken === 'string') {
      refreshToken = body.refreshToken.trim() || null;
      tokenFromBody = Boolean(refreshToken);
    }
  } catch {
    /* body optional when HttpOnly cookie present */
  }

  if (!refreshToken) {
    const cookieTokens = await readAuthCookiesFromStore();
    refreshToken = cookieTokens.refreshToken?.trim() || null;
  }

  if (!refreshToken) {
    logAuthEvent({
      event: 'auth.refresh',
      request,
      outcome: 'no_session',
      portal: 'client',
      serviceFallback: SERVICE,
    });
    return noSessionResponse();
  }

  // NL-BUG-AUTH-6: forward CF/XFF so refresh does not overwrite session IP with Docker hop.
  const headers = new Headers(buildGatewayLoginHeaders(request));

  let gatewayRes: Response;
  try {
    gatewayRes = await fetch(`${getGatewayOrigin()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
  } catch {
    logAuthEvent({
      event: 'auth.refresh',
      request,
      outcome: 'upstream_error',
      portal: 'client',
      serviceFallback: SERVICE,
    });
    return transientUpstreamResponse();
  }

  const payload = (await gatewayRes.json().catch(() => ({}))) as RefreshErrorPayload;

  if (!gatewayRes.ok) {
    if (isTransientRefreshFailure(gatewayRes.status, payload)) {
      logAuthEvent({
        event: 'auth.refresh',
        request,
        outcome: 'upstream_error',
        portal: 'client',
        upstreamStatus: gatewayRes.status,
        serviceFallback: SERVICE,
        code: payload.error?.code ?? 'AUTH_UPSTREAM',
      });
      return transientUpstreamResponse(
        retryAfterFromPayload(payload, gatewayRes.headers.get('Retry-After'))
      );
    }
    // Cookie-only silent refresh: clear session only on definitive auth rejection.
    // refreshReuse from a raced sibling must not Set-Cookie-clear over the winner
    // (NL-BUG-SESSION-01) — keep cookies and signal transient so the client retries.
    if (isDefinitiveAuthRejection(gatewayRes.status)) {
      const rejectReason =
        payload.error?.details?.[0] &&
        typeof payload.error.details[0] === 'object' &&
        'reason' in payload.error.details[0]
          ? String((payload.error.details[0] as { reason?: string }).reason ?? '')
          : '';
      if (!tokenFromBody && rejectReason === 'refreshReuse') {
        logAuthEvent({
          event: 'auth.refresh',
          request,
          outcome: 'upstream_error',
          portal: 'client',
          upstreamStatus: gatewayRes.status,
          serviceFallback: SERVICE,
          code: 'AUTH_REFRESH_BUSY',
        });
        return transientUpstreamResponse(2);
      }
      logAuthEvent({
        event: 'auth.refresh',
        request,
        outcome: 'rejected',
        portal: 'client',
        upstreamStatus: gatewayRes.status,
        serviceFallback: SERVICE,
        code: 'AUTH_004',
      });
      return tokenFromBody ? unauthorizedRefreshResponse() : noSessionResponse();
    }
    logAuthEvent({
      event: 'auth.refresh',
      request,
      outcome: 'upstream_error',
      portal: 'client',
      upstreamStatus: gatewayRes.status,
      serviceFallback: SERVICE,
    });
    return transientUpstreamResponse();
  }

  const tokens = payload.data;
  if (!tokens?.accessToken || !tokens.refreshToken) {
    logAuthEvent({
      event: 'auth.refresh',
      request,
      outcome: 'rejected',
      portal: 'client',
      upstreamStatus: gatewayRes.status,
      serviceFallback: SERVICE,
    });
    return tokenFromBody ? unauthorizedRefreshResponse() : noSessionResponse();
  }

  // NL-BV-W7-03: same portal gate as login/verify-2fa — never mint client cookies for ADMIN.
  const portalMismatch = portalRoleMismatchResponse(
    request,
    'client',
    roleFromAccessToken(tokens.accessToken),
    SERVICE
  );
  if (portalMismatch) {
    clearHttpOnlyAuthCookies(portalMismatch);
    return portalMismatch;
  }

  logAuthEvent({
    event: 'auth.refresh',
    request,
    outcome: 'ok',
    portal: 'client',
    upstreamStatus: gatewayRes.status,
    serviceFallback: SERVICE,
  });

  const response = NextResponse.json({
    status: 'success',
    data: {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType,
    },
  });

  applyHttpOnlyAuthCookies(response, tokens, {
    rememberMe: resolveRememberMeFromRequest(request),
  });
  return response;
}

export const POST = withRouteLog(postHandler, { service: SERVICE, event: 'http.route' });
