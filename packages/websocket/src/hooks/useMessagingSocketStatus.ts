'use client';

import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

import { getMessagingSocket, releaseMessagingSocket } from '../messaging-socket';

export type MessagingSocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseMessagingSocketStatusOptions {
  wsUrl: string;
  accessToken?: string;
  socketPath?: string;
  enabled?: boolean;
}

/**
 * Tracks connection state for the shared `/messages` Socket.IO client.
 */
export function useMessagingSocketStatus(
  opts: UseMessagingSocketStatusOptions
): MessagingSocketStatus {
  const { wsUrl, accessToken, socketPath, enabled = true } = opts;
  const [status, setStatus] = useState<MessagingSocketStatus>('idle');

  useEffect(() => {
    if (!enabled || !wsUrl || !accessToken) {
      setStatus('idle');
      return;
    }

    const socket: Socket = getMessagingSocket(wsUrl, accessToken, socketPath);
    setStatus(socket.connected ? 'connected' : 'connecting');

    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onConnectError = () => setStatus('error');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      releaseMessagingSocket();
    };
  }, [enabled, wsUrl, accessToken, socketPath]);

  return status;
}
