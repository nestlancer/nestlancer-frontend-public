import type { Conversation } from '@nestlancer/types';

/** Shown to peers in the UI. */
export type PeerViewState = 'live' | 'waiting';

/** Emitted over the socket; `closed` clears peer presence. */
export type ConversationViewState = PeerViewState | 'closed';

export type ConversationViewPayload = {
  userId: string;
  state: ConversationViewState;
  projectId?: string | null;
  threadId?: string | null;
  at?: string;
};

export type ConversationRoomRef = {
  projectId?: string;
  threadId?: string;
};

export function conversationRoomKey(room: ConversationRoomRef): string {
  if (room.threadId) return `t:${room.threadId}`;
  if (room.projectId) return `p:${room.projectId}`;
  return '';
}

export function conversationToRoomRef(c: Conversation): ConversationRoomRef {
  if (c.threadId) return { threadId: c.threadId };
  const projectId = c.projectId ?? (c.kind === 'PROJECT' ? c.id : undefined);
  return projectId ? { projectId } : {};
}

export function peerViewMapKey(room: ConversationRoomRef, userId: string): string {
  return `${conversationRoomKey(room)}:${userId}`;
}

/** Resolves the other participant in a conversation for presence/view state. */
export function resolveConversationPeerUserId(
  c: Conversation,
  currentUserId?: string
): string | undefined {
  if (currentUserId && c.participantIds?.length) {
    const peer = c.participantIds.find((id) => id !== currentUserId);
    if (peer) return peer;
  }
  const senderId = c.latestMessage?.senderId;
  if (senderId && senderId !== currentUserId) return senderId;
  return undefined;
}
