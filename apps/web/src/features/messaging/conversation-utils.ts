import { routes } from '@nestlancer/constants';
import { parseFileMessageContent } from '@nestlancer/api-client';
import type { Conversation } from '@nestlancer/types';
import {
  formatPersonName,
  isGroupSystemMessage,
  resolveGroupSystemMessageLabel,
} from '@nestlancer/ui';

export function conversationIsUnread(c: Conversation): boolean {
  const msg = c.latestMessage;
  return Boolean(msg && !msg.readAt);
}

export function conversationHref(c: Conversation): string {
  if (c.kind === 'THREAD') {
    const threadId = c.threadId || c.id;
    return routes.messageThread(threadId);
  }
  return routes.conversation(c.projectId ?? c.id);
}

export type ConversationKindFilter = 'all' | 'project' | 'direct' | 'group';

export function conversationKindKey(c: Conversation): ConversationKindFilter {
  if (c.kind === 'THREAD') {
    return c.threadType === 'GROUP' ? 'group' : 'direct';
  }
  return 'project';
}

export function conversationKindLabel(c: Conversation): string {
  const key = conversationKindKey(c);
  if (key === 'project') return 'Project';
  if (key === 'group') return 'Group';
  return 'Direct';
}

export function conversationInitials(c: Conversation): string {
  const title = conversationTitle(c);
  const parts = title.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? 'MS').toUpperCase();
}

export function conversationTitle(c: Conversation): string {
  if (c.title?.trim()) return c.title.trim();
  if (c.kind === 'THREAD' && c.threadType === 'GROUP') {
    const count = c.participantIds?.length ?? 0;
    if (count > 0) return `Group · ${count} members`;
    return 'Group conversation';
  }
  if (c.kind === 'THREAD' && c.threadType !== 'GROUP') {
    const fromSender = formatPersonName(c.latestMessage?.sender);
    if (fromSender) return fromSender;
  }
  if (c.kind === 'THREAD') {
    return 'Support';
  }
  return 'Project conversation';
}

export function conversationPreview(c: Conversation): string {
  const msg = c.latestMessage;
  if (!msg || typeof msg !== 'object') return 'No messages yet';
  if (msg.type === 'FILE') {
    const parsed = parseFileMessageContent(String(msg.content ?? ''));
    if (parsed?.caption) return parsed.caption;
    if (parsed?.filename) return `Attachment · ${parsed.filename}`;
    return 'Shared a file';
  }
  if (isGroupSystemMessage(msg)) {
    return resolveGroupSystemMessageLabel(msg, undefined, undefined);
  }
  const text = String(msg.content ?? msg.body ?? '').trim();
  if (text.startsWith('{') && text.includes('"mediaId"')) {
    const parsed = parseFileMessageContent(text);
    if (parsed?.caption) return parsed.caption;
    if (parsed?.filename) return `Attachment · ${parsed.filename}`;
    return 'Shared a file';
  }
  if (text.startsWith('{') && text.includes('"event"')) {
    return resolveGroupSystemMessageLabel(msg, undefined, undefined);
  }
  return text || 'No messages yet';
}

export function conversationActivityAt(c: Conversation): string | undefined {
  if (c.lastMessageAt) return c.lastMessageAt;
  const msg = c.latestMessage;
  if (msg && typeof msg === 'object' && msg.createdAt) return msg.createdAt;
  return undefined;
}

export function conversationProjectId(c: Conversation): string | undefined {
  if (c.projectId) return c.projectId;
  if (c.kind === 'PROJECT') return c.id;
  return undefined;
}

export type QueueSort = 'unread' | 'waiting' | 'recent';

export function sortConversations(items: Conversation[], sort: QueueSort): Conversation[] {
  const copy = [...items];
  copy.sort((a, b) => {
    if (sort === 'unread') {
      const aUnread = conversationIsUnread(a) ? 1 : 0;
      const bUnread = conversationIsUnread(b) ? 1 : 0;
      if (bUnread !== aUnread) return bUnread - aUnread;
    }
    const aTime = new Date(conversationActivityAt(a) ?? 0).getTime();
    const bTime = new Date(conversationActivityAt(b) ?? 0).getTime();
    if (sort === 'waiting') return aTime - bTime;
    return bTime - aTime;
  });
  return copy;
}

export function conversationWaitLabel(c: Conversation): string | null {
  if (!conversationIsUnread(c)) return null;
  const at = conversationActivityAt(c);
  if (!at) return null;
  const mins = Math.floor((Date.now() - new Date(at).getTime()) / 60000);
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function conversationIsUrgent(c: Conversation): boolean {
  if (!conversationIsUnread(c)) return false;
  const at = conversationActivityAt(c);
  if (!at) return false;
  return Date.now() - new Date(at).getTime() > 30 * 60 * 1000;
}

/** Resolve which conversation is open from the messages route pathname. */
export function resolveSelectedConversationId(
  items: Conversation[],
  pathname: string
): string | null {
  const threadMatch = pathname.match(/\/messages\/thread\/([^/]+)/);
  if (threadMatch?.[1]) {
    const id = decodeURIComponent(threadMatch[1]);
    const found = items.find((c) => c.threadId === id || c.id === id);
    return found?.id ?? null;
  }

  // Client project threads live at /messages/[conversationId] (project id).
  const projectMatch = pathname.match(/^\/messages\/([^/]+)$/);
  if (projectMatch?.[1] && projectMatch[1] !== 'new') {
    const id = decodeURIComponent(projectMatch[1]);
    const found = items.find(
      (c) => c.projectId === id || c.id === id || conversationProjectId(c) === id
    );
    return found?.id ?? null;
  }

  return null;
}
