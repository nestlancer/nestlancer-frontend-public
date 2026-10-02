import type { AxiosInstance } from 'axios';

import { createApiClient, type CreateApiClientOptions } from './client';
import { attachAuthInterceptors } from './interceptors/auth.interceptor';
import { attachEnvelopeInterceptor } from './interceptors/envelope.interceptor';
import { attachErrorInterceptor } from './interceptors/error.interceptor';
import { attachRetryInterceptor } from './interceptors/retry.interceptor';

let cachedKey = '';
let cachedClient: AxiosInstance | null = null;

function applyInterceptors(client: AxiosInstance): void {
  attachEnvelopeInterceptor(client);
  attachAuthInterceptors(client);
  attachErrorInterceptor(client);
  attachRetryInterceptor(client);
}

/**
 * Returns a memoized Axios instance with gateway interceptors.
 * Use `createApiClient` directly when you need a fresh client with custom `baseURL`.
 */
export function getConfiguredHttpClient(options: CreateApiClientOptions = {}): AxiosInstance {
  const key = JSON.stringify(options ?? {});
  if (cachedClient && cachedKey === key) return cachedClient;

  const client = createApiClient(options);
  applyInterceptors(client);
  cachedKey = key;
  cachedClient = client;
  return client;
}
