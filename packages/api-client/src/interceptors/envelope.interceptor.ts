import type { AxiosInstance, AxiosResponse } from 'axios';

/** Gateway wraps JSON as `{ status, data, metadata }`. Business errors use HTTP 200 with nested `data.status === 'error'`. */
export interface GatewayErrorPayload {
  status: 'error';
  error: {
    code?: string;
    message?: string;
    requestId?: string;
    path?: string;
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/**
 * Unwrap a success envelope while preserving list pagination siblings.
 * Services like messaging return `{ status, data: T[], pagination }` (not nested under `data`).
 */
export function unwrapSuccessResponseData(payload: unknown): unknown {
  if (!isRecord(payload) || payload.status !== 'success' || !('data' in payload)) {
    return payload;
  }

  const inner = payload.data as unknown;
  if (
    isRecord(inner) &&
    typeof inner.statusCode === 'number' &&
    inner.statusCode >= 400 &&
    typeof inner.message === 'string'
  ) {
    const err = new Error(inner.message) as Error & { isGatewayError?: boolean };
    err.isGatewayError = true;
    throw err;
  }
  if (isRecord(inner) && inner.status === 'error' && isRecord(inner.error)) {
    const rawMessage = inner.error.message;
    const msg =
      typeof rawMessage === 'string'
        ? rawMessage
        : Array.isArray(rawMessage)
          ? rawMessage.filter((item): item is string => typeof item === 'string').join(', ')
          : 'Request failed';
    const err = new Error(msg) as Error & { code?: string; isGatewayError?: boolean };
    err.code = typeof inner.error.code === 'string' ? inner.error.code : undefined;
    err.isGatewayError = true;
    throw err;
  }

  // Keep pagination/meta when `data` is a bare array (common admin list shape).
  if (Array.isArray(inner) && ('pagination' in payload || 'meta' in payload)) {
    const preserved: Record<string, unknown> = { data: inner };
    if ('pagination' in payload) preserved.pagination = payload.pagination;
    if ('meta' in payload) preserved.meta = payload.meta;
    return preserved;
  }

  return inner;
}

export function attachEnvelopeInterceptor(client: AxiosInstance): void {
  client.interceptors.response.use((response: AxiosResponse) => {
    try {
      response.data = unwrapSuccessResponseData(response.data);
      return response;
    } catch (err) {
      return Promise.reject(err);
    }
  });
}
