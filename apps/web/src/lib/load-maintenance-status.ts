import { resolvePublicApiUrl } from '@nestlancer/config';
import {
  applyCorrelationHeaders,
  resolveCorrelationId,
} from '@nestlancer/config/correlation-id.mjs';
import type { MaintenanceInfo } from '@nestlancer/api-client/maintenance';

const DEFAULT: MaintenanceInfo = {
  enabled: false,
  message: null,
  estimatedEnd: null,
};

/**
 * Best-effort server read of public maintenance status for first paint.
 * Uses the Next.js data cache (revalidate: 30 s) so repeated SSR requests
 * within the same window are served from cache instead of hitting the API
 * on every document render.
 *
 * Fails open so layout never hangs on an API outage.
 * The abort timeout is 1 s (was 2.5 s) because a cached response is served
 * in milliseconds; the slow path only fires on the first request in each
 * 30-second window.
 */
export async function loadInitialMaintenanceStatus(): Promise<MaintenanceInfo> {
  const base = resolvePublicApiUrl();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1000);

  try {
    const headers = new Headers({ Accept: 'application/json' });
    applyCorrelationHeaders(headers, resolveCorrelationId({ headers }));
    const res = await fetch(`${base}/api/v1/system/status`, {
      method: 'GET',
      headers,
      // Cache for 30 seconds — replaces cache: 'no-store' which forced a
      // network round trip on every SSR document render.
      next: { revalidate: 30 },
      signal: controller.signal,
    });
    if (!res.ok) return DEFAULT;
    const payload = (await res.json()) as {
      status?: string;
      data?: { maintenance?: Partial<MaintenanceInfo> };
    };
    const m = payload?.data?.maintenance;
    if (!m || typeof m !== 'object') return DEFAULT;
    return {
      enabled: Boolean(m.enabled),
      message: typeof m.message === 'string' ? m.message : null,
      estimatedEnd: typeof m.estimatedEnd === 'string' ? m.estimatedEnd : null,
    };
  } catch {
    return DEFAULT;
  } finally {
    clearTimeout(timer);
  }
}
