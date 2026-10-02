'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage, previewMessageContent } from '@nestlancer/api-client';
import { Button, ErrorState, Skeleton, cn } from '@nestlancer/ui';

import { GePageHeader as PageHeader } from '@/components/admin/AdminGentelellaUI';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { DebugApiSection, StatusPill } from '@/components/admin/AdminDataViews';
import {
  AdminDataShell,
  AdminFilterBar,
  AdminMetricStrip,
  adminCardClass,
} from '@/components/admin/AdminPageChrome';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRows, rowId, pickAdminPagination } from '@/lib/admin-response';
import { extractQueueCount, formatDate } from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';

type ModerationRow = Record<string, unknown>;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function personLabel(person: Record<string, unknown> | null | undefined): string {
  if (!person) return '—';
  const name = [person.firstName, person.lastName]
    .filter((x) => typeof x === 'string' && x.trim())
    .join(' ')
    .trim();
  if (name) return name;
  return typeof person.email === 'string' && person.email ? person.email : 'Unknown user';
}

function reactionsOf(row: ModerationRow): Record<string, unknown> {
  return asRecord(row.reactions) ?? {};
}

function reviewStatusOf(row: ModerationRow): 'escalated' | 'flagged' {
  if (String(row.reviewStatus ?? '').toLowerCase() === 'escalated') return 'escalated';
  if (reactionsOf(row).escalated === true) return 'escalated';
  return 'flagged';
}

function chatKindOf(row: ModerationRow): 'project' | 'group' | 'direct' {
  const kind = String(row.chatKind ?? '').toLowerCase();
  if (kind === 'project' || kind === 'group' || kind === 'direct') return kind;
  if (row.projectId) return 'project';
  const thread = asRecord(row.thread);
  if (String(thread?.type ?? '').toUpperCase() === 'GROUP') return 'group';
  return 'direct';
}

function chatKindLabel(kind: 'project' | 'group' | 'direct'): string {
  if (kind === 'project') return 'Project chat';
  if (kind === 'group') return 'Group chat';
  return 'Direct chat';
}

function messageTypeLabel(row: ModerationRow): string {
  const type = String(row.type ?? 'TEXT').toUpperCase();
  if (type === 'FILE') return 'File';
  if (type === 'SYSTEM') return 'System';
  if (type === 'NOTIFICATION') return 'Notification';
  return 'Text';
}

function messageBody(row: ModerationRow): string {
  const type = typeof row.type === 'string' ? row.type : undefined;
  if (type === 'FILE') {
    return previewMessageContent(
      {
        content: typeof row.content === 'string' ? row.content : null,
        type,
      },
      500
    );
  }
  const text = typeof row.content === 'string' ? row.content.trim() : '';
  return text || '—';
}

function contextTitle(row: ModerationRow): string {
  const project = asRecord(row.project);
  if (project && typeof project.title === 'string' && project.title.trim()) return project.title;
  const thread = asRecord(row.thread);
  if (thread && typeof thread.title === 'string' && thread.title.trim()) return thread.title;
  const kind = chatKindOf(row);
  if (kind === 'direct') return 'Direct conversation';
  if (kind === 'group') return 'Group conversation';
  return 'Project conversation';
}

function flaggedAtOf(row: ModerationRow): string | null {
  if (typeof row.flaggedAt === 'string' && row.flaggedAt) return row.flaggedAt;
  const at = reactionsOf(row).flaggedAt;
  return typeof at === 'string' && at ? at : null;
}

function searchableText(row: ModerationRow): string {
  const sender = asRecord(row.sender);
  const project = asRecord(row.project);
  const thread = asRecord(row.thread);
  const flaggedBy = asRecord(row.flaggedByUser);
  return [
    messageBody(row),
    personLabel(sender),
    sender?.email,
    project?.title,
    thread?.title,
    personLabel(flaggedBy),
    flaggedBy?.email,
    chatKindLabel(chatKindOf(row)),
    reviewStatusOf(row),
  ]
    .filter((x) => typeof x === 'string' && x)
    .join(' ')
    .toLowerCase();
}

export function ModerationClient() {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const [tab, setTab] = useState<'queue' | 'history'>('queue');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');
  const [historyAction, setHistoryAction] = useState('all');
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [restoreText, setRestoreText] = useState('');

  const invalidateModeration = () => {
    void qc.invalidateQueries({ queryKey: adminKeys.flaggedMessages() });
    void qc.invalidateQueries({ queryKey: adminKeys.moderationHistory() });
  };

  const q = useQuery({
    queryKey: adminKeys.flaggedMessages(),
    queryFn: () => apiServices.admin.getFlaggedMessages({ limit: 100 }),
  });

  const historyQ = useQuery({
    queryKey: [...adminKeys.moderationHistory(), historyAction],
    queryFn: () =>
      apiServices.admin.getModerationHistory({
        limit: 100,
        ...(historyAction !== 'all' ? { action: historyAction } : {}),
      }),
    enabled: tab === 'history',
  });

  const dismissM = useMutation({
    mutationFn: (id: string) => apiServices.admin.dismissFlaggedMessage(id),
    onSuccess: () => {
      toast.success('Dismissed.');
      invalidateModeration();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not dismiss')),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => apiServices.admin.deleteFlaggedMessage(id),
    onSuccess: () => {
      toast.success('Message removed from chat. Original kept in history.');
      invalidateModeration();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not delete')),
  });

  const escalateM = useMutation({
    mutationFn: (id: string) => apiServices.admin.escalateFlaggedMessage(id),
    onSuccess: () => {
      toast.success('Escalated — message is blurred in chat.');
      invalidateModeration();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not escalate')),
  });

  const restoreM = useMutation({
    mutationFn: ({ id, content }: { id: string; content?: string }) =>
      apiServices.admin.restoreFlaggedMessage(id, content ? { content } : {}),
    onSuccess: () => {
      toast.success('Message restored to chat.');
      setRestoreId(null);
      setRestoreText('');
      invalidateModeration();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not restore')),
  });

  const rows = useMemo(() => pickAdminRows(q.data), [q.data]);
  const historyRows = useMemo(() => pickAdminRows(historyQ.data), [historyQ.data]);
  const pagination = useMemo(() => pickAdminPagination(q.data), [q.data]);
  const historyPagination = useMemo(() => pickAdminPagination(historyQ.data), [historyQ.data]);
  const queueCount = useMemo(
    () => pagination?.total ?? extractQueueCount(q.data) ?? rows.length,
    [pagination, q.data, rows.length]
  );
  const escalatedCount = useMemo(
    () => rows.filter((row) => reviewStatusOf(row) === 'escalated').length,
    [rows]
  );
  const projectCount = useMemo(
    () => rows.filter((row) => chatKindOf(row) === 'project').length,
    [rows]
  );

  const filtered = useMemo(() => {
    const qText = search.trim().toLowerCase();
    return rows.filter((row) => {
      const status = reviewStatusOf(row);
      const kind = chatKindOf(row);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (kindFilter !== 'all' && kind !== kindFilter) return false;
      if (qText && !searchableText(row).includes(qText)) return false;
      return true;
    });
  }, [rows, search, statusFilter, kindFilter]);

  const busy = dismissM.isPending || deleteM.isPending || escalateM.isPending || restoreM.isPending;
  const debugPayloads = {
    flaggedMessages: q.data,
    moderationHistory: historyQ.data,
  } as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="Operations"
        title="Moderation"
        description="Review flagged chats, escalate or remove them, and restore from history when needed."
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={tab === 'queue' ? 'default' : 'outline'}
          onClick={() => setTab('queue')}
        >
          Active queue
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === 'history' ? 'default' : 'outline'}
          onClick={() => setTab('history')}
        >
          History
        </Button>
      </div>

      <div className="space-y-6">
        {tab === 'queue' ? (
          <>
            <AdminMetricStrip
              items={[
                {
                  label: 'Queue',
                  value: q.isLoading ? '…' : String(queueCount),
                  hint: queueCount === 0 ? 'Nothing flagged right now' : 'Awaiting operator review',
                },
                {
                  label: 'Escalated',
                  value: q.isLoading ? '…' : String(escalatedCount),
                  hint: 'Blurred in chat for senior review',
                },
                {
                  label: 'Project chats',
                  value: q.isLoading ? '…' : String(projectCount),
                  hint: 'From client delivery threads',
                },
              ]}
              max={3}
            />

            <AdminDataShell
              filter={
                <AdminFilterBar
                  search={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Search message, sender, project, chat…"
                  filters={[
                    {
                      id: 'status',
                      label: 'Review status',
                      value: statusFilter,
                      options: [
                        { value: 'all', label: 'All statuses' },
                        { value: 'flagged', label: 'Flagged' },
                        { value: 'escalated', label: 'Escalated' },
                      ],
                      onChange: setStatusFilter,
                    },
                    {
                      id: 'kind',
                      label: 'Chat type',
                      value: kindFilter,
                      options: [
                        { value: 'all', label: 'All chats' },
                        { value: 'project', label: 'Project' },
                        { value: 'direct', label: 'Direct' },
                        { value: 'group', label: 'Group' },
                      ],
                      onChange: setKindFilter,
                    },
                  ]}
                  actions={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('all');
                        setKindFilter('all');
                      }}
                    >
                      Clear
                    </Button>
                  }
                />
              }
              footer={
                <span>
                  Showing {filtered.length} of {pagination?.total ?? rows.length} flagged messages
                </span>
              }
            >
              {q.isLoading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-36 w-full rounded-lg" />
                  ))}
                </div>
              ) : null}
              {!q.isLoading && q.error ? (
                <ErrorState
                  message={getApiErrorMessage(q.error, 'Could not load flagged messages')}
                  onRetry={() => {
                    void q.refetch();
                  }}
                />
              ) : null}
              {!q.isLoading && !q.error && filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                  <p className="text-sm font-medium text-foreground">
                    No flagged messages in the queue
                  </p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Items appear here when a user or admin flags a message in project, direct, or
                    group chat.
                  </p>
                </div>
              ) : null}
              {!q.isLoading && !q.error && filtered.length > 0 ? (
                <div className="space-y-3 p-4">
                  {filtered.map((row) => {
                    const id = rowId(row);
                    const sender = asRecord(row.sender);
                    const project = asRecord(row.project);
                    const flaggedBy = asRecord(row.flaggedByUser);
                    const kind = chatKindOf(row);
                    const status = reviewStatusOf(row);
                    const threadId = typeof row.threadId === 'string' ? row.threadId : '';
                    const projectId =
                      typeof row.projectId === 'string'
                        ? row.projectId
                        : typeof project?.id === 'string'
                          ? project.id
                          : '';
                    const senderId =
                      typeof row.senderId === 'string'
                        ? row.senderId
                        : typeof sender?.id === 'string'
                          ? sender.id
                          : '';
                    const flaggedById = typeof flaggedBy?.id === 'string' ? flaggedBy.id : '';
                    const clientId = typeof project?.clientId === 'string' ? project.clientId : '';

                    return (
                      <article
                        key={id || searchableText(row)}
                        className={cn(adminCardClass, 'space-y-4 p-4 sm:p-5')}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill tone={status === 'escalated' ? 'bad' : 'warn'}>
                              {status === 'escalated' ? 'Escalated' : 'Flagged'}
                            </StatusPill>
                            <StatusPill tone="neutral">{chatKindLabel(kind)}</StatusPill>
                            <StatusPill tone="neutral">{messageTypeLabel(row)}</StatusPill>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Sent {formatDate(row.createdAt)}
                          </p>
                        </div>

                        <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-3">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                            {messageBody(row) || '—'}
                          </p>
                        </div>

                        <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Sender
                            </dt>
                            <dd className="mt-1">
                              {senderId ? (
                                <Link
                                  href={`/users/${encodeURIComponent(senderId)}`}
                                  className="font-medium text-foreground hover:text-primary"
                                >
                                  {personLabel(sender)}
                                </Link>
                              ) : (
                                <span className="font-medium">{personLabel(sender)}</span>
                              )}
                              {typeof sender?.email === 'string' && sender.email ? (
                                <p className="truncate text-xs text-muted-foreground">
                                  {sender.email}
                                </p>
                              ) : null}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Conversation
                            </dt>
                            <dd className="mt-1">
                              {projectId ? (
                                <Link
                                  href={`/projects/${encodeURIComponent(projectId)}`}
                                  className="font-medium text-foreground hover:text-primary"
                                >
                                  {contextTitle(row)}
                                </Link>
                              ) : (
                                <span className="font-medium">{contextTitle(row)}</span>
                              )}
                              <p className="text-xs text-muted-foreground">{chatKindLabel(kind)}</p>
                            </dd>
                          </div>

                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Flagged
                            </dt>
                            <dd className="mt-1">
                              <p className="font-medium">{formatDate(flaggedAtOf(row))}</p>
                              {flaggedBy ? (
                                <p className="truncate text-xs text-muted-foreground">
                                  by{' '}
                                  {flaggedById ? (
                                    <Link
                                      href={`/users/${encodeURIComponent(flaggedById)}`}
                                      className="hover:text-primary"
                                    >
                                      {personLabel(flaggedBy)}
                                    </Link>
                                  ) : (
                                    personLabel(flaggedBy)
                                  )}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">Reporter unknown</p>
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Related
                            </dt>
                            <dd className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                              {clientId ? (
                                <p>
                                  Client:{' '}
                                  <Link
                                    href={`/users/${encodeURIComponent(clientId)}`}
                                    className="text-foreground hover:text-primary"
                                  >
                                    Open profile
                                  </Link>
                                </p>
                              ) : null}
                              {id ? (
                                <p className="font-mono text-[10px]">ID {id.slice(0, 8)}…</p>
                              ) : null}
                            </dd>
                          </div>
                        </dl>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                          <div className="flex flex-wrap gap-1">
                            {threadId ? (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/messages/thread/${encodeURIComponent(threadId)}`}>
                                  Open chat
                                </Link>
                              </Button>
                            ) : null}
                            {projectId ? (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/messages/project/${encodeURIComponent(projectId)}`}>
                                  Open chat
                                </Link>
                              </Button>
                            ) : null}
                            {senderId ? (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/users/${encodeURIComponent(senderId)}`}>Sender</Link>
                              </Button>
                            ) : null}
                            {projectId ? (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/projects/${encodeURIComponent(projectId)}`}>
                                  Project
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!id || busy}
                              onClick={() => id && dismissM.mutate(id)}
                            >
                              Dismiss
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!id || busy || status === 'escalated'}
                              onClick={() => id && escalateM.mutate(id)}
                            >
                              {status === 'escalated' ? 'Escalated' : 'Escalate'}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={!id || busy}
                              onClick={async () => {
                                if (!id) return;
                                const { confirmed } = await confirm({
                                  title: 'Remove flagged message?',
                                  description:
                                    'Chat will show “This flagged message was removed by moderation.” Original text is kept in History so you can restore it later.',
                                  destructive: true,
                                  confirmLabel: 'Remove',
                                });
                                if (!confirmed) return;
                                deleteM.mutate(id);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </AdminDataShell>
          </>
        ) : (
          <AdminDataShell
            filter={
              <AdminFilterBar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search history content, actors, chats…"
                filters={[
                  {
                    id: 'action',
                    label: 'Action',
                    value: historyAction,
                    options: [
                      { value: 'all', label: 'All actions' },
                      { value: 'FLAGGED', label: 'Flagged' },
                      { value: 'ESCALATED', label: 'Escalated' },
                      { value: 'REMOVED', label: 'Removed' },
                      { value: 'DISMISSED', label: 'Dismissed' },
                      { value: 'RESTORED', label: 'Restored' },
                    ],
                    onChange: setHistoryAction,
                  },
                ]}
                actions={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      setHistoryAction('all');
                    }}
                  >
                    Clear
                  </Button>
                }
              />
            }
            footer={
              <span>
                {historyPagination?.total ?? historyRows.length} moderation history events
              </span>
            }
          >
            {historyQ.isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : null}
            {!historyQ.isLoading && historyQ.error ? (
              <ErrorState
                message={getApiErrorMessage(historyQ.error, 'Could not load moderation history')}
                onRetry={() => {
                  void historyQ.refetch();
                }}
              />
            ) : null}
            {!historyQ.isLoading && !historyQ.error ? (
              <div className="space-y-3 p-4">
                {historyRows
                  .filter((row) => {
                    const qText = search.trim().toLowerCase();
                    if (!qText) return true;
                    const message = asRecord(row.message);
                    const actor = asRecord(row.actor);
                    const hay = [
                      row.action,
                      row.originalContent,
                      row.restoredContent,
                      row.note,
                      personLabel(actor),
                      messageBody(message ?? {}),
                      contextTitle(message ?? {}),
                    ]
                      .filter((x) => typeof x === 'string')
                      .join(' ')
                      .toLowerCase();
                    return hay.includes(qText);
                  })
                  .map((row) => {
                    const eventId = rowId(row);
                    const message = asRecord(row.message);
                    const messageId =
                      typeof row.messageId === 'string'
                        ? row.messageId
                        : message
                          ? rowId(message)
                          : '';
                    const actor = asRecord(row.actor);
                    const action = String(row.action ?? '—');
                    const canRestore = row.canRestore === true;
                    const original =
                      typeof row.originalContent === 'string' && row.originalContent
                        ? row.originalContent
                        : typeof row.restoredContent === 'string'
                          ? row.restoredContent
                          : '—';
                    const isEditing = restoreId === messageId;

                    return (
                      <article
                        key={eventId || `${messageId}-${action}-${String(row.createdAt)}`}
                        className={cn(adminCardClass, 'space-y-3 p-4 sm:p-5')}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill
                            tone={
                              action === 'REMOVED'
                                ? 'bad'
                                : action === 'ESCALATED'
                                  ? 'warn'
                                  : action === 'RESTORED'
                                    ? 'good'
                                    : 'neutral'
                            }
                          >
                            {action}
                          </StatusPill>
                          <StatusPill tone="neutral">
                            {chatKindLabel(chatKindOf(message ?? row))}
                          </StatusPill>
                          <StatusPill tone="neutral">
                            Now: {String(row.currentStatus ?? '—')}
                          </StatusPill>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(row.createdAt)}
                          </span>
                        </div>

                        <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Original / snapshot
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                            {original}
                          </p>
                        </div>

                        <dl className="grid gap-3 text-sm sm:grid-cols-3">
                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Actor
                            </dt>
                            <dd className="mt-1 font-medium">{personLabel(actor)}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Conversation
                            </dt>
                            <dd className="mt-1 font-medium">{contextTitle(message ?? {})}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Sender
                            </dt>
                            <dd className="mt-1 font-medium">
                              {personLabel(asRecord(message?.sender))}
                            </dd>
                          </div>
                        </dl>

                        {isEditing ? (
                          <div className="space-y-2 rounded-md border border-border p-3">
                            <p className="text-xs font-medium text-muted-foreground">
                              Edit text before restore (optional)
                            </p>
                            <textarea
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                              rows={4}
                              value={restoreText}
                              onChange={(e) => setRestoreText(e.target.value)}
                              placeholder="Edited message text (optional)"
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                disabled={restoreM.isPending || !messageId}
                                onClick={() =>
                                  messageId &&
                                  restoreM.mutate({
                                    id: messageId,
                                    content: restoreText.trim() || undefined,
                                  })
                                }
                              >
                                Restore to chat
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRestoreId(null);
                                  setRestoreText('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1 border-t border-border/60 pt-3">
                            {messageId && (asRecord(message)?.threadId || message?.threadId) ? (
                              <Button variant="ghost" size="sm" asChild>
                                <Link
                                  href={`/messages/thread/${encodeURIComponent(String(message?.threadId ?? asRecord(message)?.threadId))}`}
                                >
                                  Open chat
                                </Link>
                              </Button>
                            ) : null}
                            {messageId && (message?.projectId || asRecord(message)?.projectId) ? (
                              <Button variant="ghost" size="sm" asChild>
                                <Link
                                  href={`/messages/project/${encodeURIComponent(String(message?.projectId ?? asRecord(message)?.projectId))}`}
                                >
                                  Open chat
                                </Link>
                              </Button>
                            ) : null}
                            {canRestore && messageId ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRestoreId(messageId);
                                  setRestoreText(
                                    typeof row.originalContent === 'string'
                                      ? row.originalContent
                                      : ''
                                  );
                                }}
                              >
                                Restore / edit & restore
                              </Button>
                            ) : null}
                          </div>
                        )}
                      </article>
                    );
                  })}
                {historyRows.length === 0 ? (
                  <div className="px-6 py-16 text-center text-sm text-muted-foreground">
                    No moderation history yet.
                  </div>
                ) : null}
              </div>
            ) : null}
          </AdminDataShell>
        )}

        <DebugApiSection payloads={debugPayloads} />
      </div>
    </div>
  );
}
