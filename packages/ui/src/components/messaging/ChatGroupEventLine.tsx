import type { ChatThreadMember } from './messaging-types';
import type { Message } from './messaging-types';
import { MessageMembershipDivider } from './MessageMembershipDivider';
import {
  isGroupSystemMessage,
  resolveGroupSystemMessageLabel,
  resolveGroupSystemMessageVariant,
} from './system-message.util';

/** Centered join/leave/remove line — same style for every viewer (admin, client, peers). */
export function ChatGroupEventLine({
  message,
  members,
  viewerUserId,
  compact,
}: {
  message: Message;
  members?: ChatThreadMember[];
  viewerUserId?: string | null;
  compact?: boolean;
}) {
  if (!isGroupSystemMessage(message)) return null;

  return (
    <MessageMembershipDivider
      label={resolveGroupSystemMessageLabel(message, members, viewerUserId)}
      variant={resolveGroupSystemMessageVariant(message)}
      compact={compact}
    />
  );
}
