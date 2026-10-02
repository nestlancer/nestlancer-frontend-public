'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Check, Trash2 } from '@nestlancer/ui/icons';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage, resolveNotificationUnreadCount } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import type { NotificationItem } from '@nestlancer/types';
import { Button, EmptyState, ErrorState, PageHeader, SkeletonText, cn } from '@nestlancer/ui';
import { resolveNotificationIcon } from '@nestlancer/ui/notifications';
import {
  isExternalNotificationHref,
  isNotificationUnread,
  notificationCategoryFromType,
} from '@nestlancer/utils/notifications';
import { formatRelativeTime } from '@nestlancer/utils';

import { useWebConfirm } from '@/components/web/WebConfirmProvider';
import { WebPanel } from '@/components/web/WebPanel';
import { SettingsNotificationsClient } from '@/features/settings/SettingsNotificationsClient';
import { apiServices } from '@/lib/axios';

import { NotificationsTabBar } from './NotificationsTabBar';
import {
  parseNotificationTab,
  NOTIFICATION_TAB_LABELS,
  type NotificationTab,
} from './notifications-tabs';

type NotificationBucket = {
  key: string;
  label: string;
  items: NotificationItem[];
};

/** Soft-fix legacy SCREAMING_SNAKE / camelCase enums and awkward template grammar. */
function humanizeNotificationCopy(text: string): string {
  return (
    text
      .replace(/\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\b/g, (token) =>
        token
          .split('_')
          .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
          .join(' ')
      )
      .replace(/\b([a-z]+)((?:[A-Z][a-z0-9]+)+)\b/g, (_m, head: string, rest: string) => {
        const words = `${head}${rest}`.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
        return words.replace(/\b\w/g, (c) => c.toUpperCase());
      })
      // NL-NOTIF-002: "Payment receipt ready for X is ready…" → "Payment receipt for X is ready…"
      .replace(/\bready\s+for\b(?=[\s\S]*\bis ready\b)/gi, 'for')
      // "Title. is ready for review" → "Title is ready for review"
      .replace(/([.!?])\s+(is ready\b)/gi, ' $2')
      .replace(/\s{2,}/g, ' ')
      .trim()
  );
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function groupNotifications(items: NotificationItem[]): NotificationBucket[] {
  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  const map = new Map<string, NotificationItem[]>();
  for (const item of items) {
    const ts = new Date(item.createdAt).getTime();
    if (Number.isNaN(ts)) {
      const list = map.get('older') ?? [];
      list.push(item);
      map.set('older', list);
      continue;
    }
    if (ts >= todayStart) {
      const list = map.get('today') ?? [];
      list.push(item);
      map.set('today', list);
      continue;
    }
    if (ts >= yesterdayStart) {
      const list = map.get('yesterday') ?? [];
      list.push(item);
      map.set('yesterday', list);
      continue;
    }
    if (ts >= weekStart) {
      const list = map.get('thisWeek') ?? [];
      list.push(item);
      map.set('thisWeek', list);
      continue;
    }
    const list = map.get('older') ?? [];
    list.push(item);
    map.set('older', list);
  }

  const order: Array<{ key: string; label: string }> = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'thisWeek', label: 'This week' },
    { key: 'older', label: 'Earlier' },
  ];

  return order
    .map(({ key, label }) => ({ key, label, items: map.get(key) ?? [] }))
    .filter((bucket) => bucket.items.length > 0);
}

function NotificationRow({
  item,
  onMarkRead,
  onDelete,
  markPending,
  deletePending,
}: {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  markPending: boolean;
  deletePending: boolean;
}) {
  const confirm = useWebConfirm();
  const unread = isNotificationUnread(item);
  const href = item.href;
  const external = isExternalNotificationHref(href);
  const { Icon, className: iconClass } = resolveNotificationIcon(
    item.type,
    item.title,
    item.message
  );

  const content = (
    <>
      <span
        className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconClass)}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', unread && 'font-semibold text-foreground')}>
          {humanizeNotificationCopy(item.title)}
        </p>
        {item.message ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {humanizeNotificationCopy(item.message)}
          </p>
        ) : null}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
        {formatRelativeTime(item.createdAt)}
      </span>
      {unread ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-lg"
          disabled={markPending}
          aria-label="Mark as read"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkRead(item.id);
          }}
        >
          <Check className="h-4 w-4" aria-hidden />
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
          disabled={deletePending}
          aria-label="Delete notification"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (
              await confirm({
                title: 'Delete this notification?',
                destructive: true,
              })
            ) {
              onDelete(item.id);
            }
          }}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      )}
    </>
  );

  const rowClass = cn(
    'flex items-center gap-4 border-b border-border/60 px-5 py-4 transition-theme last:border-b-0',
    unread && 'bg-primary/[0.04]',
    href && 'hover:bg-muted/40'
  );

  if (href && external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={rowClass}
        onClick={() => {
          if (unread) onMarkRead(item.id);
        }}
      >
        {content}
      </a>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        className={rowClass}
        onClick={() => {
          if (unread) onMarkRead(item.id);
        }}
      >
        {content}
      </Link>
    );
  }

  return <div className={rowClass}>{content}</div>;
}

export function NotificationsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const confirm = useWebConfirm();
  const tab = parseNotificationTab(searchParams.get('tab'));
  const categoryTab = tab !== 'all' && tab !== 'unread' && tab !== 'settings' ? tab : null;
  const listParams = useMemo(
    () => ({
      page: 1,
      limit: categoryTab ? 100 : 50,
      ...(tab === 'unread' ? { unreadOnly: true } : {}),
    }),
    [tab, categoryTab]
  );

  const unreadCountQ = useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: () => apiServices.notifications.unreadCount(),
    enabled: tab !== 'settings',
  });

  const list = useQuery({
    queryKey: queryKeys.notifications.list(listParams),
    queryFn: () => apiServices.notifications.list(listParams),
    enabled: tab !== 'settings',
  });

  const allLoaded = useMemo(() => list.data?.items ?? [], [list.data?.items]);
  const displayItems = useMemo(() => {
    if (!categoryTab) return allLoaded;
    return allLoaded.filter((item) => notificationCategoryFromType(item.type) === categoryTab);
  }, [allLoaded, categoryTab]);
  const groupedDisplayItems = useMemo(() => groupNotifications(displayItems), [displayItems]);
  const apiUnreadCount = resolveNotificationUnreadCount(unreadCountQ.data);

  const invalidateNotifications = () => {
    void qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    void qc.invalidateQueries({ queryKey: queryKeys.notifications.unread });
  };

  const readAll = useMutation({
    mutationFn: () => apiServices.notifications.readAll(),
    onSuccess: () => {
      toast.success('Marked all read');
      invalidateNotifications();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const mark = useMutation({
    mutationFn: (id: string) => apiServices.notifications.markRead(id, true),
    onSuccess: invalidateNotifications,
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiServices.notifications.delete(id),
    onSuccess: () => {
      toast.success('Notification deleted');
      invalidateNotifications();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const clearRead = useMutation({
    mutationFn: () => apiServices.notifications.clearRead(),
    onSuccess: () => {
      toast.success('Cleared read notifications');
      invalidateNotifications();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  function setTab(next: NotificationTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'all') params.delete('tab');
    else params.set('tab', next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay updated on your projects and account."
        actions={
          tab !== 'settings' ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg font-semibold"
                disabled={readAll.isPending || apiUnreadCount === 0}
                onClick={() => readAll.mutate()}
              >
                Mark all read
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg font-semibold"
                disabled={clearRead.isPending || displayItems.length === 0}
                onClick={async () => {
                  if (
                    await confirm({
                      title: 'Clear read notifications?',
                      description: 'This permanently removes notifications you have already read.',
                      destructive: true,
                    })
                  ) {
                    clearRead.mutate();
                  }
                }}
              >
                Clear read
              </Button>
            </div>
          ) : null
        }
      />

      <NotificationsTabBar active={tab} onChange={setTab} unreadCount={apiUnreadCount} />

      {tab === 'settings' ? (
        <SettingsNotificationsClient embedded />
      ) : (
        <>
          {list.isError ? (
            <ErrorState
              title="Could not load notifications"
              message={getApiErrorMessage(list.error)}
              onRetry={() => void list.refetch()}
            />
          ) : null}
          {list.isPending ? (
            <WebPanel padding="md">
              <div role="status" aria-live="polite" aria-busy="true">
                <p className="mb-3 text-sm text-muted-foreground">Loading notifications…</p>
                <SkeletonText lines={6} />
              </div>
            </WebPanel>
          ) : null}

          {!list.isPending && !list.isError && displayItems.length === 0 ? (
            <EmptyState
              title={
                tab === 'unread'
                  ? 'No unread notifications'
                  : categoryTab
                    ? `No ${NOTIFICATION_TAB_LABELS[categoryTab].toLowerCase()} notifications`
                    : 'No notifications yet'
              }
              description={
                tab === 'unread'
                  ? "You're all caught up."
                  : categoryTab
                    ? 'Nothing in this category yet. Other updates still appear under All.'
                    : 'Quotes, messages, and project updates will show up here.'
              }
            />
          ) : null}

          {!list.isPending && !list.isError && displayItems.length > 0 ? (
            <div className="space-y-5">
              {categoryTab && allLoaded.length !== displayItems.length ? (
                <p className="px-1 text-xs text-muted-foreground">
                  Showing {displayItems.length} of {allLoaded.length} loaded notifications in this
                  category (list API type filter is info/success/warning/error, not product
                  category).
                </p>
              ) : null}
              {groupedDisplayItems.map((bucket) => (
                <section key={bucket.key} className="space-y-2">
                  <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {bucket.label}
                  </h2>
                  <WebPanel padding="none" className="overflow-hidden">
                    {bucket.items.map((n) => (
                      <NotificationRow
                        key={n.id}
                        item={n}
                        onMarkRead={(id) => mark.mutate(id)}
                        onDelete={(id) => remove.mutate(id)}
                        markPending={mark.isPending}
                        deletePending={remove.isPending}
                      />
                    ))}
                  </WebPanel>
                </section>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
