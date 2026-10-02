import { z } from 'zod';

const DEV_API_FALLBACK = 'https://dev-api.nestlancer.com';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_WS_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_ADMIN_APP_URL: z.string().url().optional(),
  /** Optional alias for admin public links; falls back to NEXT_PUBLIC_APP_URL in app code. */
  NEXT_PUBLIC_WEB_URL: z.string().url().optional(),
  /** Socket.IO engine path (e.g. `/ws/socket.io` when the gateway mounts under `/ws`). */
  NEXT_PUBLIC_SOCKET_IO_PATH: z.string().startsWith('/').default('/ws/socket.io'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Resolve the public API origin.
 * Production / production builds must set NEXT_PUBLIC_API_URL — never silently use dev-api.
 * Development may fall back to the shared dev API host.
 *
 * On the server, prefer `API_UPSTREAM` when set so SSR does not hairpin through the
 * public app/admin host (same-origin proxy is browser-only).
 */
export function resolvePublicApiUrl(override?: string): string {
  const fromOverride = override?.trim();
  if (fromOverride) return fromOverride.replace(/\/$/, '');

  // Avoid bare `window` — this package's tsconfig has no DOM lib.
  if (typeof (globalThis as { window?: unknown }).window === 'undefined') {
    const upstream = typeof process !== 'undefined' ? process.env.API_UPSTREAM?.trim() : undefined;
    if (upstream) return upstream.replace(/\/$/, '');
  }

  const fromEnv =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL?.trim() : undefined;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (isProductionRuntime()) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is required in production (refusing silent fallback to dev-api)'
    );
  }
  return DEV_API_FALLBACK;
}

/** Resolve WebSocket origin (falls back to public API URL). */
export function resolvePublicWsUrl(override?: string): string {
  const fromOverride = override?.trim();
  if (fromOverride) return sanitizeWsOrigin(fromOverride);

  const fromEnv =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_WS_URL?.trim() : undefined;
  if (fromEnv) return sanitizeWsOrigin(fromEnv);

  return sanitizeWsOrigin(resolvePublicApiUrl());
}

/** NL-BUG-PAY-003: never allow a production build to silently use the dev-api host. */
function sanitizeWsOrigin(raw: string): string {
  const origin = raw.replace(/\/$/, '');
  const isProd =
    typeof process !== 'undefined' &&
    (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_APP_ENV === 'production');
  if (isProd && /(?:^|\/\/)dev-api\.nestlancer\.com\b/i.test(origin)) {
    throw new Error(
      'NEXT_PUBLIC_WS_URL points at dev-api in a production build — set it to https://api.nestlancer.com'
    );
  }
  return origin;
}

/** Resolve server-side upstream for BFF/proxy (API_UPSTREAM, then public API URL). */
export function resolveApiUpstream(override?: string): string {
  const fromOverride = override?.trim();
  if (fromOverride) return fromOverride.replace(/\/$/, '');

  const upstream = typeof process !== 'undefined' ? process.env.API_UPSTREAM?.trim() : undefined;
  if (upstream) return upstream.replace(/\/$/, '');

  return resolvePublicApiUrl();
}

/** Validates public env vars available in the browser (NEXT_PUBLIC_*). */
export function getClientEnv(): ClientEnv {
  const apiUrl = (() => {
    try {
      return resolvePublicApiUrl();
    } catch {
      return process.env.NEXT_PUBLIC_API_URL;
    }
  })();

  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || undefined,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || undefined,
    NEXT_PUBLIC_ADMIN_APP_URL: process.env.NEXT_PUBLIC_ADMIN_APP_URL || undefined,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL || undefined,
    NEXT_PUBLIC_SOCKET_IO_PATH: process.env.NEXT_PUBLIC_SOCKET_IO_PATH || undefined,
  });
  if (!parsed.success) {
    console.error('Invalid client environment', parsed.error.flatten());
    throw new Error('Invalid NEXT_PUBLIC_* environment configuration');
  }
  return parsed.data;
}
