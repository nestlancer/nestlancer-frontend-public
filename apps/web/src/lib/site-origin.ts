/**
 * Resolve the client-portal origin for marketing → app redirects and SEO.
 *
 * NEXT_PUBLIC_APP_URL is inlined at build time. Local prod-docker builds previously
 * baked `http://localhost:9000`, which shipped dead redirects/sitemaps on real hosts.
 * Prefer (1) non-inlined APP_ORIGIN / WEB_APP_ORIGIN, (2) non-loopback NEXT_PUBLIC,
 * (3) production default.
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

/** Server-only runtime override (not NEXT_PUBLIC — not baked by Next at build). */
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

/**
 * Host-aware origin for middleware / request handlers.
 * When the request Host is a public Nestlancer marketing host, always target the
 * production (or matching) app host — never localhost.
 */
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
    // Local landing (:9020 / :9120) → local web (:9000 / :9100 via compose publish)
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
