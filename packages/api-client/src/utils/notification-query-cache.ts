import type { QueryClient } from '@tanstack/react-query';
import type { NotificationItem, PaginatedResponse } from '@nestlancer/types';

import { normalizeNotificationItem } from './normalize-notification';

type NotificationListPage = PaginatedResponse<NotificationItem>;
type UnreadCountCache = { unread: number };

const NOTIFICATIONS_UNREAD_KEY = ['notifications', 'unread'] as const;
const NOTIFICATIONS_LIST_PREFIX = ['notifications', 'list'] as const;

/** Read unread badge count from any cached/API shape (`unread`, `count`, `totalUnread`). */
export function resolveNotificationUnreadCount(data: unknown): number {
  if (!data || typeof data !== 'object') return 0;
  const rec = data as Record<string, unknown>;
  if (typeof rec.unread === 'number') return Math.max(0, rec.unread);
  if (typeof rec.count === 'number') return Math.max(0, rec.count);
  if (typeof rec.totalUnread === 'number') return Math.max(0, rec.totalUnread);
  return 0;
}

export function setUnreadCountCache(qc: QueryClient, unread: number): void {
  qc.setQueryData<UnreadCountCache>(NOTIFICATIONS_UNREAD_KEY, {
    unread: Math.max(0, unread),
  });
}

export function adjustUnreadCountCache(qc: QueryClient, delta: number): void {
  const current = resolveNotificationUnreadCount(
    qc.getQueryData<UnreadCountCache>(NOTIFICATIONS_UNREAD_KEY)
  );
  setUnreadCountCache(qc, current + delta);
}

function listLimitFromQueryKey(key: readonly unknown[]): number | undefined {
  const params = key[2];
  if (!params || typeof params !== 'object') return undefined;
  const limit = (params as Record<string, unknown>).limit;
  return typeof limit === 'number' ? limit : undefined;
}

function extractNotificationPayload(payload: unknown): NotificationItem | null {
  if (!payload || typeof payload !== 'object') return null;
  const rec = payload as Record<string, unknown>;
  const raw = rec.notification ?? payload;
  if (!raw || typeof raw !== 'object' || !('id' in raw)) return null;
  return normalizeNotificationItem(raw);
}

export function prependNotificationToListCaches(qc: QueryClient, item: NotificationItem): boolean {
  let inserted = false;
  const queries = qc.getQueryCache().findAll({ queryKey: NOTIFICATIONS_LIST_PREFIX });
  for (const query of queries) {
    qc.setQueryData<NotificationListPage>(query.queryKey, (old) => {
      const limit = listLimitFromQueryKey(query.queryKey);
      const items = old?.items ?? [];
      if (items.some((n) => n.id === item.id)) return old;

      inserted = true;
      const nextItems = [item, ...items];
      const sliced = limit ? nextItems.slice(0, limit) : nextItems;

      if (!old) {
        return {
          items: sliced,
          total: sliced.length,
          page: 1,
          pageSize: limit ?? sliced.length,
          hasMore: false,
        };
      }

      return {
        ...old,
        items: sliced,
      };
    });
  }
  return inserted;
}

export function invalidateNotificationQueries(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
  void qc.invalidateQueries({ queryKey: NOTIFICATIONS_LIST_PREFIX });
}

function isUnreadNotification(item: NotificationItem): boolean {
  if (typeof item.read === 'boolean') return !item.read;
  return !item.readAt;
}

/** Apply a live `notification:new` payload to TanStack caches. */
export function applyNotificationRealtimeEvent(qc: QueryClient, payload: unknown): void {
  const item = extractNotificationPayload(payload);
  if (item) {
    const inserted = prependNotificationToListCaches(qc, item);
    if (inserted && isUnreadNotification(item)) {
      adjustUnreadCountCache(qc, 1);
    }
  }
  invalidateNotificationQueries(qc);
}

/** Apply a live unread-count push and refresh list caches. */
export function applyUnreadCountRealtimeEvent(qc: QueryClient, unread: number): void {
  setUnreadCountCache(qc, unread);
  void qc.invalidateQueries({ queryKey: NOTIFICATIONS_LIST_PREFIX });
}

/** Optimistically drop one unread badge count after marking a notification read. */
export function applyNotificationMarkedRead(qc: QueryClient): void {
  adjustUnreadCountCache(qc, -1);
  invalidateNotificationQueries(qc);
}

/** Optimistically clear unread badge count after mark-all-read. */
export function applyAllNotificationsMarkedRead(qc: QueryClient): void {
  setUnreadCountCache(qc, 0);
  invalidateNotificationQueries(qc);
}
