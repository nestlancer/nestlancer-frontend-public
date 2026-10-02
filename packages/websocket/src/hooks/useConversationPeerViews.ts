'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

import { getMessagingSocket, releaseMessagingSocket } from '../messaging-socket';
import {
  conversationRoomKey,
  peerViewMapKey,
  type ConversationRoomRef,
  type ConversationViewPayload,
  type PeerViewState,
} from '../utils/conversation-room';

export interface UseConversationPeerViewsOptions {
  wsUrl: string;
  accessToken?: string;
  socketPath?: string;
  rooms: ConversationRoomRef[];
  currentUserId?: string;
  enabled?: boolean;
}

/**
 * Tracks peer popup state across inbox rooms: live, waiting (minimized), or cleared when closed.
 */
export function useConversationPeerViews(opts: UseConversationPeerViewsOptions) {
  const { wsUrl, accessToken, socketPath, rooms, currentUserId, enabled = true } = opts;

  const [peerViews, setPeerViews] = useState<Map<string, PeerViewState>>(new Map());
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;
  const joinedRef = useRef<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !wsUrl || !accessToken) {
      joinedRef.current.clear();
      socketRef.current = null;
      setPeerViews(new Map());
      return;
    }

    const socket = getMessagingSocket(wsUrl, accessToken, socketPath);
    socketRef.current = socket;

    const handleView = (payload: ConversationViewPayload) => {
      if (!payload?.userId || !payload.state) return;
      const uid = currentUserIdRef.current;
      if (uid && payload.userId === uid) return;

      const room: ConversationRoomRef = payload.threadId
        ? { threadId: payload.threadId }
        : payload.projectId
          ? { projectId: payload.projectId }
          : {};
      const key = peerViewMapKey(room, payload.userId);
      const roomKey = conversationRoomKey(room);
      if (!roomKey) return;

      setPeerViews((prev) => {
        const next = new Map(prev);
        if (payload.state === 'closed') {
          next.delete(key);
          next.delete(`${roomKey}:*`);
          return next;
        }
        next.set(key, payload.state);
        next.set(`${roomKey}:*`, payload.state);
        return next;
      });
    };

    socket.on('conversation:view', handleView);

    return () => {
      socket.off('conversation:view', handleView);
      releaseMessagingSocket();
      socketRef.current = null;
      joinedRef.current = new Set();
      setPeerViews(new Map());
    };
  }, [enabled, wsUrl, accessToken, socketPath]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !enabled) return;

    const joinRooms = () => {
      for (const room of rooms) {
        const roomKey = conversationRoomKey(room);
        if (!roomKey || joinedRef.current.has(roomKey)) continue;
        joinedRef.current.add(roomKey);
        if (room.threadId) socket.emit('join:room', { threadId: room.threadId });
        else if (room.projectId) socket.emit('join:room', { projectId: room.projectId });
      }
    };

    if (socket.connected) joinRooms();
    else socket.once('connect', joinRooms);

    return () => {
      socket.off('connect', joinRooms);
    };
  }, [rooms, enabled]);

  const getPeerViewState = useCallback(
    (room: ConversationRoomRef, peerUserId?: string): PeerViewState | null => {
      const roomKey = conversationRoomKey(room);
      if (!roomKey) return null;
      if (peerUserId) {
        const keyed = peerViews.get(peerViewMapKey(room, peerUserId));
        if (keyed) return keyed;
      }
      return peerViews.get(`${roomKey}:*`) ?? null;
    },
    [peerViews]
  );

  return { getPeerViewState, peerViews };
}
