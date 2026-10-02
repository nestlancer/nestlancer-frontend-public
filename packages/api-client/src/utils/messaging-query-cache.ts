/** Read message unread badge count from dashboard summary or unread-count API shapes. */
export function resolveMessageUnreadCount(data: unknown): number {
  if (!data || typeof data !== 'object') return 0;
  const rec = data as Record<string, unknown>;
  if (typeof rec.totalUnread === 'number') return Math.max(0, rec.totalUnread);
  if (typeof rec.unread === 'number') return Math.max(0, rec.unread);
  if (typeof rec.count === 'number') return Math.max(0, rec.count);
  return 0;
}
