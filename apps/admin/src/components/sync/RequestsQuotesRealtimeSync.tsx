'use client';

import { resolvePublicWsUrl } from '@nestlancer/config';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { getAccessToken, subscribeToTokens, useAuth } from '@nestlancer/auth';
import {
  applyNotificationRealtimeEvent,
  applyUnreadCountRealtimeEvent,
} from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import { useNotificationsRealtime } from '@nestlancer/websocket';

import { adminKeys } from '@/lib/admin-query-keys';

const WS_URL = typeof process !== 'undefined' ? resolvePublicWsUrl() : '';

const SOCKET_PATH =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SOCKET_IO_PATH
    ? process.env.NEXT_PUBLIC_SOCKET_IO_PATH
    : undefined;

const POLL_MS = 20_000;

function isRequestsOrQuotesRoute(pathname: string): boolean {
  return /\/(requests|quotes)(\/|$)/.test(pathname);
}

/** Keeps admin request and quote views fresh when clients submit or request changes. */
export function RequestsQuotesRealtimeSync() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const qc = useQueryClient();
  const [token, setToken] = useState<string | undefined>(() => getAccessToken() ?? undefined);
  const onRoute = isRequestsOrQuotesRoute(pathname ?? '');

  useEffect(() => {
    setToken(getAccessToken() ?? undefined);
    return subscribeToTokens((t) => setToken(t?.accessToken ?? undefined));
  }, []);

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: adminKeys.requests() });
    void qc.invalidateQueries({ queryKey: adminKeys.quotes() });
    void qc.invalidateQueries({ queryKey: adminKeys.requestStats() });
    void qc.invalidateQueries({ queryKey: adminKeys.quoteStats() });
    void qc.invalidateQueries({ queryKey: queryKeys.notifications.unread });
    void qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    void qc.invalidateQueries({ queryKey: queryKeys.messages.unread });
    void qc.invalidateQueries({ queryKey: queryKeys.messages.conversations });
  }, [qc]);

  useNotificationsRealtime({
    wsUrl: WS_URL,
    accessToken: token,
    socketPath: SOCKET_PATH,
    enabled: isAuthenticated && Boolean(WS_URL) && Boolean(token),
    onNotification: (payload) => {
      applyNotificationRealtimeEvent(qc, payload);
      invalidate();
    },
    onUnreadCountUpdated: ({ unread }) => {
      applyUnreadCountRealtimeEvent(qc, unread);
    },
  });

  useEffect(() => {
    if (!onRoute || !isAuthenticated) return;
    const id = window.setInterval(() => invalidate(), POLL_MS);
    return () => window.clearInterval(id);
  }, [onRoute, isAuthenticated, invalidate]);

  return null;
}
