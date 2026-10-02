'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import type { MaintenanceInfo } from '@nestlancer/api-client/maintenance';
import { AuthProvider, getAccessToken, subscribeToTokens, useAuth } from '@nestlancer/auth';
import { resolvePublicApiUrl, resolvePublicWsUrl } from '@nestlancer/config';
import { ToastProvider } from '@nestlancer/ui';
import { WebSocketProvider } from '@nestlancer/websocket';

import { ImpersonationRemoteStop } from '@/components/auth/ImpersonationRemoteStop';
import { SessionBootstrap } from '@/components/auth/SessionBootstrap';
import { MaintenanceGate } from '@/components/maintenance/MaintenanceGate';
import { PushRegistration } from '@/components/push/PushRegistration';
import { WebConfirmProvider } from '@/components/web/WebConfirmProvider';
import { createQueryClient } from '@/lib/queryClient';

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
    return subscribeToTokens((tokens) => {
      setToken(tokens?.accessToken ?? undefined);
    });
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

export function AppProviders({
  children,
  initialMaintenance,
}: {
  children: ReactNode;
  initialMaintenance?: MaintenanceInfo | null;
}) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <WebConfirmProvider>
          <AuthProvider>
            <MaintenanceGate initialStatus={initialMaintenance}>
              <SessionBootstrap />
              <ImpersonationRemoteStop />
              <AuthenticatedSocketProvider>
                <PushRegistration />
                {children}
              </AuthenticatedSocketProvider>
            </MaintenanceGate>
          </AuthProvider>
        </WebConfirmProvider>
      </ToastProvider>
      {process.env.NODE_ENV === 'development' ? (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      ) : null}
    </QueryClientProvider>
  );
}
