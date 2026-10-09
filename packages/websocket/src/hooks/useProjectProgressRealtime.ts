'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';

function resolveSocketPath(explicit?: string): string {
  if (explicit) return explicit;
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SOCKET_IO_PATH) {
    return process.env.NEXT_PUBLIC_SOCKET_IO_PATH;
  }
  return '/ws/socket.io';
}

export interface UseProjectProgressRealtimeOptions {
  wsUrl: string;
  accessToken?: string;
  socketPath?: string;
  projectId?: string;
  enabled?: boolean;
  /** Called when `progress:updated` is received for this project. */
  onProgressUpdated?: (data: unknown) => void;
}

/**
 * Subscribes to the `/projects` Socket.IO namespace and listens for
 * `progress:updated` events, triggering cache invalidation or toast.
 */
export function useProjectProgressRealtime(opts: UseProjectProgressRealtimeOptions): void {
  const { wsUrl, accessToken, socketPath, projectId, enabled = true, onProgressUpdated } = opts;
  const onProgressUpdatedRef = useRef(onProgressUpdated);
  onProgressUpdatedRef.current = onProgressUpdated;

  useEffect(() => {
    if (!enabled || !wsUrl || !projectId || !accessToken) return;

    const path = resolveSocketPath(socketPath);
    const base = wsUrl.replace(/\/$/, '');
    const nsUrl = base.endsWith('/projects') ? base : `${base}/projects`;

    let cancelled = false;

    const socket: Socket = io(nsUrl, {
      path,
      transports: ['websocket'],
      auth: { token: accessToken },
      query: { auth: '1' },
      withCredentials: false,
      reconnection: false,
    });

    const subscribe = () => {
      if (cancelled) return;
      socket.emit('subscribe:project', { projectId });
    };

    const handleProgressUpdated = (data: unknown) => {
      onProgressUpdatedRef.current?.(data);
    };

    socket.on('connect', subscribe);
    socket.on('progress:updated', handleProgressUpdated);
    if (socket.connected) subscribe();

    return () => {
      cancelled = true;
      socket.off('connect', subscribe);
      socket.off('progress:updated', handleProgressUpdated);
      if (socket.connected) {
        socket.disconnect();
      } else {
        socket.close();
      }
    };
  }, [enabled, wsUrl, accessToken, socketPath, projectId]);
}
