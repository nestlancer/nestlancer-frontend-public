import type { Message } from './messaging-types';
import { isGroupSystemMessage, shouldHideSystemMessageForViewer } from './system-message.util';

export type MembershipStint = {
  joinedAt: string;
  leftAt?: string | null;
  leftReason?: 'LEFT' | 'REMOVED' | null;
};

export type MembershipSeparator = {
  id: string;
  kind: 'separator';
  at: string;
  label: string;
  variant: 'leave' | 'rejoin' | 'removed';
};

export type MessageTimelineItem = {
  id: string;
  kind: 'message';
  at: string;
  message: Message;
};

export type ChatTimelineItem = MessageTimelineItem | MembershipSeparator;

function stintSortKey(stints: MembershipStint[]): MembershipStint[] {
  return [...stints].sort(
    (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  );
}

/** Build leave / rejoin separators for the viewing user's membership stints. */
export function buildMembershipSeparators(stints: MembershipStint[]): MembershipSeparator[] {
  const sorted = stintSortKey(stints);
  if (sorted.length === 0) return [];

  const separators: MembershipSeparator[] = [];

  sorted.forEach((stint, index) => {
    if (index > 0) {
      separators.push({
        id: `rejoin-${stint.joinedAt}`,
        kind: 'separator',
        at: stint.joinedAt,
        label: 'You rejoined the group',
        variant: 'rejoin',
      });
    }
    if (stint.leftAt) {
      const removed = stint.leftReason === 'REMOVED';
      separators.push({
        id: `${removed ? 'removed' : 'leave'}-${stint.leftAt}`,
        kind: 'separator',
        at: stint.leftAt,
        label: removed ? 'You were removed from this group' : 'You left this group',
        variant: removed ? 'removed' : 'leave',
      });
    }
  });

  return separators;
}

function timelineSortRank(item: ChatTimelineItem): number {
  if (item.kind === 'separator') {
    return item.variant === 'rejoin' ? 0 : 2;
  }
  if (isGroupSystemMessage(item.message)) {
    return item.message.type === 'SYSTEM' ? 1 : 1;
  }
  return 1;
}

/**
 * Merge chronological messages (oldest → newest) with membership separators.
 * Messages must already be sorted oldest-first.
 */
export function mergeMessagesWithMembershipTimeline(
  messages: Message[],
  stints: MembershipStint[] | undefined,
  viewerUserId?: string | null
): ChatTimelineItem[] {
  const visibleMessages = messages.filter(
    (message) => !shouldHideSystemMessageForViewer(message, viewerUserId)
  );
  const separators = buildMembershipSeparators(stints ?? []);
  const items: ChatTimelineItem[] = [
    ...visibleMessages.map((message) => ({
      id: message.id,
      kind: 'message' as const,
      at: message.createdAt,
      message,
    })),
    ...separators,
  ];

  items.sort((a, b) => {
    const diff = new Date(a.at).getTime() - new Date(b.at).getTime();
    if (diff !== 0) return diff;
    return timelineSortRank(a) - timelineSortRank(b);
  });

  return items;
}

export function findPreviousMessageInTimeline(
  timeline: ChatTimelineItem[],
  index: number
): Message | undefined {
  for (let i = index - 1; i >= 0; i--) {
    const item = timeline[i];
    if (item?.kind === 'message' && !isGroupSystemMessage(item.message)) {
      return item.message;
    }
  }
  return undefined;
}

export function timelineMessageItems(timeline: ChatTimelineItem[]): Message[] {
  return timeline
    .filter((item): item is MessageTimelineItem => item.kind === 'message')
    .map((item) => item.message)
    .filter((message) => !isGroupSystemMessage(message));
}

export function isTimelineGroupEvent(item: ChatTimelineItem): boolean {
  return (
    item.kind === 'separator' || (item.kind === 'message' && isGroupSystemMessage(item.message))
  );
}
