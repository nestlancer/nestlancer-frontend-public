'use client';

import { useEffect, useState } from 'react';

import { useWebSocketContext } from '../WebSocketProvider';

/** Safe version used outside a WebSocketProvider — returns false instead of throwing. */
function useSafeWebSocketContext() {
  try {
    return useWebSocketContext();
  } catch {
    return { socket: null };
  }
}

/**
 * Returns true when the given remote userId is currently online (connected to ws).
 * Subscribes to presence:online / presence:offline events from the socket.
 *
 * Pass the OTHER user's ID (not your own) to check if they're online.
 */
export function usePresence(userId: string | undefined): boolean {
  const { socket } = useSafeWebSocketContext();
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!socket || !userId) return;

    const onOnline = (data: { userId: string; onlineAt?: string }) => {
      if (data.userId === userId) setOnline(true);
    };
    const onOffline = (data: { userId: string; offlineAt?: string }) => {
      if (data.userId === userId) setOnline(false);
    };

    socket.on('presence:online', onOnline);
    socket.on('presence:offline', onOffline);

    return () => {
      socket.off('presence:online', onOnline);
      socket.off('presence:offline', onOffline);
    };
  }, [socket, userId]);

  return online;
}
