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

export function resolveWebAppOriginFromHost(input: {
  host?: string | null;
  proto?: string | null;
}): string {
  const host = (input.host ?? '').split(',')[0]?.trim().toLowerCase() || '';
  const proto =
    (input.proto || (host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https'))
      .split(',')[0]
      ?.trim()
      .toLowerCase() || 'https';

  if (
    host === 'nestlancer.com' ||
    host === 'www.nestlancer.com' ||
    host === 'landing.nestlancer.com'
  ) {
    return 'https://app.nestlancer.com';
  }

  if (host.startsWith('dev-landing.') || host === 'dev-landing.nestlancer.com') {
    return 'https://dev-app.nestlancer.com';
  }

  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    if (host.endsWith(':9020') || host.endsWith(':9120')) {
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
