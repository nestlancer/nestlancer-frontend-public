import { NextResponse } from 'next/server';

import {
  assertSameOrigin,
  applyHttpOnlyAuthCookies,
  extractGatewayError,
  gatewayErrorStatus,
  gatewayLoginErrorResponse,
  isGateway2FAChallenge,
  logAuthEvent,
  postGatewayLogin,
  type GatewayAuthTokens,
} from '@nestlancer/auth';
import { withRouteLog } from '@nestlancer/config/route-log.mjs';

const SERVICE = 'nl-prod-frontend-web';

/** Same-origin login — sets HttpOnly cookies; returns access token for in-memory API use. */
async function postHandler(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    logAuthEvent({
      event: 'auth.login',
      request,
      outcome: 'invalid_body',
      portal: 'client',
      serviceFallback: SERVICE,
    });
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const { gatewayRes, body } = await postGatewayLogin(request, 'client', payload);

  // 2FA challenge may arrive as HTTP 202 with success/partial envelope.
  if (gatewayRes.ok || gatewayRes.status === 202) {
    const data = body.data;
    if (isGateway2FAChallenge(data)) {
      return NextResponse.json({
        status: 'success',
        data: {
          requires2FA: true,
          authSessionId: data.authSessionId,
          methodsAvailable: data.methodsAvailable ?? ['totp', 'backupCode'],
        },
      });
    }
  }

  if (!gatewayRes.ok) {
    return gatewayLoginErrorResponse(gatewayRes, body);
  }

  const data = body.data;
  if (!data) {
    return NextResponse.json({ message: 'Invalid login response' }, { status: 502 });
  }

  const gatewayError = extractGatewayError(data);
  if (gatewayError) {
    return NextResponse.json({ message: gatewayError }, { status: gatewayErrorStatus(data) });
  }

  // 2FA challenge — no session cookies yet
  if (!data.accessToken || !data.refreshToken) {
    return NextResponse.json({ status: 'success', data });
  }

  // Server-side role gate — admin operators must use the admin app.
  const role = String((data.user as { role?: string } | undefined)?.role ?? '').toUpperCase();
  if (role === 'ADMIN') {
    logAuthEvent({
      event: 'auth.login',
      request,
      outcome: 'portal_mismatch',
      portal: 'client',
      serviceFallback: SERVICE,
      code: 'AUTH_PORTAL_MISMATCH',
    });
    return NextResponse.json(
      {
        message: 'Admin accounts must sign in on the admin app',
        error: {
          message: 'Admin accounts must sign in on the admin app',
          code: 'AUTH_PORTAL_MISMATCH',
        },
        code: 'AUTH_PORTAL_MISMATCH',
      },
      { status: 403 }
    );
  }

  const rememberMe =
    typeof payload === 'object' &&
    payload !== null &&
    (payload as { rememberMe?: unknown }).rememberMe === true;

  const response = NextResponse.json({
    status: 'success',
    data: {
      accessToken: data.accessToken,
      expiresIn: data.expiresIn,
      tokenType: data.tokenType,
      user: data.user,
    },
  });

  applyHttpOnlyAuthCookies(response, data as GatewayAuthTokens, { rememberMe });
  return response;
}

export const POST = withRouteLog(postHandler, { service: SERVICE, event: 'http.route' });
