'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

import { getMessagingSocket, releaseMessagingSocket } from '../messaging-socket';
import {
  type ConversationViewPayload,
  type ConversationViewState,
  type PeerViewState,
} from '../utils/conversation-room';

export interface TypingIndicatorPayload {
  userId: string;
  isTyping?: boolean;
  displayName?: string;
}

export interface UseMessagingRoomOptions {
  /** WebSocket gateway origin, same as `NEXT_PUBLIC_WS_URL` (no path). */
  wsUrl: string;
  accessToken?: string;
  socketPath?: string;
  projectId?: string;
  threadId?: string;
  currentUserId?: string;
  enabled?: boolean;
  /** Called when the gateway broadcasts `message:new` for this room. */
  onMessageNew?: () => void;
}

export interface UseMessagingRoomResult {
  /** Display names / IDs currently typing in the room. */
  typingUsers: string[];
  /** Emit a `typing:start` event to inform other participants. */
  emitTyping: () => void;
  /** Broadcast popup state: live (open), waiting (minimized), or closed (dismissed). */
  emitViewState: (state: ConversationViewState) => void;
  /** The other participant's popup state when known. */
  peerViewState: PeerViewState | null;
}

/**
 * Subscribes to the `/messages` Socket.IO namespace: authenticates, joins the
 * project or thread room, forwards realtime events, and tracks typing indicators.
 */
export function useMessagingRoom(opts: UseMessagingRoomOptions): UseMessagingRoomResult {
  const {
    wsUrl,
    accessToken,
    socketPath,
    projectId,
    threadId,
    currentUserId,
    enabled = true,
    onMessageNew,
  } = opts;
  const onMessageNewRef = useRef(onMessageNew);
  onMessageNewRef.current = onMessageNew;
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;
  const socketRef = useRef<Socket | null>(null);
  const pendingViewStateRef = useRef<ConversationViewState | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [peerViewState, setPeerViewState] = useState<PeerViewState | null>(null);

  const roomPayload = useMemo(
    () => (projectId ? { projectId } : threadId ? { threadId } : null),
    [projectId, threadId]
  );

  const flushViewState = useCallback(
    (state: ConversationViewState) => {
      if (!roomPayload) return;
      const socket = socketRef.current;
      if (!socket?.connected) return;
      socket.emit('conversation:view', { ...roomPayload, state });
    },
    [roomPayload]
  );

  useEffect(() => {
    if (!enabled || !wsUrl || (!projectId && !threadId) || !accessToken) return;

    const socket = getMessagingSocket(wsUrl, accessToken, socketPath);
    socketRef.current = socket;

    const join = () => {
      if (projectId) socket.emit('join:room', { projectId });
      else if (threadId) socket.emit('join:room', { threadId });
      if (pendingViewStateRef.current) {
        flushViewState(pendingViewStateRef.current);
      }
    };

    const handleNew = () => {
      onMessageNewRef.current?.();
    };

    const handleTypingIndicator = (payload: TypingIndicatorPayload) => {
      const name = payload.displayName ?? payload.userId;
      if (payload.isTyping === false) {
        setTypingUsers((prev) => prev.filter((n) => n !== name));
        return;
      }
      setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
    };

    const handleView = (payload: ConversationViewPayload) => {
      if (!payload?.userId || !payload.state) return;
      const uid = currentUserIdRef.current;
      if (uid && payload.userId === uid) return;
      if (payload.state === 'closed') {
        setPeerViewState(null);
        return;
      }
      setPeerViewState(payload.state);
    };

    socket.on('connect', join);
    socket.on('message:new', handleNew);
    socket.on('typing:indicator', handleTypingIndicator);
    socket.on('conversation:view', handleView);
    if (socket.connected) join();

    return () => {
      socket.off('connect', join);
      socket.off('message:new', handleNew);
      socket.off('typing:indicator', handleTypingIndicator);
      socket.off('conversation:view', handleView);
      releaseMessagingSocket();
      socketRef.current = null;
      pendingViewStateRef.current = null;
      setTypingUsers([]);
      setPeerViewState(null);
    };
  }, [enabled, wsUrl, accessToken, socketPath, projectId, threadId, flushViewState]);

  const emitTyping = useCallback(() => {
    if (!roomPayload) return;
    socketRef.current?.emit('typing:start', roomPayload);
  }, [roomPayload]);

  const emitViewState = useCallback(
    (state: ConversationViewState) => {
      pendingViewStateRef.current = state === 'closed' ? null : state;
      flushViewState(state);
    },
    [flushViewState]
  );

  return { typingUsers, emitTyping, emitViewState, peerViewState };
}
