'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Send, Trash2, User, Users, X } from '@nestlancer/ui/icons';
import { toast } from '@nestlancer/ui';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import type { NotificationItem } from '@nestlancer/types';
import {
  Button,
  DataTable,
  type DataTableColumn,
  EmptyState,
  Input,
  Textarea,
  cn,
} from '@nestlancer/ui';
import { resolveNotificationIcon } from '@nestlancer/ui/notifications';
import {
  isDownloadNotificationType,
  isExternalNotificationHref,
  isNotificationUnread,
  notificationCategoryFromType,
  NOTIFICATION_PREFERENCE_CATEGORIES,
  type NotificationPreferenceCategory,
} from '@nestlancer/utils/notifications';
import { formatRelativeTime } from '@nestlancer/utils';

import { openProjectExportDownload } from '@/features/exports/open-project-export-download';

import { FormFieldLabel } from '@nestlancer/field-help';
import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { UserSearchCombobox, type UserOption } from '@/components/admin/UserSearchCombobox';
import { GePageHeader as PageHeader } from '@/components/admin/AdminGentelellaUI';
import {
  AdminFilterBar,
  AdminMetricStrip,
  AdminTabBar,
  adminCardClass,
} from '@/components/admin/AdminPageChrome';
import { adminKeys } from '@/lib/admin-query-keys';
import {
  pickAdminPagination,
  pickAdminRecord,
  pickAdminRows,
  rowId,
  rowTitle,
} from '@/lib/admin-response';
import { cellPreview, extractMetricTiles, humanizeKey } from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

type TabKey = 'inbox' | 'send' | 'broadcast' | 'segment' | 'delivery' | 'log';
const TAB_KEYS: TabKey[] = ['inbox', 'send', 'broadcast', 'segment', 'delivery', 'log'];
const TAB_FROM_QUERY: Record<string, TabKey> = {
  inbox: 'inbox',
  send: 'send',
  broadcast: 'broadcast',
  segment: 'segment',
  delivery: 'delivery',
  log: 'log',
};
const TAB_LABELS = [
  'My notifications',
  'Send',
  'Broadcast',
  'Segment',
  'Delivery report',
  'Platform log',
];

type SegmentAudience = 'all' | 'clients' | 'admins';
type LogAudience = 'all' | 'admins' | 'clients';

const platformLogQueryKey = (opts: {
  page: number;
  audience: LogAudience;
  type: string;
  unreadOnly: boolean;
  sort: string;
  search: string;
}) => [...adminKeys.root, 'notifications', 'platform-log', opts] as const;

function invalidatePlatformNotifications(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'notifications', 'platform-log'] });
  void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'notifications', 'recent'] });
  void qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
  void qc.invalidateQueries({ queryKey: queryKeys.notifications.unread });
}

const SEGMENT_AUDIENCES: {
  value: SegmentAudience;
  label: string;
  description: string;
}[] = [
  {
    value: 'all',
    label: 'All active users',
    description:
      'Every active account on the platform (same pool as broadcast, but you can add role filters later).',
  },
  {
    value: 'clients',
    label: 'Clients only',
    description: 'Users with the USER role — clients, not staff.',
  },
  {
    value: 'admins',
    label: 'Admins only',
    description: 'Users with the ADMIN role — internal operators and staff.',
  },
];

function segmentCriteria(audience: SegmentAudience): { role?: string } {
  if (audience === 'clients') return { role: 'USER' };
  if (audience === 'admins') return { role: 'ADMIN' };
  return {};
}

function shortId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function notificationListLabel(row: Record<string, unknown>): string {
  const title = typeof row.title === 'string' && row.title.trim() ? row.title.trim() : 'Untitled';
  const createdAt = typeof row.createdAt === 'string' ? formatRelativeTime(row.createdAt) : '';
  const id = rowId(row);
  const data =
    row.data && typeof row.data === 'object' ? (row.data as Record<string, unknown>) : null;
  const scope = data?.broadcastId ? 'broadcast' : 'single user';
  const parts = [title, createdAt, scope, shortId(id)].filter(Boolean);
  return parts.join(' · ');
}

function PanelShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(adminCardClass, 'space-y-4')}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function AdminNotificationRow({
  item,
  onMarkRead,
  onDelete,
}: {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const unread = isNotificationUnread(item);
  const href = item.href;
  const external = isExternalNotificationHref(href);
  const [downloading, setDownloading] = useState(false);
  const { Icon, className: iconClass } = resolveNotificationIcon(
    item.type,
    item.title,
    item.message
  );

  const exportProjectId = (() => {
    if (item.type !== 'export.ready' || !item.data || typeof item.data !== 'object') return null;
    const data = item.data as Record<string, unknown>;
    if (data.exportType !== 'project' || !data.projectId) return null;
    return String(data.projectId);
  })();

  const openLabel = isDownloadNotificationType(item.type) || external ? 'Download' : 'Open';

  return (
    <div
      className={cn(
        'flex items-center gap-4 border-b border-border/60 px-4 py-3 last:border-b-0',
        unread && 'bg-primary/[0.04]'
      )}
    >
      <span
        className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconClass)}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', unread && 'font-semibold text-foreground')}>{item.title}</p>
        {item.message ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
        ) : null}
        {exportProjectId ? (
          <Button
            type="button"
            variant="link"
            className="mt-1 h-auto p-0 text-xs"
            disabled={downloading}
            onClick={() => {
              setDownloading(true);
              void openProjectExportDownload(exportProjectId).then((ok) => {
                setDownloading(false);
                if (ok && unread) onMarkRead(item.id);
              });
            }}
          >
            {downloading ? 'Preparing…' : 'Download'}
          </Button>
        ) : href ? (
          external ? (
            <Button variant="link" className="mt-1 h-auto p-0 text-xs" asChild>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => unread && onMarkRead(item.id)}
              >
                {openLabel}
              </a>
            </Button>
          ) : (
            <Button variant="link" className="mt-1 h-auto p-0 text-xs" asChild>
              <Link href={href} onClick={() => unread && onMarkRead(item.id)}>
                {openLabel}
              </Link>
            </Button>
          )
        ) : null}
      </div>
      <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
        {formatRelativeTime(item.createdAt)}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        {unread ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Mark as read"
            onClick={() => onMarkRead(item.id)}
          >
            <Check className="h-4 w-4" />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          aria-label="Delete notification"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SendPanel() {
  const qc = useQueryClient();
  const [recipient, setRecipient] = useState<UserOption | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const send = useMutation({
    mutationFn: () => {
      if (!recipient?.id) throw new Error('Select a recipient');
      return apiServices.admin.sendAdminNotification({
        recipientIds: [recipient.id],
        title: title.trim(),
        message: message.trim(),
        channels: ['IN_APP'],
      });
    },
    onSuccess: () => {
      toast.success(`Notification sent to ${recipient?.name ?? 'user'}`);
      invalidatePlatformNotifications(qc);
      setTitle('');
      setMessage('');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const canSend = Boolean(recipient?.id && title.trim() && message.trim());

  return (
    <PanelShell
      title="Send to user"
      description="Search by name or email — no need to copy internal user IDs."
    >
      <div className="grid max-w-xl gap-4">
        <div className="space-y-2">
          <FormFieldLabel fieldKey="admin.notifications.recipient" label="Recipient" required>
            Recipient
          </FormFieldLabel>
          <UserSearchCombobox
            mode="single"
            value={recipient?.id}
            displayName={recipient ? `${recipient.name} · ${recipient.email}` : undefined}
            placeholder="Search by name or email…"
            onChange={(_id, user) => setRecipient(user)}
          />
          <p className="text-xs text-muted-foreground">
            Start typing to search the user directory. Results show display name and email.
          </p>
        </div>

        {recipient ? (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{recipient.name}</p>
                <p className="truncate text-sm text-muted-foreground">{recipient.email}</p>
                <Button variant="link" className="mt-1 h-auto p-0 text-xs" asChild>
                  <Link href={`/users/${encodeURIComponent(recipient.id)}`}>View user profile</Link>
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-lg"
              aria-label="Clear recipient"
              onClick={() => setRecipient(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <div className="space-y-2">
          <FormFieldLabel
            fieldKey="admin.notifications.title"
            label="Title"
            required
            htmlFor="notif-title"
          >
            Title
          </FormFieldLabel>
          <Input
            id="notif-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Quote ready for review"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <FormFieldLabel
            fieldKey="admin.notifications.message"
            label="Message"
            required
            htmlFor="notif-message"
          >
            Message
          </FormFieldLabel>
          <Textarea
            id="notif-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Short message shown in the user's notification inbox."
            className="rounded-lg"
          />
        </div>
        <Button
          className="w-fit rounded-lg"
          disabled={!canSend || send.isPending}
          onClick={() => send.mutate()}
        >
          <Send className="mr-2 h-4 w-4" />
          {send.isPending ? 'Sending…' : 'Send notification'}
        </Button>
      </div>
    </PanelShell>
  );
}

function BroadcastPanel() {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const broadcast = useMutation({
    mutationFn: () =>
      apiServices.admin.broadcastNotification({
        title: title.trim(),
        message: message.trim(),
        channels: ['IN_APP'],
      }),
    onSuccess: () => {
      toast.success('Broadcast queued');
      invalidatePlatformNotifications(qc);
      setTitle('');
      setMessage('');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <PanelShell
      title="Broadcast to all users"
      description="Queue an in-app notification for every active user. Use sparingly for platform-wide announcements."
    >
      <div className="grid max-w-xl gap-4">
        <div className="space-y-2">
          <FormFieldLabel
            fieldKey="admin.notifications.broadcastTitle"
            label="Title"
            required
            htmlFor="broadcast-title"
          >
            Title
          </FormFieldLabel>
          <Input
            id="broadcast-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg"
            placeholder="e.g. Scheduled maintenance tonight"
          />
        </div>
        <div className="space-y-2">
          <FormFieldLabel
            fieldKey="admin.notifications.broadcastMessage"
            label="Message"
            required
            htmlFor="broadcast-message"
          >
            Message
          </FormFieldLabel>
          <Textarea
            id="broadcast-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="rounded-lg"
            placeholder="Short message shown in every user’s inbox."
          />
        </div>
        <Button
          className="w-fit rounded-lg"
          disabled={!title.trim() || !message.trim() || broadcast.isPending}
          onClick={() => broadcast.mutate()}
        >
          <Users className="mr-2 h-4 w-4" />
          {broadcast.isPending ? 'Broadcasting…' : 'Broadcast to all users'}
        </Button>
      </div>
    </PanelShell>
  );
}

function SegmentPanel() {
  const qc = useQueryClient();
  const [audience, setAudience] = useState<SegmentAudience>('clients');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const audienceMeta = SEGMENT_AUDIENCES.find((a) => a.value === audience) ?? SEGMENT_AUDIENCES[0]!;

  const segmentSend = useMutation({
    mutationFn: () =>
      apiServices.admin.sendSegmentNotification({
        criteria: segmentCriteria(audience),
        notificationPayload: {
          title: title.trim(),
          message: message.trim(),
          type: 'system.announcement',
        },
      }),
    onSuccess: (data) => {
      const record = pickAdminRecord(data);
      const count =
        typeof record?.segmentedUsersCount === 'number' ? record.segmentedUsersCount : null;
      toast.success(
        count != null
          ? `Segment notification queued for ${count} user${count === 1 ? '' : 's'}`
          : 'Segment notification queued'
      );
      invalidatePlatformNotifications(qc);
      setTitle('');
      setMessage('');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <PanelShell
      title="Send to segment"
      description="Target a filtered audience — not one person, not everyone. Pick who should receive this message."
    >
      <div className="grid max-w-xl gap-4">
        <div className="space-y-2">
          <FormFieldLabel
            fieldKey="admin.notifications.segment"
            label="Audience"
            required
            htmlFor="segment-audience"
          >
            Audience
          </FormFieldLabel>
          <select
            id="segment-audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value as SegmentAudience)}
            className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
          >
            {SEGMENT_AUDIENCES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{audienceMeta.description}</p>
        </div>
        <div className="space-y-2">
          <FormFieldLabel
            fieldKey="admin.notifications.segmentTitle"
            label="Title"
            required
            htmlFor="segment-title"
          >
            Title
          </FormFieldLabel>
          <Input
            id="segment-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg"
            placeholder="e.g. Quote ready for review"
          />
        </div>
        <div className="space-y-2">
          <FormFieldLabel
            fieldKey="admin.notifications.segmentMessage"
            label="Message"
            required
            htmlFor="segment-message"
          >
            Message
          </FormFieldLabel>
          <Textarea
            id="segment-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="rounded-lg"
            placeholder="Short message shown in the user's notification inbox."
          />
        </div>
        <Button
          className="w-fit rounded-lg"
          disabled={!title.trim() || !message.trim() || segmentSend.isPending}
          onClick={() => segmentSend.mutate()}
        >
          {segmentSend.isPending ? 'Sending…' : `Send to ${audienceMeta.label.toLowerCase()}`}
        </Button>
      </div>
    </PanelShell>
  );
}

function DeliveryReportPanel() {
  const [notificationId, setNotificationId] = useState('');
  const [manualId, setManualId] = useState('');

  const recentQ = useQuery({
    queryKey: [...adminKeys.root, 'notifications', 'recent'],
    queryFn: () => apiServices.admin.listAdminNotifications({ limit: 40, page: 1 }),
  });

  const recentRows = pickAdminRows(recentQ.data);
  const selectedRow = recentRows.find((row) => rowId(row) === notificationId.trim()) ?? null;

  const reportQ = useQuery({
    queryKey: [...adminKeys.root, 'notifications', 'delivery-report', notificationId],
    queryFn: () => apiServices.admin.getDeliveryReport({ notificationId: notificationId.trim() }),
    enabled: notificationId.trim().length > 0,
  });

  const rows = pickAdminRows(reportQ.data);
  const columns: DataTableColumn<Record<string, unknown>>[] =
    rows.length > 0
      ? Object.keys(rows[0] ?? {})
          .slice(0, 6)
          .map((key) => ({
            id: key,
            header: humanizeKey(key),
            cell: (row) => <span className="text-sm">{cellPreview(row[key])}</span>,
          }))
      : [];

  const applyManualId = () => {
    const next = manualId.trim();
    if (!next) return;
    setNotificationId(next);
  };

  return (
    <PanelShell
      title="Delivery report"
      description="Check per-channel delivery outcomes for a notification you already sent. Pick from recent platform notifications — each row has its own ID."
    >
      <div className="space-y-4">
        <div className="max-w-2xl space-y-2">
          <FormFieldLabel
            fieldKey="admin.notifications.notificationId"
            label="Recent notification"
            htmlFor="delivery-notification-picker"
          >
            Recent notification
          </FormFieldLabel>
          <AdminQueryState isLoading={recentQ.isLoading} error={recentQ.error}>
            <select
              id="delivery-notification-picker"
              value={notificationId}
              onChange={(e) => setNotificationId(e.target.value)}
              className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
            >
              <option value="">Choose a recent notification…</option>
              {recentRows.map((row) => {
                const id = rowId(row);
                if (!id) return null;
                return (
                  <option key={id} value={id}>
                    {notificationListLabel(row)}
                  </option>
                );
              })}
            </select>
          </AdminQueryState>
          <p className="text-xs text-muted-foreground">
            IDs are created automatically when you send, broadcast, or segment a notification.
            Broadcasts create one record per recipient — pick any row from that batch to inspect
            delivery.
          </p>
        </div>

        <details className="max-w-2xl rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            Advanced: paste notification ID manually
          </summary>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <Input
              id="delivery-notification-id"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="Full notification UUID"
              className="max-w-md rounded-lg font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={!manualId.trim()}
              onClick={applyManualId}
            >
              Load report
            </Button>
          </div>
        </details>

        {selectedRow ? (
          <div className="max-w-2xl rounded-lg border border-border/70 bg-muted/20 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">
              {typeof selectedRow.title === 'string' ? selectedRow.title : 'Untitled'}
            </p>
            <p className="mt-1 text-muted-foreground">
              {typeof selectedRow.message === 'string' ? selectedRow.message : '—'}
            </p>
            <p className="mt-2 font-mono text-xs text-muted-foreground">{rowId(selectedRow)}</p>
          </div>
        ) : null}

        {notificationId.trim() ? (
          <AdminQueryState isLoading={reportQ.isLoading} error={reportQ.error}>
            {rows.length === 0 ? (
              <EmptyState
                title="No delivery rows"
                description="No per-channel delivery logs exist for this notification yet. In-app delivery may still have succeeded without a log entry."
              />
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <DataTable
                  columns={columns}
                  rows={rows}
                  getRowId={(row) => String(row.id ?? JSON.stringify(row))}
                  emptyTitle="No rows"
                />
              </div>
            )}
          </AdminQueryState>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select a recent notification above to load delivery channel results.
          </p>
        )}
      </div>
    </PanelShell>
  );
}

const LOG_TYPES = [
  { value: 'all', label: 'All types' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
] as const;

function rowMatchesLogSearch(
  row: Record<string, unknown>,
  q: string,
  userById: Map<string, Record<string, unknown>>
): boolean {
  if (!q) return true;
  const recipientId = String(row.userId ?? '');
  const user = userById.get(recipientId);
  const hay = [
    cellPreview(row.title),
    cellPreview(row.message),
    cellPreview(row.type),
    recipientId,
    user ? rowTitle(user) : '',
    user && typeof user.email === 'string' ? user.email : '',
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function PlatformLogPanel() {
  const [page, setPage] = useState(1);
  const [audience, setAudience] = useState<LogAudience>('all');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [unreadFilter, setUnreadFilter] = useState<'all' | 'unread'>('all');
  const [sort, setSort] = useState('createdAt:desc');
  const search = useDebouncedValue(searchInput.trim().toLowerCase(), 300);
  const filteredMode = audience !== 'all' || Boolean(search);
  const pageLimit = filteredMode ? 100 : 25;

  const logQ = useQuery({
    queryKey: platformLogQueryKey({
      page,
      audience,
      type: typeFilter,
      unreadOnly: unreadFilter === 'unread',
      sort,
      search,
    }),
    queryFn: () =>
      apiServices.admin.listAdminNotifications({
        limit: pageLimit,
        page: filteredMode && audience !== 'all' ? 1 : page,
        sort,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        unreadOnly: unreadFilter === 'unread' ? true : undefined,
        // OpenAPI does not document `search`; backend may ignore it. Client filter still applies.
        search: search || undefined,
      }),
  });

  const usersQ = useQuery({
    queryKey: [...adminKeys.root, 'users', 'notification-recipient-lookup', audience],
    queryFn: () =>
      apiServices.admin.listUsers({
        limit: 200,
        page: 1,
        ...(audience === 'admins' ? { role: 'ADMIN' } : {}),
        ...(audience === 'clients' ? { role: 'USER' } : {}),
      }),
    staleTime: 5 * 60_000,
  });

  const userById = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    for (const row of pickAdminRows(usersQ.data)) {
      const id = rowId(row);
      if (id) map.set(id, row);
    }
    return map;
  }, [usersQ.data]);

  const recipientIds = useMemo(() => new Set(userById.keys()), [userById]);

  const allRows = pickAdminRows(logQ.data);
  const rows = useMemo(() => {
    return allRows.filter((row) => {
      if (audience !== 'all' && !recipientIds.has(String(row.userId ?? ''))) return false;
      return rowMatchesLogSearch(row, search, userById);
    });
  }, [allRows, audience, recipientIds, search, userById]);

  const pagination = audience !== 'all' ? null : pickAdminPagination(logQ.data);
  const clientFiltered = Boolean(search) && rows.length !== allRows.length;

  const columns: DataTableColumn<Record<string, unknown>>[] = [
    {
      id: 'title',
      header: 'Title',
      cell: (row) => <span className="font-medium text-foreground">{cellPreview(row.title)}</span>,
    },
    {
      id: 'message',
      header: 'Message',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{cellPreview(row.message)}</span>
      ),
    },
    {
      id: 'recipient',
      header: 'Recipient',
      cell: (row) => {
        const recipientId = String(row.userId ?? '');
        const user = userById.get(recipientId);
        const label = user
          ? `${rowTitle(user)} · ${String(user.role ?? 'USER')}`
          : shortId(recipientId);
        return recipientId ? (
          <Button variant="link" className="h-auto p-0 text-sm" asChild>
            <Link href={`/users/${encodeURIComponent(recipientId)}`}>{label}</Link>
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      },
    },
    {
      id: 'type',
      header: 'Type',
      cell: (row) => <span className="text-sm">{cellPreview(row.type)}</span>,
    },
    {
      id: 'createdAt',
      header: 'Sent',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {typeof row.createdAt === 'string' ? formatRelativeTime(row.createdAt) : '—'}
        </span>
      ),
    },
    {
      id: 'read',
      header: 'Read',
      cell: (row) => (
        <span className="text-sm">{row.read === true || row.readAt ? 'Yes' : 'No'}</span>
      ),
    },
  ];

  return (
    <PanelShell
      title="Platform log"
      description="Audit trail of every in-app notification delivered on the platform. Use this to verify segment sends (e.g. Admins only) — filter recipients below."
    >
      <div className="space-y-4">
        <AdminFilterBar
          search={searchInput}
          onSearchChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          searchPlaceholder="Search title, message, type, recipient…"
          filters={[
            {
              id: 'audience',
              label: 'Audience',
              value: audience,
              options: [
                { value: 'all', label: 'All recipients' },
                { value: 'admins', label: 'Admins only' },
                { value: 'clients', label: 'Clients only' },
              ],
              onChange: (value) => {
                setAudience(value as LogAudience);
                setPage(1);
              },
            },
            {
              id: 'type',
              label: 'Type',
              value: typeFilter,
              options: LOG_TYPES.map((t) => ({ value: t.value, label: t.label })),
              onChange: (value) => {
                setTypeFilter(value);
                setPage(1);
              },
            },
            {
              id: 'unread',
              label: 'Read state',
              value: unreadFilter,
              options: [
                { value: 'all', label: 'All' },
                { value: 'unread', label: 'Unread only' },
              ],
              onChange: (value) => {
                setUnreadFilter(value as 'all' | 'unread');
                setPage(1);
              },
            },
            {
              id: 'sort',
              label: 'Sort',
              value: sort,
              options: [
                { value: 'createdAt:desc', label: 'Newest first' },
                { value: 'createdAt:asc', label: 'Oldest first' },
              ],
              onChange: (value) => {
                setSort(value);
                setPage(1);
              },
            },
          ]}
        />
        <p className="text-sm text-muted-foreground">
          {search
            ? `Text search is applied on this page (API has no search param). Showing ${rows.length} of ${allRows.length} loaded rows.`
            : audience !== 'all'
              ? `Showing ${rows.length} recent notification${rows.length === 1 ? '' : 's'} for ${audience === 'admins' ? 'admin' : 'client'} accounts`
              : pagination
                ? `Page ${pagination.page} of ${pagination.totalPages} · ${pagination.total} total records`
                : `${rows.length} notification${rows.length === 1 ? '' : 's'}`}
        </p>

        <AdminQueryState
          isLoading={logQ.isLoading || usersQ.isLoading}
          error={logQ.error ?? usersQ.error}
        >
          {rows.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-6 w-6" />}
              title={
                search || typeFilter !== 'all' || unreadFilter === 'unread' || audience !== 'all'
                  ? 'No matching notifications on this page'
                  : 'No notifications in log'
              }
              description={
                search
                  ? pagination && pagination.totalPages > 1
                    ? 'The list API does not support a search string. Try the next page, raise the page size by keeping search on, or clear filters.'
                    : 'No loaded rows match this search. Try a different query or clear filters.'
                  : audience === 'admins'
                    ? 'No notifications sent to admin accounts yet. Send via Segment → Admins only, then refresh.'
                    : 'No platform notifications recorded yet.'
              }
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <DataTable
                columns={columns}
                rows={rows}
                getRowId={(row) => rowId(row) || JSON.stringify(row)}
                emptyTitle="No rows"
              />
            </div>
          )}
        </AdminQueryState>

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={page <= 1 || logQ.isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={page >= pagination.totalPages || logQ.isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
        {clientFiltered ? (
          <p className="text-xs text-muted-foreground">
            Server filters (type, unread, sort) are sent to the API. Recipient audience and text
            search run on the current page.
          </p>
        ) : null}
      </div>
    </PanelShell>
  );
}

function InboxPanel() {
  const qc = useQueryClient();
  type InboxScope = 'all' | 'unread' | NotificationPreferenceCategory;
  const [scope, setScope] = useState<InboxScope>('all');
  const categoryTab =
    scope !== 'all' && scope !== 'unread' ? (scope as NotificationPreferenceCategory) : null;

  const listParams = useMemo(
    () => ({
      page: 1,
      limit: categoryTab ? 100 : 50,
      ...(scope === 'unread' ? { unreadOnly: true } : {}),
    }),
    [scope, categoryTab]
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.notifications.list(listParams),
    queryFn: () => apiServices.notifications.list(listParams),
  });

  const invalidateNotifications = () => {
    void qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    void qc.invalidateQueries({ queryKey: queryKeys.notifications.unread });
  };

  const markRead = useMutation({
    mutationFn: (id: string) => apiServices.notifications.markRead(id),
    onSuccess: invalidateNotifications,
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiServices.notifications.readAll(),
    onSuccess: () => {
      invalidateNotifications();
      toast.success('All notifications marked as read');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiServices.notifications.delete(id),
    onSuccess: invalidateNotifications,
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const displayItems = useMemo(() => {
    const allLoaded = data?.items ?? [];
    if (!categoryTab) return allLoaded;
    return allLoaded.filter((item) => notificationCategoryFromType(item.type) === categoryTab);
  }, [data?.items, categoryTab]);
  const grouped = useMemo(() => groupInboxNotifications(displayItems), [displayItems]);

  const scopeTabs: Array<{ value: InboxScope; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    ...NOTIFICATION_PREFERENCE_CATEGORIES.map((c) => ({
      value: c as InboxScope,
      label: c.charAt(0).toUpperCase() + c.slice(1),
    })),
  ];

  return (
    <PanelShell
      title="My notifications"
      description="In-app notifications for your signed-in admin account — same categorical inbox as the client portal."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="ge-tab-bar min-w-0 flex-1 scrollbar-none"
            role="tablist"
            aria-label="Notification categories"
          >
            {scopeTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={scope === tab.value}
                className={cn('ge-tab-bar-item', scope === tab.value && 'active')}
                onClick={() => setScope(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {displayItems.some((n) => isNotificationUnread(n)) ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 rounded-lg"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </Button>
          ) : null}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading notifications…</p>
        ) : isError ? (
          <p className="text-sm text-destructive">
            {getApiErrorMessage(error)}{' '}
            <button type="button" className="underline" onClick={() => void refetch()}>
              Retry
            </button>
          </p>
        ) : displayItems.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title={
              scope === 'unread'
                ? 'No unread notifications'
                : categoryTab
                  ? `No ${categoryTab} notifications`
                  : 'No notifications yet'
            }
            description={
              scope === 'unread'
                ? 'You are caught up.'
                : categoryTab
                  ? 'Nothing in this category yet. Other updates still appear under All.'
                  : 'Segment and send-to-user messages appear here after they are delivered to your account.'
            }
          />
        ) : (
          <div className="space-y-5">
            {grouped.map((bucket) => (
              <section key={bucket.key} className="space-y-2">
                <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {bucket.label}
                </h3>
                <div className="overflow-hidden rounded-lg border border-border">
                  {bucket.items.map((item) => (
                    <AdminNotificationRow
                      key={item.id}
                      item={item}
                      onMarkRead={(id) => markRead.mutate(id)}
                      onDelete={(id) => remove.mutate(id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </PanelShell>
  );
}

function groupInboxNotifications(items: NotificationItem[]): Array<{
  key: string;
  label: string;
  items: NotificationItem[];
}> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();
  const yesterdayMs = todayMs - 24 * 60 * 60 * 1000;
  const weekMs = todayMs - 7 * 24 * 60 * 60 * 1000;

  const map = new Map<string, NotificationItem[]>();
  for (const item of items) {
    const ts = new Date(item.createdAt).getTime();
    let key = 'older';
    if (!Number.isNaN(ts)) {
      if (ts >= todayMs) key = 'today';
      else if (ts >= yesterdayMs) key = 'yesterday';
      else if (ts >= weekMs) key = 'thisWeek';
    }
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }

  return (
    [
      { key: 'today', label: 'Today' },
      { key: 'yesterday', label: 'Yesterday' },
      { key: 'thisWeek', label: 'This week' },
      { key: 'older', label: 'Earlier' },
    ] as const
  )
    .map(({ key, label }) => ({ key, label, items: map.get(key) ?? [] }))
    .filter((bucket) => bucket.items.length > 0);
}

export function AdminNotificationsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTab = TAB_FROM_QUERY[searchParams.get('tab') ?? ''];
  const [tabIndex, setTabIndex] = useState(() => {
    if (!queryTab) return 0;
    const idx = TAB_KEYS.indexOf(queryTab);
    return idx >= 0 ? idx : 0;
  });
  const tab = TAB_KEYS[tabIndex] ?? 'inbox';

  useEffect(() => {
    if (!queryTab) return;
    const idx = TAB_KEYS.indexOf(queryTab);
    if (idx >= 0 && idx !== tabIndex) setTabIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from URL only
  }, [queryTab]);

  const setTab = (index: number) => {
    setTabIndex(index);
    const next = TAB_KEYS[index] ?? 'inbox';
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'inbox') params.delete('tab');
    else params.set('tab', next);
    const qs = params.toString();
    router.replace(qs ? `/notifications?${qs}` : '/notifications', { scroll: false });
  };

  const statsQ = useQuery({
    queryKey: [...adminKeys.root, 'notifications', 'stats'],
    queryFn: () => apiServices.admin.getAdminNotificationStats(),
  });

  const statTiles = extractMetricTiles(statsQ.data, 'Notifications');

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="Operations"
        title="Notifications"
        description="Read your notifications, send platform messages, and audit the delivery log."
      />

      <AdminQueryState isLoading={statsQ.isLoading} error={statsQ.error}>
        {statTiles.length > 0 ? <AdminMetricStrip items={statTiles} max={4} /> : null}
      </AdminQueryState>

      <AdminTabBar
        tabs={TAB_LABELS.map((label) => ({ label }))}
        activeIndex={tabIndex}
        onChange={setTab}
      />

      {tab === 'inbox' ? <InboxPanel /> : null}
      {tab === 'send' ? <SendPanel /> : null}
      {tab === 'broadcast' ? <BroadcastPanel /> : null}
      {tab === 'segment' ? <SegmentPanel /> : null}
      {tab === 'delivery' ? <DeliveryReportPanel /> : null}
      {tab === 'log' ? <PlatformLogPanel /> : null}
    </div>
  );
}
