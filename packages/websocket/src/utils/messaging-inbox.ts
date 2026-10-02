import type { MessagingInboundPayload, MessagingInboxRoom } from '../hooks/useMessagingInboxRealtime';

type ConversationLike = {
  id: string;
  kind?: string;
  projectId?: string;
  threadId?: string;
};

export function conversationsToInboxRooms(conversations: ConversationLike[]): MessagingInboxRoom[] {
  return conversations.map((c) => {
    if (c.threadId) return { threadId: c.threadId };
    const projectId = c.projectId ?? (c.kind === 'PROJECT' ? c.id : undefined);
    return projectId ? { projectId } : {};
  });
}

export function findConversationForInboundMessage<T extends ConversationLike>(
  items: T[],
  msg: Pick<MessagingInboundPayload, 'projectId' | 'threadId'>
): T | undefined {
  if (msg.threadId) {
    return items.find((c) => c.threadId === msg.threadId || c.id === msg.threadId);
  }
  if (msg.projectId) {
    return items.find(
      (c) => c.projectId === msg.projectId || c.id === msg.projectId || c.id === msg.projectId
    );
  }
  return undefined;
}
