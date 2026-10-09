import { resolveCorrelationId } from '@nestlancer/config/correlation-id.mjs';

import { getAccessToken, setTokens } from './tokenManager';

/** Browser-tab single-flight — concurrent callers share one refresh (NL-BUG-SESSION-01). */
let inFlight: Promise<SilentRefreshOutcome> | null = null;

export type SilentRefreshOutcome =
  | { kind: 'ok'; accessToken: string }
  | { kind: 'none' } // definitive: 204 / 401 — session gone
  | { kind: 'transient' }; // 5xx / network — keep session, do not force login

async function refreshOnce(): Promise<Response> {
  const correlationId = resolveCorrelationId();
  return fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': correlationId,
      'X-Correlation-ID': correlationId,
    },
    body: JSON.stringify({}),
  });
}

function retryAfterMs(res: Response): number {
  const raw = res.headers.get('Retry-After');
  const seconds = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(seconds, 5) * 1000;
  }
  return 500;
}

async function performSilentRefresh(): Promise<SilentRefreshOutcome> {
  if (typeof window === 'undefined') return { kind: 'none' };
  try {
    let res = await refreshOnce();
    // 204 = no session / cleared stale session (not an error).
    if (res.status === 204) return { kind: 'none' };
    // 503/502 / AUTH_REFRESH_BUSY — cookies kept; one short retry (NL-BUG-SESSION-01).
    if (res.status === 503 || res.status === 502 || res.status === 429) {
      await new Promise((r) => setTimeout(r, retryAfterMs(res)));
      res = await refreshOnce();
      if (res.status === 204) return { kind: 'none' };
      if (res.status === 503 || res.status === 502 || res.status === 429) {
        return { kind: 'transient' };
      }
    }
    if (!res.ok) return { kind: 'none' };
    const body = (await res.json()) as {
      data?: { accessToken?: string; expiresIn?: number; tokenType?: string };
    };
    if (!body.data?.accessToken) return { kind: 'none' };
    setTokens({
      accessToken: body.data.accessToken,
      expiresIn: body.data.expiresIn,
      tokenType: body.data.tokenType,
    });
    return { kind: 'ok', accessToken: body.data.accessToken };
  } catch {
    // Network / timeout against BFF — do not treat as logout.
    return { kind: 'transient' };
  }
}

/**
 * Shared single-flight refresh used by SessionBootstrap and the Axios 401
 * interceptor. Dual in-flight POSTs rotate the same refresh jti twice → auth
 * treats the loser as reuse, revokes all sessions, and the BFF clears cookies.
 */
export async function trySilentRefreshOutcome(): Promise<SilentRefreshOutcome> {
  if (typeof window === 'undefined') return { kind: 'none' };
  if (inFlight) return inFlight;
  inFlight = performSilentRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Restore access JWT from HttpOnly refresh cookie via same-origin BFF. */
export async function trySilentRefresh(): Promise<boolean> {
  const outcome = await trySilentRefreshOutcome();
  if (outcome.kind === 'ok') return true;
  // If another caller already hydrated memory while we waited on the same flight.
  return Boolean(getAccessToken());
}
