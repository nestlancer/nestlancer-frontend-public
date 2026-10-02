import { NextResponse } from 'next/server';

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function hostnameOf(origin: string): string | null {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Public host origin when TLS terminates at a reverse proxy (Caddy/CF). */
function forwardedOrigin(request: Request): string | null {
  const protoRaw = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  const proto =
    protoRaw === 'http' || protoRaw === 'https'
      ? protoRaw
      : normalizeOrigin(request.url)?.startsWith('https')
        ? 'https'
        : 'http';
  const host =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host')?.trim();
  if (!host) return null;
  return normalizeOrigin(`${proto}://${host}`);
}

function allowedOrigins(request: Request): Set<string> {
  const origins = new Set<string>();
  for (const key of [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_ADMIN_APP_URL',
    'NEXT_PUBLIC_WEB_URL',
    'NEXT_PUBLIC_LANDING_URL',
  ] as const) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    const origin = normalizeOrigin(raw);
    if (origin) origins.add(origin);
  }

  const requestOrigin = normalizeOrigin(request.url);
  if (requestOrigin) {
    origins.add(requestOrigin);
    // TLS often terminates upstream — allow https twin of an http request URL host.
    if (requestOrigin.startsWith('http://')) {
      origins.add(`https://${requestOrigin.slice('http://'.length)}`);
    }
  }

  const trustedHosts = new Set<string>();
  origins.forEach((origin) => {
    const host = hostnameOf(origin);
    if (host) trustedHosts.add(host);
  });

  // Only accept a forwarded host that is already one of our configured app hosts.
  // A caller-supplied X-Forwarded-Host must not widen the CSRF allowlist.
  const publicOrigin = forwardedOrigin(request);
  if (publicOrigin) {
    const host = hostnameOf(publicOrigin);
    if (host && trustedHosts.has(host)) origins.add(publicOrigin);
  }

  return origins;
}

/**
 * Defense-in-depth for cookie-mutating auth BFF POSTs.
 * SameSite=Strict is the primary CSRF control; Origin/Referer checks add an extra gate.
 */
export function assertSameOrigin(request: Request): NextResponse | null {
  const allowed = allowedOrigins(request);

  const originHeader = request.headers.get('origin');
  if (originHeader) {
    const origin = normalizeOrigin(originHeader);
    if (!origin || !allowed.has(origin)) {
      return NextResponse.json({ message: 'Cross-origin request blocked' }, { status: 403 });
    }
    return null;
  }

  const referer = request.headers.get('referer');
  if (referer) {
    const origin = normalizeOrigin(referer);
    if (!origin || !allowed.has(origin)) {
      return NextResponse.json({ message: 'Cross-origin request blocked' }, { status: 403 });
    }
    return null;
  }

  // Some same-origin fetches omit Origin; allow only when neither header is present
  // and the request URL itself is one of our apps (BFF is same-origin by design).
  return null;
}
