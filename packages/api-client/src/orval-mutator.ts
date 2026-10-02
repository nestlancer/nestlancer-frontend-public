import type { AxiosRequestConfig } from 'axios';

import type { GatewayUnwrapped } from './gateway-unwrapped';
import { getConfiguredHttpClient } from './http-singleton';

/**
 * Orval mutator: strips duplicate `/api/v1` prefix and types responses as unwrapped
 * gateway `data` (see `attachEnvelopeInterceptor`).
 */
export function customInstance<T>(config: AxiosRequestConfig): Promise<GatewayUnwrapped<T>> {
  const client = getConfiguredHttpClient();
  let url = config.url;
  if (typeof url === 'string' && url.startsWith('/api/v1')) {
    const rest = url.slice('/api/v1'.length);
    url = rest.length > 0 ? rest : '/';
  }
  return client.request<GatewayUnwrapped<T>>({ ...config, url }).then((res) => res.data);
}
