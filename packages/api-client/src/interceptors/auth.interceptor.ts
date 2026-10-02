import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { AxiosHeaders } from 'axios';

import { getAccessToken } from '@nestlancer/auth';
import {
  applyCorrelationHeaders,
  resolveCorrelationId,
} from '@nestlancer/config/correlation-id.mjs';

function hasAuthorizationHeader(headers: InternalAxiosRequestConfig['headers']): boolean {
  if (!headers) return false;
  if (headers instanceof AxiosHeaders) {
    const v = headers.get('Authorization') ?? headers.get('authorization');
    return typeof v === 'string' && v.length > 0;
  }
  const h = headers as Record<string, string | string[] | undefined>;
  const raw = h.Authorization ?? h.authorization;
  const v = Array.isArray(raw) ? raw[0] : raw;
  return typeof v === 'string' && v.length > 0;
}

function setAuthorizationHeader(
  headers: InternalAxiosRequestConfig['headers'],
  bearer: string
): InternalAxiosRequestConfig['headers'] {
  const h = headers ?? new AxiosHeaders();
  if (h instanceof AxiosHeaders) {
    h.set('Authorization', bearer);
    return h;
  }
  (h as Record<string, string>)['Authorization'] = bearer;
  return h;
}

function existingCorrelation(headers: InternalAxiosRequestConfig['headers']): string | undefined {
  if (!headers) return undefined;
  if (headers instanceof AxiosHeaders) {
    const v =
      headers.get('X-Correlation-ID') ??
      headers.get('x-correlation-id') ??
      headers.get('X-Request-ID') ??
      headers.get('x-request-id');
    return typeof v === 'string' && v ? v : undefined;
  }
  const plain = headers as Record<string, string | string[] | undefined>;
  const raw =
    plain['X-Correlation-ID'] ??
    plain['x-correlation-id'] ??
    plain['X-Request-ID'] ??
    plain['x-request-id'];
  const v = Array.isArray(raw) ? raw[0] : raw;
  return typeof v === 'string' && v ? v : undefined;
}

/**
 * Attaches a correlation header and (when present) the Bearer access token.
 * Preserves existing IDs (retries / explicit callers) and reuses the page cookie.
 * Refresh tokens are HttpOnly cookies managed by `/api/auth/*` route handlers.
 */
export function attachAuthInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const headers = config.headers ?? new AxiosHeaders();
    const correlationId = resolveCorrelationId({
      prefer: existingCorrelation(headers),
      headers,
    });
    applyCorrelationHeaders(headers, correlationId);

    const token = getAccessToken();
    const skipAuth = (config as InternalAxiosRequestConfig & { skipAuth?: boolean }).skipAuth;
    if (token && !skipAuth && !hasAuthorizationHeader(headers)) {
      config.headers = setAuthorizationHeader(headers, `Bearer ${token}`);
    } else {
      config.headers = headers;
    }
    return config;
  });
}
