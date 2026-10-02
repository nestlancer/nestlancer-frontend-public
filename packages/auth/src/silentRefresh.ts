import { resolveCorrelationId } from '@nestlancer/config/correlation-id.mjs';

import { setTokens } from './tokenManager';

/** Browser-tab single-flight — concurrent callers share one refresh (NL-BUG-SESSION-01). */
let inFlight: Promise<boolean> | null = null;

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

async function performSilentRefresh(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    let res = await refreshOnce();
    // 204 = no session / cleared stale session (not an error).
    if (res.status === 204) return false;
    // 503/502 / AUTH_REFRESH_BUSY — cookies kept; one short retry (NL-BUG-SESSION-01).
    if (res.status === 503 || res.status === 502 || res.status === 429) {
      await new Promise((r) => setTimeout(r, retryAfterMs(res)));
      res = await refreshOnce();
      if (res.status === 204) return false;
      if (res.status === 503 || res.status === 502 || res.status === 429) return false;
    }
    if (!res.ok) return false;
    const body = (await res.json()) as {
      data?: { accessToken?: string; expiresIn?: number; tokenType?: string };
    };
    if (!body.data?.accessToken) return false;
    setTokens({
      accessToken: body.data.accessToken,
      expiresIn: body.data.expiresIn,
      tokenType: body.data.tokenType,
    });
    return true;
  } catch {
    return false;
  }
}

/** Restore access JWT from HttpOnly refresh cookie via same-origin BFF. */
export async function trySilentRefresh(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (inFlight) return inFlight;
  inFlight = performSilentRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
