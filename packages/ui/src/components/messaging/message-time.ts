type MessagePerson = {
  firstName?: string | null;
  lastName?: string | null;
};

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  if (date.toDateString() === now.toDateString()) return time;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;

  const datePart =
    date.getFullYear() === now.getFullYear()
      ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return `${datePart} ${time}`;
}

export function formatMessageDayLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function messageDayKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toDateString();
}

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export function shouldShowMessageHeader(
  current: { senderId?: string; createdAt: string },
  previous?: { senderId?: string; createdAt: string },
  options?: { isGroup?: boolean }
): boolean {
  if (options?.isGroup) return true;
  if (!previous) return true;
  if (current.senderId !== previous.senderId) return true;

  const currentTime = new Date(current.createdAt).getTime();
  const previousTime = new Date(previous.createdAt).getTime();
  if (Number.isNaN(currentTime) || Number.isNaN(previousTime)) return true;

  return currentTime - previousTime > GROUP_WINDOW_MS;
}

export function formatPersonName(person?: MessagePerson | null): string | undefined {
  if (!person) return undefined;
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return name || undefined;
}

export function resolveMessageSenderLabel(
  message: { sender?: MessagePerson | null; senderId?: string },
  isMine: boolean,
  perspective: 'client' | 'admin'
): string {
  if (isMine) return 'You';
  const fromSender = formatPersonName(message.sender);
  if (fromSender) return fromSender;
  return perspective === 'client' ? 'Support' : 'Client';
}

/** @deprecated Use resolveMessageSenderLabel */
export function messageSenderLabel(isMine: boolean, perspective: 'client' | 'admin'): string {
  if (isMine) return 'You';
  return perspective === 'client' ? 'Support' : 'Client';
}

export function resolvePeerDisplayName(
  messages: Array<{ sender?: MessagePerson | null; senderId?: string }>,
  currentUserId?: string
): string | undefined {
  const peer = messages.find((m) => m.senderId && m.senderId !== currentUserId);
  return peer ? formatPersonName(peer.sender) : undefined;
}

export function messageSenderInitials(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return '?';
  if (trimmed === 'You') return 'Y';

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 1) ?? '?').toUpperCase();
}

type ReadStatusMessage = {
  id: string;
  senderId?: string;
  readAt?: string;
  readBy?: Array<{ userId?: string; readAt?: string }>;
};

/** Read receipt on the latest sent message only (✓ sent / ✓✓ read). */
export function resolveSentMessageReadStatus(
  message: ReadStatusMessage,
  items: ReadStatusMessage[],
  currentUserId?: string,
  options?: { isGroup?: boolean; recipientCount?: number }
): 'sent' | 'read' | 'partial' | undefined {
  if (!currentUserId || message.senderId !== currentUserId) return undefined;
  const lastMine = [...items].reverse().find((m) => m.senderId === currentUserId);
  if (!lastMine || lastMine.id !== message.id) return undefined;

  if (options?.isGroup && options.recipientCount && options.recipientCount > 1) {
    const readBy = Array.isArray(message.readBy) ? message.readBy : [];
    const othersRead = readBy.filter((r) => r.userId && r.userId !== currentUserId).length;
    const totalOthers = Math.max(options.recipientCount - 1, 1);
    if (othersRead >= totalOthers) return 'read';
    if (othersRead > 0) return 'partial';
    return 'sent';
  }

  return message.readAt ? 'read' : 'sent';
}

/** Label for group read receipts, e.g. "2/3 read". */
export function resolveGroupReadLabel(
  message: ReadStatusMessage,
  currentUserId: string | undefined,
  recipientCount: number
): string | undefined {
  if (!currentUserId || message.senderId !== currentUserId || recipientCount <= 1) return undefined;
  const readBy = Array.isArray(message.readBy) ? message.readBy : [];
  const othersRead = readBy.filter((r) => r.userId && r.userId !== currentUserId).length;
  const totalOthers = Math.max(recipientCount - 1, 1);
  if (othersRead <= 0) return 'Sent';
  if (othersRead >= totalOthers) return 'Read by all';
  return `Read by ${othersRead}/${totalOthers}`;
}
