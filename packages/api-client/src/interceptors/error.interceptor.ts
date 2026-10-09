import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import {
  clearTokens,
  isActingAsUser,
  notifySessionExpired,
  trySilentRefreshOutcome,
} from '@nestlancer/auth';

import { isMaintenanceError, notifyMaintenanceFromError } from '../maintenance';
import { isRetryableRequest } from './retry.interceptor';

export interface ApiErrorPayload {
  message: string;
  statusCode?: number;
  code?: string;
}

/**
 * Logs 401s and triggers a single in-flight refresh via the shared
 * `@nestlancer/auth` silent-refresh flight, then retries the original request.
 */
export function attachErrorInterceptor(client: AxiosInstance): void {
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

      // Share the SessionBootstrap flight — never open a second /api/auth/refresh
      // against the same rotated jti (NL-BUG-SESSION-01 / concurrent reuse wipe).
      const outcome = await trySilentRefreshOutcome();
      if (outcome.kind !== 'ok') {
        if (outcome.kind === 'none') {
          notifySessionExpired('refresh_failed');
        }
        return Promise.reject(error);
      }

      // Never replay non-idempotent writes — duplicate payments/refunds (NL-BV-C1-01).
      if (!isRetryableRequest(original)) {
        return Promise.reject(error);
      }

      original.headers = original.headers ?? {};
      (original.headers as Record<string, string>)['Authorization'] =
        `Bearer ${outcome.accessToken}`;
      return client.request(original);
    }
  );
}
