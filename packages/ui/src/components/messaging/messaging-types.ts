/** Local messaging types for @nestlancer/ui (mirrors @nestlancer/types/api/messaging). */

export type ConversationKind = 'PROJECT' | 'THREAD';

export interface Conversation {
  kind: ConversationKind;
  id: string;
  projectId?: string;
  threadId?: string;
  threadType?: 'DIRECT' | 'GROUP';
  status?: string;
  participantIds?: string[];
  lastMessageAt?: string;
  title?: string | null;
  latestMessage?: Message | null;
}

export interface MessageSender {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
}

export interface Message {
  id: string;
  conversationId?: string;
  projectId?: string | null;
  threadId?: string | null;
  senderId?: string;
  sender?: MessageSender | null;
  content: string;
  body?: string;
  createdAt: string;
  readAt?: string;
  type?: string;
  reactions?: unknown;
  replyToId?: string | null;
}

export interface ChatThreadMemberUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatar?: string | null;
  role?: string;
}

export interface ChatThreadMember {
  userId: string;
  joinedAt: string;
  user: ChatThreadMemberUser;
}

export interface ChatThreadDetail {
  id: string;
  type: 'DIRECT' | 'GROUP';
  title: string | null;
  createdById: string;
  archivedAt?: string | null;
  members: ChatThreadMember[];
}
