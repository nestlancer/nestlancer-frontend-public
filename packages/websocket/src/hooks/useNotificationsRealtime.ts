'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';

import { SocketEvents } from '@nestlancer/types';

function resolveSocketPath(explicit?: string): string {
  if (explicit) return explicit;
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SOCKET_IO_PATH) {
    return process.env.NEXT_PUBLIC_SOCKET_IO_PATH;
  }
  return '/ws/socket.io';
}

export interface UseNotificationsRealtimeOptions {
  wsUrl: string;
  accessToken?: string;
  socketPath?: string;
  enabled?: boolean;
  /** Fired when the gateway pushes `notification:new` (in-app notifications). */
  onNotification?: (payload: unknown) => void;
  /** Fired when unread count changes without a full list refetch. */
  onUnreadCountUpdated?: (payload: { unread: number }) => void;
}

/**
 * Subscribes to the `/notifications` Socket.IO namespace for live in-app events.
 */
export function useNotificationsRealtime(opts: UseNotificationsRealtimeOptions): void {
  const {
    wsUrl,
    accessToken,
    socketPath,
    enabled = true,
    onNotification,
    onUnreadCountUpdated,
  } = opts;
  const notificationRef = useRef(onNotification);
  const unreadRef = useRef(onUnreadCountUpdated);
  notificationRef.current = onNotification;
  unreadRef.current = onUnreadCountUpdated;

  useEffect(() => {
    if (!enabled || !wsUrl || !accessToken) return;

    const path = resolveSocketPath(socketPath);
    const base = wsUrl.replace(/\/$/, '');
    const nsUrl = base.endsWith('/notifications') ? base : `${base}/notifications`;

    const socket: Socket = io(nsUrl, {
      path,
      transports: ['websocket', 'polling'],
      auth: { token: accessToken },
      query: { auth: '1' },
      withCredentials: true,
      reconnection: true,
    });

    const handleNotification = (payload: unknown) => {
      notificationRef.current?.(payload);
    };

    const handleUnreadCount = (payload: unknown) => {
      const rec =
        payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
      const unread =
        typeof rec.unread === 'number'
          ? rec.unread
          : typeof rec.count === 'number'
            ? rec.count
            : null;
      if (unread != null) unreadRef.current?.({ unread });
    };

    socket.on(SocketEvents.notificationNew, handleNotification);
    socket.on(SocketEvents.unreadCountUpdated, handleUnreadCount);

    return () => {
      socket.off(SocketEvents.notificationNew, handleNotification);
      socket.off(SocketEvents.unreadCountUpdated, handleUnreadCount);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [enabled, wsUrl, accessToken, socketPath]);
}
