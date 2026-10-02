import { unwrapGatewayBody } from '@nestlancer/api-client';
import { resolvePublicApiUrl } from '@nestlancer/config';
import {
  applyCorrelationHeaders,
  resolveCorrelationId,
} from '@nestlancer/config/correlation-id.mjs';

function resolveApiOrigin(): string {
  return resolvePublicApiUrl();
}

export class GatewayFetchError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly url: string;

  constructor(status: number, url: string, code: string | null = null) {
    super(`Gateway ${status} for ${url}`);
    this.name = 'GatewayFetchError';
    this.status = status;
    this.url = url;
    this.code = code;
  }
}

export function isGatewayMaintenanceError(error: unknown): boolean {
  return (
    error instanceof GatewayFetchError && (error.status === 503 || error.code === 'SYS_MAINTENANCE')
  );
}

/**
 * Server-side fetch to the gateway JSON API (public routes, no Bearer).
 * Unwraps the standard `{ status, data }` envelope (including nested service envelopes).
 */
export async function fetchGatewayJson<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } }
): Promise<T> {
  const origin = resolveApiOrigin();
  const url = path.startsWith('http')
    ? path
    : `${origin}/api/v1${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers({
    Accept: 'application/json',
    ...(init?.headers as Record<string, string>),
  });
  applyCorrelationHeaders(headers, resolveCorrelationId({ headers }));
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
    });
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'network error';
    throw new GatewayFetchError(0, url, `NETWORK:${reason}`);
  }
  if (!res.ok) {
    let code: string | null = null;
    try {
      const body = (await res.json()) as { error?: { code?: unknown } };
      if (typeof body?.error?.code === 'string') code = body.error.code;
    } catch {
      // ignore parse failures
    }
    throw new GatewayFetchError(res.status, url, code);
  }
  const body: unknown = await res.json();
  return unwrapGatewayBody<T>(body);
}
