import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { isMaintenanceError, notifyMaintenanceFromError } from '../maintenance';

const MAX_RETRIES = 3;
const RETRY_STATUSES = new Set([502, 503, 504]);
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

type RetryConfig = InternalAxiosRequestConfig & {
  __retryCount?: number;
  idempotent?: boolean;
};

function headerValue(headers: RetryConfig['headers'], name: string): string | undefined {
  if (!headers) return undefined;
  const lower = name.toLowerCase();
  if (typeof (headers as { get?: (key: string) => unknown }).get === 'function') {
    const value =
      (headers as { get: (key: string) => unknown }).get(name) ??
      (headers as { get: (key: string) => unknown }).get(lower);
    return typeof value === 'string' ? value : undefined;
  }
  const record = headers as Record<string, unknown>;
  const value = record[name] ?? record[lower];
  return typeof value === 'string' ? value : undefined;
}

function hasIdempotencyKey(config: RetryConfig): boolean {
  const value = headerValue(config.headers, 'Idempotency-Key');
  return typeof value === 'string' && value.trim().length > 0;
}

/** Safe to replay after silent refresh (401) or gateway retry (502/503). */
export function isRetryableRequest(
  config: Pick<RetryConfig, 'method' | 'headers' | 'idempotent'>
): boolean {
  const method = (config.method ?? 'get').toUpperCase();
  if (SAFE_METHODS.has(method)) return true;
  if (config.idempotent === true) return true;
  return hasIdempotencyKey(config);
}

function isRetryableMethod(config: RetryConfig): boolean {
  return isRetryableRequest(config);
}

function shouldRetry(error: AxiosError, config: RetryConfig): boolean {
  // Intentional platform downtime — never retry / amplify latency.
  if (isMaintenanceError(error)) {
    notifyMaintenanceFromError(error);
    return false;
  }
  if (!isRetryableMethod(config)) return false;
  const status = error.response?.status;
  if (status && RETRY_STATUSES.has(status)) return true;
  return error.code === 'ECONNABORTED';
}

export function attachRetryInterceptor(client: AxiosInstance): void {
  client.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (!config || !shouldRetry(error, config)) return Promise.reject(error);

    const count = config.__retryCount ?? 0;
    if (count >= MAX_RETRIES) return Promise.reject(error);

    config.__retryCount = count + 1;
    const delay = 2 ** count * 300;
    await new Promise((r) => setTimeout(r, delay));
    return client(config);
  });
}
