/** Project or chat-thread row from GET /messages/conversations */
export type ConversationKind = 'PROJECT' | 'THREAD';

export interface Conversation {
  kind: ConversationKind;
  /** Stable list key: projectId or threadId */
  id: string;
  projectId?: string;
  threadId?: string;
  threadType?: 'DIRECT' | 'GROUP';
  /** ACTIVE while in the group; LEFT/REMOVED retains read-only history in inbox */
  membershipStatus?: 'ACTIVE' | 'LEFT' | 'REMOVED';
  /** Thread is in archived inbox (user or global archive) */
  isArchived?: boolean;
  status?: string;
  participantIds?: string[];
  lastMessageAt?: string;
  title?: string | null;
  latestMessage?: Message | null;
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

export interface ChatThreadMembershipStint {
  joinedAt: string;
  leftAt?: string | null;
  leftReason?: 'LEFT' | 'REMOVED' | null;
}

export interface ChatThreadDetail {
  id: string;
  type: 'DIRECT' | 'GROUP';
  title: string | null;
  createdById: string;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  members: ChatThreadMember[];
  membershipStatus?: 'ACTIVE' | 'LEFT' | 'REMOVED';
  membershipStints?: ChatThreadMembershipStint[];
  userArchivedAt?: string | null;
  userHiddenAt?: string | null;
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
  /** @deprecated Use `content` instead */
  body?: string;
  createdAt: string;
  readAt?: string;
  type?: string;
  /** JSON blob — may include `pinned: true`, `mentions: string[]`, and group system metadata */
  reactions?: unknown;
  readBy?: Array<{ userId?: string; readAt?: string }>;
  /** Parent message id when this message is a reply */
  replyToId?: string | null;
}
