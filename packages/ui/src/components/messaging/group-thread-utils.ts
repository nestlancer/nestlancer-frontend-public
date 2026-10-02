import type { ChatThreadMember, Conversation } from './messaging-types';

import { formatPersonName } from './message-time';

export function isGroupConversation(conversation?: Conversation | null): boolean {
  return conversation?.kind === 'THREAD' && conversation.threadType === 'GROUP';
}

export function formatMemberName(member: ChatThreadMember): string {
  const name = formatPersonName(member.user);
  if (name) return name;
  if (member.user.email) return member.user.email;
  return 'Member';
}

export function memberInitials(member: ChatThreadMember): string {
  const name = formatMemberName(member);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? 'M').toUpperCase();
}

export function resolveGroupThreadTitle(
  conversation: Conversation | undefined,
  members: ChatThreadMember[] | undefined
): string {
  if (conversation?.title?.trim()) return conversation.title.trim();
  if (members && members.length > 0) {
    const clientNames = members
      .filter((m) => m.user.role === 'USER')
      .map((m) => formatMemberName(m))
      .filter(Boolean);
    if (clientNames.length > 0) {
      if (clientNames.length <= 3) return clientNames.join(', ');
      return `${clientNames.slice(0, 2).join(', ')} +${clientNames.length - 2}`;
    }
  }
  return 'Group conversation';
}

export function resolveGroupThreadSubtitle(memberCount: number): string {
  return `Group · ${memberCount} member${memberCount === 1 ? '' : 's'}`;
}

export function groupMemberCount(
  members: ChatThreadMember[] | undefined,
  participantIds: string[] | undefined
): number {
  if (members && members.length > 0) return members.length;
  if (participantIds && participantIds.length > 0) return participantIds.length;
  return 0;
}
