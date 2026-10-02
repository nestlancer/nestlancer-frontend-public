'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Socket } from 'socket.io-client';

import { getSocket, releaseSocket } from './client';

interface WebSocketContextValue {
  socket: Socket | null;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export interface WebSocketProviderProps {
  children: ReactNode;
  url: string;
  token?: string;
  /** Overrides `NEXT_PUBLIC_SOCKET_IO_PATH` when set. */
  socketPath?: string;
  /**
   * When `false`, no socket is created (e.g. on public pages such as `/login`
   * before the user is authenticated). Defaults to `true` for back-compat.
   */
  enabled?: boolean;
}

export function WebSocketProvider({
  children,
  url,
  token,
  socketPath,
  enabled = true,
}: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !url) {
      setSocket(null);
      return;
    }

    const s = getSocket(url, token, { path: socketPath });
    setSocket(s);

    return () => {
      releaseSocket();
    };
  }, [enabled, url, token, socketPath]);

  const value = useMemo(() => ({ socket }), [socket]);

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocketContext(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return ctx;
}
