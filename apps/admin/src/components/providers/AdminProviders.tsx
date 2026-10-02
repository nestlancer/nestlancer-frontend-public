'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { isAxiosError } from '@nestlancer/api-client';
import { AuthProvider, getAccessToken, subscribeToTokens, useAuth } from '@nestlancer/auth';
import { resolvePublicApiUrl, resolvePublicWsUrl } from '@nestlancer/config';
import { ToastProvider } from '@nestlancer/ui';
import { WebSocketProvider } from '@nestlancer/websocket';

import { AdminSessionBootstrap } from '@/components/auth/AdminSessionBootstrap';
import { ImpersonationHandoffListener } from '@/features/users/impersonationHandoff';
import { AdminConfirmProvider } from '@/components/admin/AdminConfirmDialog';
import { AdminMaintenanceBanner } from '@/components/maintenance/AdminMaintenanceBanner';

const apiOrigin = typeof process !== 'undefined' ? resolvePublicApiUrl() : '';
const wsOrigin = typeof process !== 'undefined' ? resolvePublicWsUrl() : '';
const socketPath =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SOCKET_IO_PATH
    ? process.env.NEXT_PUBLIC_SOCKET_IO_PATH
    : undefined;

function AuthenticatedSocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | undefined>(() => getAccessToken() ?? undefined);

  useEffect(() => {
    setToken(getAccessToken() ?? undefined);
    return subscribeToTokens((t) => setToken(t?.accessToken ?? undefined));
  }, []);

  return (
    <WebSocketProvider
      url={wsOrigin || apiOrigin}
      socketPath={socketPath}
      token={token}
      enabled={isAuthenticated && Boolean(token)}
    >
      {children}
    </WebSocketProvider>
  );
}

export function AdminProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: true,
            retry: (failureCount, error) => {
              if (isAxiosError(error)) {
                const status = error.response?.status;
                if (status === 400 || status === 401 || status === 403 || status === 404)
                  return false;
              }
              return failureCount < 1;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <AdminConfirmProvider>
            <AdminSessionBootstrap />
            <ImpersonationHandoffListener />
            <AdminMaintenanceBanner />
            <AuthenticatedSocketProvider>{children}</AuthenticatedSocketProvider>
          </AdminConfirmProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
