'use client';

import { resolvePublicWsUrl } from '@nestlancer/config';
import { getAccessToken, subscribeToTokens, useAuth } from '@nestlancer/auth';
import { useMessagingSocketStatus } from '@nestlancer/websocket';
import { cn } from '@nestlancer/ui';
import { useEffect, useState } from 'react';

const wsOrigin = typeof process !== 'undefined' ? resolvePublicWsUrl() : '';

const STATUS_COPY = {
  idle: null,
  connecting: { label: 'Connecting…', className: 'text-muted-foreground' },
  connected: { label: 'Live', className: 'text-emerald-600 dark:text-emerald-400' },
  disconnected: { label: 'Reconnecting…', className: 'text-amber-600 dark:text-amber-400' },
  error: { label: 'Offline', className: 'text-destructive' },
} as const;

/** Subtle realtime connection indicator for the messages inbox header. */
export function MessagingRealtimeStatus() {
  const { isAuthenticated } = useAuth();
  const [accessToken, setAccessToken] = useState<string | undefined>(
    () => getAccessToken() ?? undefined
  );

  useEffect(() => {
    setAccessToken(getAccessToken() ?? undefined);
    return subscribeToTokens((t) => setAccessToken(t?.accessToken ?? undefined));
  }, []);

  const status = useMessagingSocketStatus({
    wsUrl: wsOrigin,
    accessToken,
    socketPath: process.env.NEXT_PUBLIC_SOCKET_IO_PATH,
    enabled: isAuthenticated && Boolean(accessToken && wsOrigin),
  });

  const copy = STATUS_COPY[status];
  if (!copy) return null;

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-xs font-medium', copy.className)}
      title={`Realtime: ${copy.label}`}
      aria-live="polite"
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          status === 'connected' && 'bg-emerald-500',
          status === 'connecting' && 'animate-pulse bg-muted-foreground',
          status === 'disconnected' && 'animate-pulse bg-amber-500',
          status === 'error' && 'bg-destructive'
        )}
        aria-hidden
      />
      {copy.label}
    </span>
  );
}
