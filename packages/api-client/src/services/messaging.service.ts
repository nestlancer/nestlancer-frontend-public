import type {
  ChatThreadDetail,
  ChatThreadMember,
  Conversation,
  Message,
  PaginatedResponse,
  UnreadMessageCount,
} from '@nestlancer/types';
import type { AxiosInstance } from 'axios';

import { BaseService } from './base.service';
import { asPaginated, peelSuccessEnvelope } from '../utils/peel-success-envelope';
import { unwrapGatewayBody } from '../utils/unwrap-gateway-body';

function resolveLastMessageAt(
  raw: Record<string, unknown>,
  latestMessage: Message | null
): string | undefined {
  if (typeof raw.lastMessageAt === 'string' && raw.lastMessageAt.trim()) {
    return raw.lastMessageAt;
  }
  if (latestMessage?.createdAt) return latestMessage.createdAt;
  if (typeof raw.updatedAt === 'string' && raw.updatedAt.trim()) return raw.updatedAt;
  return undefined;
}

function mapConversation(raw: Record<string, unknown>): Conversation {
  const kind = raw.kind === 'THREAD' ? 'THREAD' : 'PROJECT';
  if (kind === 'THREAD') {
    const threadId = String(raw.threadId ?? '');
    const lm = (raw.latestMessage as Message | null | undefined) ?? null;
    return {
      kind: 'THREAD',
      id: threadId,
      threadId,
      threadType:
        raw.threadType === 'GROUP' || raw.threadType === 'DIRECT' ? raw.threadType : undefined,
      title: typeof raw.title === 'string' ? raw.title : ((raw.title as null) ?? undefined),
      participantIds: Array.isArray(raw.participantIds)
        ? (raw.participantIds as string[])
        : undefined,
      membershipStatus:
        raw.membershipStatus === 'LEFT' ||
        raw.membershipStatus === 'REMOVED' ||
        raw.membershipStatus === 'ACTIVE'
          ? raw.membershipStatus
          : undefined,
      isArchived: raw.isArchived === true,
      latestMessage: lm,
      lastMessageAt: resolveLastMessageAt(raw, lm),
    };
  }
  const projectId = String(raw.projectId ?? raw.id ?? '');
  const lm = (raw.latestMessage as Message | null | undefined) ?? null;
  return {
    kind: 'PROJECT',
    id: projectId,
    projectId,
    status: typeof raw.status === 'string' ? raw.status : undefined,
    title: typeof raw.title === 'string' ? raw.title : undefined,
    latestMessage: lm,
    participantIds: Array.isArray(raw.participantIds)
      ? (raw.participantIds as string[])
      : undefined,
    lastMessageAt: resolveLastMessageAt(raw, lm),
  };
}

export class MessagingService extends BaseService {
  constructor(client: AxiosInstance) {
    super(client);
  }

  async unreadCount(): Promise<UnreadMessageCount> {
    const { data } = await this.client.get<unknown>('/messages/conversations/unread-count');
    const inner = unwrapGatewayBody<UnreadMessageCount | { totalUnread?: number }>(data);
    if (inner && typeof inner === 'object' && 'totalUnread' in inner) {
      return inner as UnreadMessageCount;
    }
    const peeled = peelSuccessEnvelope(data) as { totalUnread?: number };
    return { totalUnread: typeof peeled?.totalUnread === 'number' ? peeled.totalUnread : 0 };
  }

  async conversations(params?: {
    page?: number;
    limit?: number;
    filter?: 'active' | 'archived';
  }): Promise<PaginatedResponse<Conversation>> {
    const { data } = await this.client.get<unknown>('/messages/conversations', { params });
    const p = asPaginated<Record<string, unknown>>(data);
    return {
      ...p,
      items: p.items.map((row) => mapConversation(row)),
    };
  }

  async projectMessages(
    projectId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Message>> {
    const { data } = await this.client.get<unknown>(
      `/messages/projects/${encodeURIComponent(projectId)}`,
      {
        params,
      }
    );
    return asPaginated<Message>(data);
  }

  async sendProjectMessage(
    projectId: string,
    payload: { content?: string; type?: string; mediaId?: string; replyToId?: string }
  ): Promise<Message> {
    const { data } = await this.client.post<unknown>(
      `/messages/projects/${encodeURIComponent(projectId)}`,
      payload
    );
    return unwrapGatewayBody<Message>(data);
  }

  async sendMessage(payload: {
    projectId?: string;
    threadId?: string;
    content?: string;
    type?: string;
    mediaId?: string;
    replyToId?: string;
  }): Promise<Message> {
    const { data } = await this.client.post<unknown>('/messages', payload);
    return unwrapGatewayBody<Message>(data);
  }

  async markMessageRead(messageId: string): Promise<void> {
    await this.client.post(`/messages/${encodeURIComponent(messageId)}/read`);
  }

  async markProjectRead(projectId: string): Promise<void> {
    await this.client.post(`/messages/project/${encodeURIComponent(projectId)}/read`);
  }

  async chatThreadList(params?: { page?: number; limit?: number }): Promise<
    PaginatedResponse<{
      threadId: string;
      type: string;
      title: string | null;
      latestMessage: Message | null;
      updatedAt: string;
    }>
  > {
    const { data } = await this.client.get<unknown>('/messages/threads', { params });
    return asPaginated(data);
  }

  async createDirectThread(peerUserId?: string): Promise<{ id: string }> {
    const body =
      peerUserId !== undefined && peerUserId !== null && String(peerUserId).trim() !== ''
        ? { peerUserId: String(peerUserId).trim() }
        : {};
    const { data } = await this.client.post<unknown>('/messages/threads/direct', body);
    return unwrapGatewayBody<{ id: string }>(data);
  }

  async createGroupThread(body: {
    title?: string;
    clientUserIds: string[];
  }): Promise<{ id: string }> {
    const { data } = await this.client.post<unknown>('/messages/threads/group', body);
    return unwrapGatewayBody<{ id: string }>(data);
  }

  async chatThreadMessages(
    threadId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Message>> {
    const { data } = await this.client.get<unknown>(
      `/messages/threads/${encodeURIComponent(threadId)}/messages`,
      { params }
    );
    return asPaginated<Message>(data);
  }

  async sendChatThreadMessage(
    threadId: string,
    payload: { content?: string; type?: string; mediaId?: string; replyToId?: string }
  ): Promise<Message> {
    const { data } = await this.client.post<unknown>(
      `/messages/threads/${encodeURIComponent(threadId)}/messages`,
      payload
    );
    return unwrapGatewayBody<Message>(data);
  }

  async markChatThreadRead(threadId: string): Promise<void> {
    await this.client.post(`/messages/threads/${encodeURIComponent(threadId)}/read`);
  }

  async getChatThread(threadId: string): Promise<ChatThreadDetail> {
    const { data } = await this.client.get<unknown>(
      `/messages/threads/${encodeURIComponent(threadId)}`
    );
    return unwrapGatewayBody<ChatThreadDetail>(data);
  }

  async getChatThreadMembers(threadId: string): Promise<ChatThreadMember[]> {
    const { data } = await this.client.get<unknown>(
      `/messages/threads/${encodeURIComponent(threadId)}/members`
    );
    return unwrapGatewayBody<ChatThreadMember[]>(data);
  }

  async updateChatThread(threadId: string, body: { title?: string }): Promise<ChatThreadDetail> {
    const { data } = await this.client.patch<unknown>(
      `/messages/threads/${encodeURIComponent(threadId)}`,
      body
    );
    return unwrapGatewayBody<ChatThreadDetail>(data);
  }

  async addChatThreadMembers(
    threadId: string,
    body: { clientUserIds: string[] }
  ): Promise<ChatThreadDetail> {
    const { data } = await this.client.post<unknown>(
      `/messages/threads/${encodeURIComponent(threadId)}/members`,
      body
    );
    return unwrapGatewayBody<ChatThreadDetail>(data);
  }

  async removeChatThreadMember(threadId: string, memberUserId: string): Promise<ChatThreadDetail> {
    const { data } = await this.client.delete<unknown>(
      `/messages/threads/${encodeURIComponent(threadId)}/members/${encodeURIComponent(memberUserId)}`
    );
    return unwrapGatewayBody<ChatThreadDetail>(data);
  }

  async leaveChatThread(threadId: string): Promise<{ success: boolean }> {
    const { data } = await this.client.post<unknown>(
      `/messages/threads/${encodeURIComponent(threadId)}/leave`,
      {}
    );
    return unwrapGatewayBody<{ success: boolean }>(data);
  }

  async archiveChatThread(threadId: string): Promise<ChatThreadDetail> {
    const { data } = await this.client.post<unknown>(
      `/messages/threads/${encodeURIComponent(threadId)}/archive`,
      {}
    );
    return unwrapGatewayBody<ChatThreadDetail>(data);
  }

  async unarchiveChatThread(threadId: string): Promise<ChatThreadDetail> {
    const { data } = await this.client.post<unknown>(
      `/messages/threads/${encodeURIComponent(threadId)}/unarchive`,
      {}
    );
    return unwrapGatewayBody<ChatThreadDetail>(data);
  }

  async userArchiveChatThread(threadId: string): Promise<ChatThreadDetail> {
    const { data } = await this.client.post<unknown>(
      `/messages/threads/${encodeURIComponent(threadId)}/user-archive`,
      {}
    );
    return unwrapGatewayBody<ChatThreadDetail>(data);
  }

  async userUnarchiveChatThread(threadId: string): Promise<ChatThreadDetail> {
    const { data } = await this.client.post<unknown>(
      `/messages/threads/${encodeURIComponent(threadId)}/user-unarchive`,
      {}
    );
    return unwrapGatewayBody<ChatThreadDetail>(data);
  }

  async userHideChatThread(threadId: string): Promise<{ success: boolean }> {
    const { data } = await this.client.post<unknown>(
      `/messages/threads/${encodeURIComponent(threadId)}/user-hide`,
      {}
    );
    return unwrapGatewayBody<{ success: boolean }>(data);
  }

  async searchMessages(params: {
    q?: string;
    projectId?: string;
    threadId?: string;
    page?: number;
  }): Promise<PaginatedResponse<Message>> {
    const { data } = await this.client.get<unknown>('/messages/search', { params });
    return asPaginated<Message>(data);
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.client.delete(`/messages/${encodeURIComponent(messageId)}`);
  }

  async patchMessage(messageId: string, payload: { content: string }): Promise<Message> {
    const { data } = await this.client.patch<unknown>(
      `/messages/${encodeURIComponent(messageId)}`,
      payload
    );
    return unwrapGatewayBody<Message>(data);
  }

  async pinMessage(messageId: string): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/messages/${encodeURIComponent(messageId)}/pin`
    );
    return peelSuccessEnvelope(data);
  }

  async unpinMessage(messageId: string): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/messages/${encodeURIComponent(messageId)}/unpin`
    );
    return peelSuccessEnvelope(data);
  }

  async flagMessage(messageId: string): Promise<unknown> {
    const { data } = await this.client.post<unknown>(
      `/messages/${encodeURIComponent(messageId)}/flag`
    );
    return peelSuccessEnvelope(data);
  }

  async getMessageThreads(messageId: string): Promise<{ items: Message[] }> {
    const { data } = await this.client.get<unknown>(
      `/messages/${encodeURIComponent(messageId)}/threads`
    );
    return { items: asPaginated<Message>(data).items };
  }

  async replyInThread(
    messageId: string,
    payload: { content?: string; type?: string; mediaId?: string }
  ): Promise<Message> {
    const { data } = await this.client.post<unknown>(
      `/messages/${encodeURIComponent(messageId)}/threads`,
      { type: 'TEXT', ...payload }
    );
    return unwrapGatewayBody<Message>(data);
  }

  /** @deprecated Prefer projectMessages — kept for backwards compatibility */
  async threadMessages(
    projectId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Message>> {
    return this.projectMessages(projectId, params);
  }
}
