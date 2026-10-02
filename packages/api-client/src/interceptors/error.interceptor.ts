import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';

import { clearTokens, isActingAsUser, notifySessionExpired, setTokens } from '@nestlancer/auth';
import {
  applyCorrelationHeaders,
  resolveCorrelationId,
} from '@nestlancer/config/correlation-id.mjs';

import { isMaintenanceError, notifyMaintenanceFromError } from '../maintenance';

export interface ApiErrorPayload {
  message: string;
  statusCode?: number;
  code?: string;
}

interface RefreshResponseBody {
  status?: string;
  data?: {
    accessToken?: string;
    expiresIn?: number;
    tokenType?: string;
  };
}

/**
 * Logs 401s and triggers a single in-flight refresh via the same-origin auth BFF,
 * then retries the original request.
 */
type RefreshOutcome =
  | { kind: 'ok'; accessToken: string }
  | { kind: 'none' } // definitive: 204 / 401 — session gone
  | { kind: 'transient' }; // 5xx / network — keep session, do not force login

export function attachErrorInterceptor(client: AxiosInstance): void {
  let refreshPromise: Promise<RefreshOutcome> | null = null;

  async function performRefresh(): Promise<RefreshOutcome> {
    if (typeof window === 'undefined') return { kind: 'none' };
    try {
      const refreshUrl = `${window.location.origin}/api/auth/refresh`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      applyCorrelationHeaders(headers, resolveCorrelationId({ headers }));
      const response = await axios.post<RefreshResponseBody>(
        refreshUrl,
        {},
        {
          withCredentials: true,
          headers,
          timeout: 15_000,
          // 204 = cleared session; 503 = upstream blip (cookies kept).
          validateStatus: (status) =>
            (status >= 200 && status < 300) || status === 204 || status === 503 || status === 502,
        }
      );
      if (response.status === 204 || response.status === 401) return { kind: 'none' };
      if (response.status === 503 || response.status === 502) return { kind: 'transient' };
      const body = response.data;
      const tokens = body?.data ?? null;
      if (!tokens?.accessToken) return { kind: 'none' };
      setTokens({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: tokens.tokenType,
      });
      return { kind: 'ok', accessToken: tokens.accessToken };
    } catch {
      // Network / timeout against BFF — do not treat as logout.
      return { kind: 'transient' };
    }
  }

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ApiErrorPayload>) => {
      if (isMaintenanceError(error)) {
        notifyMaintenanceFromError(error);
        return Promise.reject(error);
      }

      const status = error.response?.status;
      const original = error.config as
        | (InternalAxiosRequestConfig & { __retriedAuth?: boolean; skipAuth?: boolean })
        | undefined;

      if (status !== 401 || !original || original.__retriedAuth || original.skipAuth) {
        return Promise.reject(error);
      }

      // A support session has no refresh cookie. Refreshing would either fail closed
      // or sign this tab in as a different client who left a cookie in the browser.
      if (isActingAsUser()) {
        return Promise.reject(error);
      }

      if (typeof original.url === 'string' && original.url.includes('/auth/refresh')) {
        clearTokens();
        notifySessionExpired('unauthorized');
        return Promise.reject(error);
      }

      if (typeof original.url === 'string' && original.url.includes('/auth/logout')) {
        return Promise.reject(error);
      }

      original.__retriedAuth = true;

      if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
          refreshPromise = null;
        });
      }

      const outcome = await refreshPromise;
      if (outcome.kind !== 'ok') {
        if (outcome.kind === 'none') {
          notifySessionExpired('refresh_failed');
        }
        return Promise.reject(error);
      }

      original.headers = original.headers ?? {};
      (original.headers as Record<string, string>)['Authorization'] =
        `Bearer ${outcome.accessToken}`;
      return client.request(original);
    }
  );
}
