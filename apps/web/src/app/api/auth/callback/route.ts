import { NextResponse } from 'next/server';

import { logAuthEvent } from '@nestlancer/auth';
import { withRouteLog } from '@nestlancer/config/route-log.mjs';

const SERVICE = 'nl-prod-frontend-web';

/** Hosts this callback may redirect to when NEXT_PUBLIC_APP_URL is unset. */
const TRUSTED_APP_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  'app.nestlancer.com',
  'dev-app.nestlancer.com',
]);

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isTrustedAppHost(hostname: string): boolean {
  return TRUSTED_APP_HOSTS.has(hostname.toLowerCase());
}

function trustedOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  const origin = normalizeOrigin(value);
  if (!origin) return null;
  try {
    return isTrustedAppHost(new URL(origin).hostname) ? origin : null;
  } catch {
    return null;
  }
}

/**
 * Prefer the configured public app URL.
 * Forwarded Host is used only for known Nestlancer / local hosts — never an arbitrary header.
 */
function publicAppOrigin(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) {
    const origin = normalizeOrigin(envUrl);
    if (origin) return origin;
  }

  const forwardedProto = request.headers
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  const proto =
    forwardedProto === 'http' || forwardedProto === 'https'
      ? forwardedProto
      : normalizeOrigin(request.url)?.startsWith('https')
        ? 'https'
        : 'http';
  const host =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host')?.trim();
  if (host) {
    const origin = trustedOrigin(`${proto}://${host}`);
    if (origin) return origin;
  }

  const fromRequest = trustedOrigin(request.url);
  if (fromRequest) return fromRequest;

  if (process.env.NODE_ENV === 'production') return 'https://app.nestlancer.com';
  return 'http://localhost:9000';
}

async function getHandler(request: Request) {
  const origin = publicAppOrigin(request);

  // This app does not exchange OAuth codes. Any code here must not look like a session.
  logAuthEvent({
    event: 'auth.callback',
    request,
    outcome: 'rejected',
    portal: 'client',
    serviceFallback: SERVICE,
    code: 'invalid_callback',
  });
  return NextResponse.redirect(new URL('/login?error=invalid_callback', origin));
}

export const GET = withRouteLog(getHandler, { service: SERVICE, event: 'http.route' });
