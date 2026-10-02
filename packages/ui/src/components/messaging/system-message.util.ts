import type { ChatThreadMember } from './messaging-types';
import type { Message } from './messaging-types';
import { formatPersonName } from './message-time';

export type GroupMembershipSystemEvent = 'MEMBER_LEFT' | 'MEMBER_REMOVED' | 'MEMBER_JOINED';

type GroupMembershipSystemPayload = {
  event: GroupMembershipSystemEvent;
  subjectUserId: string;
  subjectName?: string;
  actorUserId?: string;
  actorName?: string;
};

const PLAIN_TEXT_GROUP_EVENT =
  /^(You|[\w][\w\s.'-]{0,60})\s+(left the group|joined the group|was removed from the group|were removed from the group)$/i;

export function messageText(message: Message): string {
  return String(message.content ?? message.body ?? '').trim();
}

function parseJsonPayload(content: string): GroupMembershipSystemPayload | null {
  if (!content.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(content) as Partial<GroupMembershipSystemPayload>;
    if (
      parsed.event &&
      ['MEMBER_LEFT', 'MEMBER_REMOVED', 'MEMBER_JOINED'].includes(parsed.event) &&
      typeof parsed.subjectUserId === 'string'
    ) {
      return {
        event: parsed.event as GroupMembershipSystemEvent,
        subjectUserId: parsed.subjectUserId,
        subjectName: typeof parsed.subjectName === 'string' ? parsed.subjectName : undefined,
        actorUserId: typeof parsed.actorUserId === 'string' ? parsed.actorUserId : undefined,
        actorName: typeof parsed.actorName === 'string' ? parsed.actorName : undefined,
      };
    }
  } catch {
    return null;
  }
  return null;
}

function parseMetadataPayload(message: Message): GroupMembershipSystemPayload | null {
  if (!message.reactions || typeof message.reactions !== 'object') return null;
  const groupEvent = (message.reactions as { groupEvent?: Partial<GroupMembershipSystemPayload> })
    .groupEvent;
  if (
    groupEvent?.event &&
    ['MEMBER_LEFT', 'MEMBER_REMOVED', 'MEMBER_JOINED'].includes(groupEvent.event) &&
    typeof groupEvent.subjectUserId === 'string'
  ) {
    return {
      event: groupEvent.event as GroupMembershipSystemEvent,
      subjectUserId: groupEvent.subjectUserId,
      subjectName: typeof groupEvent.subjectName === 'string' ? groupEvent.subjectName : undefined,
      actorUserId: typeof groupEvent.actorUserId === 'string' ? groupEvent.actorUserId : undefined,
      actorName: typeof groupEvent.actorName === 'string' ? groupEvent.actorName : undefined,
    };
  }
  return null;
}

export function isPlainTextGroupEventContent(content: string | null | undefined): boolean {
  if (!content) return false;
  return PLAIN_TEXT_GROUP_EVENT.test(content.trim());
}

export function getGroupMembershipEventPayload(
  message: Message
): GroupMembershipSystemPayload | null {
  return parseMetadataPayload(message) ?? parseJsonPayload(messageText(message));
}

export function isGroupMembershipEventContent(content: string | null | undefined): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  return parseJsonPayload(trimmed) !== null || isPlainTextGroupEventContent(trimmed);
}

export function isGroupSystemMessage(message: Message): boolean {
  if (message.type === 'SYSTEM') return true;
  if (getGroupMembershipEventPayload(message)) return true;
  const text = messageText(message);
  if (isPlainTextGroupEventContent(text)) return true;
  if (text.includes('"event":"MEMBER_') || text.includes('"event": "MEMBER_')) return true;
  return false;
}

/** Hide shared system lines for the viewer when personal stint separators already cover them. */
export function shouldHideSystemMessageForViewer(
  message: Message,
  viewerUserId?: string | null
): boolean {
  if (!viewerUserId || !isGroupSystemMessage(message)) return false;
  const payload = getGroupMembershipEventPayload(message);
  if (payload?.subjectUserId === viewerUserId) return true;
  const text = messageText(message);
  return /^You\s+(left|joined|were removed)/i.test(text);
}

function memberName(members: ChatThreadMember[] | undefined, userId: string): string | undefined {
  const member = members?.find((m) => m.userId === userId);
  if (member?.user) {
    return formatPersonName(member.user) || undefined;
  }
  return undefined;
}

function senderName(message: Message, userId: string): string | undefined {
  if (message.sender?.id === userId || message.senderId === userId) {
    return formatPersonName(message.sender ?? {}) || undefined;
  }
  return undefined;
}

function resolveSubjectDisplayName(
  message: Message,
  members: ChatThreadMember[] | undefined,
  payload: GroupMembershipSystemPayload,
  viewerUserId?: string | null
): string {
  if (viewerUserId && payload.subjectUserId === viewerUserId) {
    return 'You';
  }
  return (
    payload.subjectName?.trim() ||
    senderName(message, payload.subjectUserId) ||
    memberName(members, payload.subjectUserId) ||
    'A member'
  );
}

function labelFromPayload(
  payload: GroupMembershipSystemPayload,
  message: Message,
  members: ChatThreadMember[] | undefined,
  viewerUserId?: string | null
): string {
  const subjectName = resolveSubjectDisplayName(message, members, payload, viewerUserId);
  const subjectIsViewer = subjectName === 'You';

  switch (payload.event) {
    case 'MEMBER_LEFT':
      return subjectIsViewer ? 'You left the group' : `${subjectName} left the group`;
    case 'MEMBER_REMOVED':
      return subjectIsViewer
        ? 'You were removed from the group'
        : `${subjectName} was removed from the group`;
    case 'MEMBER_JOINED':
      return subjectIsViewer ? 'You joined the group' : `${subjectName} joined the group`;
    default:
      return 'Group update';
  }
}

export function resolveGroupSystemMessageLabel(
  message: Message,
  members: ChatThreadMember[] | undefined,
  viewerUserId?: string | null
): string {
  const payload = getGroupMembershipEventPayload(message);
  if (payload) {
    return labelFromPayload(payload, message, members, viewerUserId);
  }

  const text = messageText(message);
  if (text && !text.startsWith('{')) {
    if (viewerUserId && /^You\s+/i.test(text)) return text;
    return text;
  }

  return 'Group update';
}

export function resolveGroupSystemMessageVariant(
  message: Message
): 'leave' | 'rejoin' | 'removed' | 'neutral' {
  const payload = getGroupMembershipEventPayload(message);
  if (payload) {
    switch (payload.event) {
      case 'MEMBER_LEFT':
        return 'leave';
      case 'MEMBER_REMOVED':
        return 'removed';
      case 'MEMBER_JOINED':
        return 'rejoin';
      default:
        return 'neutral';
    }
  }

  const text = messageText(message).toLowerCase();
  if (text.includes('left the group')) return 'leave';
  if (text.includes('removed from the group')) return 'removed';
  if (text.includes('joined the group')) return 'rejoin';
  return 'neutral';
}

/** Never show raw JSON in a chat bubble — use for regular message content fallback. */
export function resolveRenderableMessageContent(
  message: Message,
  members?: ChatThreadMember[],
  viewerUserId?: string | null
): string {
  if (isGroupSystemMessage(message)) {
    return resolveGroupSystemMessageLabel(message, members, viewerUserId);
  }
  const text = messageText(message);
  if (text.startsWith('{') && parseJsonPayload(text)) {
    return resolveGroupSystemMessageLabel(message, members, viewerUserId);
  }
  return text;
}
