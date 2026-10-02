'use client';

import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';

import { getMessagingSocket, releaseMessagingSocket } from '../messaging-socket';

export type MessagingInboundPayload = {
  id: string;
  senderId: string;
  projectId?: string | null;
  threadId?: string | null;
  content?: string;
  type?: string;
  createdAt?: string;
};

export type MessagingInboxRoom = {
  projectId?: string;
  threadId?: string;
};

export interface UseMessagingInboxRealtimeOptions {
  wsUrl: string;
  accessToken?: string;
  socketPath?: string;
  rooms: MessagingInboxRoom[];
  currentUserId?: string;
  enabled?: boolean;
  onInboundMessage: (payload: MessagingInboundPayload) => void;
}

export function useMessagingInboxRealtime(opts: UseMessagingInboxRealtimeOptions): void {
  const {
    wsUrl,
    accessToken,
    socketPath,
    rooms,
    currentUserId,
    enabled = true,
    onInboundMessage,
  } = opts;

  const onInboundRef = useRef(onInboundMessage);
  onInboundRef.current = onInboundMessage;
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;
  const joinedRef = useRef<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !wsUrl || !accessToken) {
      joinedRef.current.clear();
      socketRef.current = null;
      return;
    }

    const socket = getMessagingSocket(wsUrl, accessToken, socketPath);
    socketRef.current = socket;
    const joined = joinedRef.current;

    const handleNew = (payload: MessagingInboundPayload) => {
      if (!payload?.senderId) return;
      const uid = currentUserIdRef.current;
      if (uid && payload.senderId === uid) return;
      onInboundRef.current(payload);
    };

    socket.on('message:new', handleNew);

    return () => {
      socket.off('message:new', handleNew);
      releaseMessagingSocket();
      socketRef.current = null;
      joined.clear();
    };
  }, [enabled, wsUrl, accessToken, socketPath]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !enabled) return;

    const joinRooms = () => {
      for (const room of rooms) {
        if (room.threadId) {
          const key = `t:${room.threadId}`;
          if (joinedRef.current.has(key)) continue;
          joinedRef.current.add(key);
          socket.emit('join:room', { threadId: room.threadId });
        } else if (room.projectId) {
          const key = `p:${room.projectId}`;
          if (joinedRef.current.has(key)) continue;
          joinedRef.current.add(key);
          socket.emit('join:room', { projectId: room.projectId });
        }
      }
    };

    if (socket.connected) joinRooms();
    else socket.once('connect', joinRooms);

    return () => {
      socket.off('connect', joinRooms);
    };
  }, [rooms, enabled]);
}
