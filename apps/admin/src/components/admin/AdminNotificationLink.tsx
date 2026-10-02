'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check } from '@nestlancer/ui/icons';

import {
  applyAllNotificationsMarkedRead,
  applyNotificationMarkedRead,
  resolveNotificationUnreadCount,
} from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import { useAuth } from '@nestlancer/auth';
import type { NotificationItem } from '@nestlancer/types';
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nestlancer/ui';
import { resolveNotificationIcon } from '@nestlancer/ui/notifications';
import { formatRelativeTime } from '@nestlancer/utils';
import { isNotificationUnread } from '@nestlancer/utils/notifications';

import { openProjectExportDownload } from '@/features/exports/open-project-export-download';
import { apiServices } from '@/lib/axios';

const PREVIEW_LIMIT = 8;
const previewListKey = queryKeys.notifications.list({ preview: true, limit: PREVIEW_LIMIT });
const INBOX_HREF = '/notifications?tab=inbox';

function PreviewRow({
  item,
  onMarkRead,
}: {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
}) {
  const unread = isNotificationUnread(item);
  const href = item.href;
  const exportProjectId = (() => {
    if (item.type !== 'export.ready' || !item.data || typeof item.data !== 'object') return null;
    const data = item.data as Record<string, unknown>;
    if (data.exportType !== 'project' || !data.projectId) return null;
    return String(data.projectId);
  })();
  const { Icon, className: iconClass } = resolveNotificationIcon(
    item.type,
    item.title,
    item.message
  );

  const content = (
    <div className="flex w-full min-w-0 items-center gap-2.5">
      <span
        className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconClass)}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm', unread && 'font-semibold')}>{item.title}</p>
        {item.message ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.message}</p>
        ) : null}
      </div>
      <span className="shrink-0 text-[10px] text-muted-foreground">
        {formatRelativeTime(item.createdAt)}
      </span>
    </div>
  );

  if (exportProjectId) {
    return (
      <DropdownMenuItem
        className={cn('px-3 py-2.5', unread && 'bg-primary/[0.04]')}
        onClick={() => {
          void openProjectExportDownload(exportProjectId).then((ok) => {
            if (ok && unread) onMarkRead(item.id);
          });
        }}
      >
        {content}
      </DropdownMenuItem>
    );
  }

  if (href) {
    return (
      <DropdownMenuItem asChild className={cn('px-3 py-2.5', unread && 'bg-primary/[0.04]')}>
        <Link
          href={href}
          onClick={() => {
            if (unread) onMarkRead(item.id);
          }}
        >
          {content}
        </Link>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem
      className={cn('px-3 py-2.5', unread && 'bg-primary/[0.04]')}
      onClick={() => unread && onMarkRead(item.id)}
    >
      {content}
    </DropdownMenuItem>
  );
}

export function AdminNotificationLink({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const unreadQ = useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: () => apiServices.notifications.unreadCount(),
    enabled: isAuthenticated,
    staleTime: 0,
  });

  const previewQ = useQuery({
    queryKey: previewListKey,
    queryFn: () => apiServices.notifications.list({ limit: PREVIEW_LIMIT }),
    enabled: isAuthenticated,
    staleTime: 0,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiServices.notifications.markRead(id),
    onSuccess: () => applyNotificationMarkedRead(qc),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiServices.notifications.readAll(),
    onSuccess: () => applyAllNotificationsMarkedRead(qc),
  });

  const count = resolveNotificationUnreadCount(unreadQ.data);
  const label = count > 0 ? `${count} unread notifications` : 'Notifications';
  const items = previewQ.data?.items ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          onClick={() => {
            void Promise.all([unreadQ.refetch(), previewQ.refetch()]);
          }}
          className={cn(
            'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-theme hover:bg-muted hover:text-foreground data-[state=open]:bg-muted',
            className
          )}
        >
          <Bell className="h-4 w-4" aria-hidden />
          {count > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {count > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 rounded-lg px-2 text-xs"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <Check className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          ) : null}
        </div>

        <div className="max-h-80 overflow-y-auto py-1">
          {previewQ.isLoading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            items.map((item) => (
              <PreviewRow key={item.id} item={item} onMarkRead={(id) => markRead.mutate(id)} />
            ))
          )}
        </div>

        <div className="border-t border-border/60 p-2">
          <DropdownMenuItem asChild className="rounded-lg">
            <Link href={INBOX_HREF} className="justify-center font-medium">
              Open notification inbox
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
