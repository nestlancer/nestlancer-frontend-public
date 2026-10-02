/**
 * Public app origins for cross-linking (client portal vs operator console vs marketing).
 * Values must come from `NEXT_PUBLIC_*` at build/dev time (`.env*`, Docker `environment`, etc.).
 * Do not bake localhost defaults here — they leak into nginx-hosted dev.
 */
function trimPublicOrigin(raw: string | undefined): string {
  const t = raw?.trim() ?? '';
  return t.replace(/\/$/, '');
}

export function getWebAppUrl(): string {
  const runtime =
    typeof process !== 'undefined'
      ? (process.env.APP_ORIGIN || process.env.WEB_APP_ORIGIN || '').trim().replace(/\/$/, '')
      : '';
  if (runtime) return runtime;

  const fromPublic = trimPublicOrigin(
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_APP_URL : undefined
  );
  if (fromPublic && !/localhost|127\.0\.0\.1/.test(fromPublic)) return fromPublic;
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return 'https://app.nestlancer.com';
  }
  return fromPublic;
}

export function getAdminAppUrl(): string {
  return trimPublicOrigin(
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ADMIN_APP_URL : undefined
  );
}

/** Marketing / brand site (apex). Prefer over same-origin `/` when leaving the client portal. */
export function getLandingUrl(): string {
  const fromEnv = trimPublicOrigin(
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_LANDING_URL : undefined
  );
  if (fromEnv) return fromEnv;
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return 'https://nestlancer.com';
  }
  return '';
}

/** Absolute URL on the marketing site (`path` like `/about` or `#how-it-works`). */
export function landingUrl(path = '/'): string {
  const origin = getLandingUrl();
  if (!origin) {
    if (!path || path === '/') return '/';
    return path.startsWith('#') ? `/${path}` : path.startsWith('/') ? path : `/${path}`;
  }
  if (!path || path === '/') return origin;
  if (path.startsWith('#')) return `${origin}/${path}`;
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}
