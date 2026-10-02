/**
 * Shared maintenance-mode state for web/admin clients.
 * Source of truth: GET /api/v1/system/status (public, always allowed by the gateway).
 */

import { resolvePublicApiUrl } from '@nestlancer/config';

export type MaintenanceInfo = {
  enabled: boolean;
  message: string | null;
  estimatedEnd: string | null;
};

const DEFAULT_STATUS: MaintenanceInfo = {
  enabled: false,
  message: null,
  estimatedEnd: null,
};

let current: MaintenanceInfo = { ...DEFAULT_STATUS };
const listeners = new Set<(status: MaintenanceInfo) => void>();

export function getMaintenanceStatus(): MaintenanceInfo {
  return current;
}

export function setMaintenanceStatus(next: MaintenanceInfo): void {
  const normalized: MaintenanceInfo = {
    enabled: Boolean(next.enabled),
    message: next.message ?? null,
    estimatedEnd: next.estimatedEnd ?? null,
  };
  const changed =
    normalized.enabled !== current.enabled ||
    normalized.message !== current.message ||
    normalized.estimatedEnd !== current.estimatedEnd;
  current = normalized;
  if (!changed) return;
  listeners.forEach((listener) => listener(current));
}

export function subscribeMaintenance(listener: (status: MaintenanceInfo) => void): () => void {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}

function resolveApiBase(override?: string): string {
  return resolvePublicApiUrl(override);
}

function parseStatusPayload(payload: unknown): MaintenanceInfo {
  if (!payload || typeof payload !== 'object') return { ...DEFAULT_STATUS };
  const root = payload as Record<string, unknown>;
  const data =
    root.status === 'success' && root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root;
  const maintenance =
    data.maintenance && typeof data.maintenance === 'object'
      ? (data.maintenance as Record<string, unknown>)
      : data;
  return {
    enabled: Boolean(maintenance.enabled),
    message: typeof maintenance.message === 'string' ? maintenance.message : null,
    estimatedEnd: typeof maintenance.estimatedEnd === 'string' ? maintenance.estimatedEnd : null,
  };
}

let inflightStatus: Promise<MaintenanceInfo> | null = null;

/**
 * Public status check — does not use the axios stack (avoids auth/retry side effects).
 * Session bootstrap and the maintenance gate both call this on mount; one in-flight
 * request is shared so a page load does not hit /system/status twice.
 */
export function fetchMaintenanceStatus(baseURL?: string): Promise<MaintenanceInfo> {
  if (baseURL) return fetchMaintenanceStatusOnce(baseURL);
  if (!inflightStatus) {
    const run = fetchMaintenanceStatusOnce();
    const shared = run.finally(() => {
      if (inflightStatus === shared) inflightStatus = null;
    });
    inflightStatus = shared;
  }
  return inflightStatus;
}

async function fetchMaintenanceStatusOnce(baseURL?: string): Promise<MaintenanceInfo> {
  const base = resolveApiBase(baseURL);
  const res = await fetch(`${base}/api/v1/system/status`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`system/status failed (${res.status})`);
  }
  const json: unknown = await res.json();
  return parseStatusPayload(json);
}

export function isMaintenanceError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const anyErr = error as {
    code?: unknown;
    response?: { status?: number; data?: unknown };
  };
  if (anyErr.code === 'SYS_MAINTENANCE') return true;
  if (anyErr.response?.status !== 503) return false;
  const data = anyErr.response.data;
  if (!data || typeof data !== 'object') return false;
  const nested = (data as { error?: { code?: unknown } }).error;
  return nested?.code === 'SYS_MAINTENANCE';
}

/** Push maintenance state from an Axios/gateway error body. */
export function notifyMaintenanceFromError(error: unknown): void {
  if (!isMaintenanceError(error)) return;
  const anyErr = error as {
    response?: { data?: unknown };
    message?: string;
  };
  const data = anyErr.response?.data;
  let message: string | null = null;
  let estimatedEnd: string | null = null;
  if (data && typeof data === 'object') {
    const err = (data as { error?: Record<string, unknown> }).error;
    if (err) {
      if (typeof err.message === 'string') message = err.message;
      if (typeof err.estimatedEnd === 'string') estimatedEnd = err.estimatedEnd;
    }
  }
  setMaintenanceStatus({
    enabled: true,
    message: message ?? (typeof anyErr.message === 'string' ? anyErr.message : null),
    estimatedEnd,
  });
}
