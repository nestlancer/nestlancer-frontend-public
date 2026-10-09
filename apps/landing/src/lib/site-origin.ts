/**
 * Resolve the client-portal origin for marketing → app redirects and SEO.
 * See apps/web/src/lib/site-origin.ts — keep behaviour aligned.
 */

const DEFAULT_APP_ORIGIN = 'https://app.nestlancer.com';

function trimOrigin(raw: string | undefined | null): string {
  return (raw ?? '').trim().replace(/\/$/, '');
}

export function isLoopbackOrigin(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return /localhost|127\.0\.0\.1/.test(url);
  }
}

function runtimeAppOrigin(): string {
  if (typeof process === 'undefined') return '';
  return trimOrigin(process.env.APP_ORIGIN || process.env.WEB_APP_ORIGIN);
}

export function getSiteOrigin(): string {
  const runtime = runtimeAppOrigin();
  if (runtime) return runtime;

  const raw = trimOrigin(
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_APP_URL : undefined
  );
  if (raw && !isLoopbackOrigin(raw)) return raw;

  // Production builds must never fall back to localhost (NL-BUG-CMS-001/002).
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return DEFAULT_APP_ORIGIN;
  }
  return raw || 'http://localhost:9000';
}

/** NL-BV-F4-01: only literal http/https — reject `https://evil.com` proto injection. */
function normalizeForwardedProto(
  raw: string | null | undefined,
  fallback: 'http' | 'https'
): 'http' | 'https' {
  const proto = (raw ?? '').split(',')[0]?.trim().toLowerCase() || '';
  return proto === 'http' || proto === 'https' ? proto : fallback;
}

/** Hostname (+ optional port) from Host / X-Forwarded-Host — no suffix tricks. */
function parseForwardedHost(raw: string | null | undefined): { hostname: string; port: string } {
  const host = (raw ?? '').split(',')[0]?.trim().toLowerCase() || '';
  if (!host) return { hostname: '', port: '' };
  if (host.startsWith('[')) {
    const end = host.indexOf(']');
    if (end === -1) return { hostname: '', port: '' };
    const hostname = host.slice(1, end);
    const rest = host.slice(end + 1);
    const port = rest.startsWith(':') ? rest.slice(1) : '';
    return { hostname, port };
  }
  const colon = host.lastIndexOf(':');
  if (colon > -1 && host.indexOf(':') === colon) {
    return { hostname: host.slice(0, colon), port: host.slice(colon + 1) };
  }
  return { hostname: host, port: '' };
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function resolveWebAppOriginFromHost(input: {
  host?: string | null;
  proto?: string | null;
}): string {
  const { hostname, port } = parseForwardedHost(input.host);
  const loopback = isLoopbackHostname(hostname);
  const proto = normalizeForwardedProto(input.proto, loopback ? 'http' : 'https');

  if (
    hostname === 'nestlancer.com' ||
    hostname === 'www.nestlancer.com' ||
    hostname === 'landing.nestlancer.com'
  ) {
    return 'https://app.nestlancer.com';
  }

  if (
    hostname === 'dev-landing.nestlancer.com' ||
    hostname.endsWith('.dev-landing.nestlancer.com')
  ) {
    return 'https://dev-app.nestlancer.com';
  }
  // Keep prior `dev-landing.*` marketing hosts (exact suffix under nestlancer.com only).
  if (hostname.startsWith('dev-landing.') && hostname.endsWith('.nestlancer.com')) {
    return 'https://dev-app.nestlancer.com';
  }

  if (loopback) {
    if (port === '9020' || port === '9120') {
      return `${proto}://localhost:9000`;
    }
    const runtime = runtimeAppOrigin();
    if (runtime) return runtime;
    return 'http://localhost:9000';
  }

  return getSiteOrigin();
}

export function absoluteUrl(path = '/'): string {
  const origin = getSiteOrigin();
  if (!path || path === '/') return origin;
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}
