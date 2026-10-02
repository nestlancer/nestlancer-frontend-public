import { isAxiosError } from '@nestlancer/api-client';
import { QueryClient } from '@tanstack/react-query';

/** A 4xx is the answer. Retrying it makes the not-found screen wait through a second round trip. */
function retryQuery(failureCount: number, error: unknown): boolean {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 400 || status === 401 || status === 403 || status === 404) return false;
  }
  return failureCount < 1;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
        retry: retryQuery,
      },
    },
  });
}
