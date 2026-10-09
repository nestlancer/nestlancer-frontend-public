import { NextResponse } from 'next/server';

import { logAuthEvent } from './auth-log';

export type AuthPortal = 'client' | 'admin';

/** Role string from gateway login / verify-2fa user payload. */
export function normalizeUserRole(user: unknown): string {
  if (!user || typeof user !== 'object') return '';
  const role = (user as { role?: unknown }).role;
  return typeof role === 'string' ? role.toUpperCase() : '';
}

/**
 * Read `role` from a JWT access token payload (no signature verify — gateway already minted it).
 * Used by BFF refresh when the token envelope has no `user` object (NL-BV-W7-03).
 */
export function roleFromAccessToken(accessToken: string): string {
  const parts = accessToken.split('.');
  if (parts.length < 2 || !parts[1]) return '';
  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(json) as { role?: unknown };
    return typeof payload.role === 'string' ? payload.role.toUpperCase() : '';
  } catch {
    return '';
  }
}

/**
 * Server-side portal gate (NL-BV-F1-01): refuse to mint HttpOnly cookies when the
 * authenticated role does not belong on this app.
 */
export function portalRoleMismatchResponse(
  request: Request,
  portal: AuthPortal,
  role: string,
  serviceFallback: string
): NextResponse | null {
  if (portal === 'client' && role === 'ADMIN') {
    logAuthEvent({
      event: 'auth.login',
      request,
      outcome: 'portal_mismatch',
      portal: 'client',
      serviceFallback,
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

  // Fail closed: missing/unparsed role must not mint admin cookies (NL-BV-C3-F1-01).
  if (portal === 'admin' && role !== 'ADMIN') {
    logAuthEvent({
      event: 'auth.login',
      request,
      outcome: 'portal_mismatch',
      portal: 'admin',
      serviceFallback,
      code: 'AUTH_PORTAL_MISMATCH',
    });
    return NextResponse.json(
      {
        message: 'This portal is for operators only. Use the client app to sign in.',
        error: {
          message: 'This portal is for operators only. Use the client app to sign in.',
          code: 'AUTH_PORTAL_MISMATCH',
        },
        code: 'AUTH_PORTAL_MISMATCH',
      },
      { status: 403 }
    );
  }

  return null;
}
