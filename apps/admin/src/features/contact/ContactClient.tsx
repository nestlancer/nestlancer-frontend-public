'use client';

import { useEffect, useMemo, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  ErrorState,
  TextInput,
  MessagingSplitWorkspace,
  MessagingWorkspaceChrome,
  MessagingWorkspaceEmpty,
  Select,
  SelectItem,
  Skeleton,
  Textarea,
  cn,
  toast,
} from '@nestlancer/ui';
import {
  FileArchive,
  Inbox,
  MessageSquare,
  Search,
  Send,
  ShieldAlert,
  Trash2,
} from '@nestlancer/ui/icons';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { FormFieldLabel } from '@nestlancer/field-help';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { DebugApiSection } from '@/components/admin/AdminDataViews';
import { GeStatusBadge } from '@/components/admin/AdminGentelellaUI';
import { AdminMetricStrip } from '@/components/admin/AdminPageChrome';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRows, rowId } from '@/lib/admin-response';
import type { KpiItem } from '@/lib/admin-view-model';
import { formatDate } from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';

/** Matches backend ContactStatus enum (prisma + @nestlancer/common). */
const CONTACT_STATUSES = ['NEW', 'READ', 'RESPONDED', 'ARCHIVED', 'SPAM'] as const;
type ContactStatus = (typeof CONTACT_STATUSES)[number];

type ContactRow = Record<string, unknown>;

type StatusFilter = 'all' | ContactStatus;

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'NEW', label: 'New' },
  { id: 'READ', label: 'Read' },
  { id: 'RESPONDED', label: 'Responded' },
  { id: 'SPAM', label: 'Spam' },
  { id: 'ARCHIVED', label: 'Archived' },
];

function str(value: unknown, fallback = '—'): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function contactName(row: ContactRow): string {
  return str(row.name, 'Unknown');
}

function contactEmail(row: ContactRow): string {
  return str(row.email);
}

function contactSubject(row: ContactRow): string {
  const raw = str(row.subject, '');
  if (!raw) return 'General';
  return raw.replace(/_/g, ' ');
}

function contactMessage(row: ContactRow): string {
  return str(row.message, '');
}

function contactMessagePreview(row: ContactRow, max = 96): string {
  const message = contactMessage(row);
  if (!message) return 'No message body';
  if (message.length <= max) return message;
  return `${message.slice(0, max).trimEnd()}…`;
}

function contactStatus(row: ContactRow): ContactStatus {
  const s = str(row.status, 'NEW').toUpperCase();
  return (CONTACT_STATUSES as readonly string[]).includes(s) ? (s as ContactStatus) : 'NEW';
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

function relativeReceived(iso: unknown): string {
  const s = str(iso, '');
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return formatDate(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function ContactClient() {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [respondMessage, setRespondMessage] = useState('');
  const [statusDraft, setStatusDraft] = useState<string>('');

  const q = useQuery({
    queryKey: adminKeys.contact(),
    queryFn: () => apiServices.admin.listContactMessages(),
  });

  const rows = useMemo(() => pickAdminRows(q.data), [q.data]);

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: rows.length,
      NEW: 0,
      READ: 0,
      RESPONDED: 0,
      ARCHIVED: 0,
      SPAM: 0,
    };
    for (const row of rows) {
      const status = contactStatus(row);
      base[status] += 1;
    }
    return base;
  }, [rows]);

  const metrics = useMemo<KpiItem[]>(
    () => [
      { label: 'Inbox', value: String(counts.all), hint: 'Total inquiries' },
      { label: 'New', value: String(counts.NEW), hint: 'Needs triage' },
      {
        label: 'Open',
        value: String(counts.NEW + counts.READ),
        hint: 'New + read',
      },
      { label: 'Responded', value: String(counts.RESPONDED), hint: 'Replied' },
    ],
    [counts]
  );

  const filtered = useMemo(() => {
    const qText = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== 'all' && contactStatus(row) !== statusFilter) return false;
      if (!qText) return true;
      return [
        contactName(row),
        contactEmail(row),
        contactSubject(row),
        contactMessage(row),
        str(row.ticketId, ''),
      ]
        .join(' ')
        .toLowerCase()
        .includes(qText);
    });
  }, [rows, search, statusFilter]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return rows.find((row) => rowId(row) === selectedId) ?? null;
  }, [rows, selectedId]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((row) => rowId(row) === selectedId)) {
      setSelectedId(rowId(filtered[0]!) || null);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (!selected) {
      setStatusDraft('');
      setRespondMessage('');
      return;
    }
    setStatusDraft(contactStatus(selected));
    setRespondMessage('');
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps -- reset composer when selection changes

  const respondM = useMutation({
    mutationFn: ({ id, subject, message }: { id: string; subject: string; message: string }) =>
      apiServices.admin.respondToContact(id, { subject, message }),
    onSuccess: () => {
      toast.success('Response sent.');
      setRespondMessage('');
      void qc.invalidateQueries({ queryKey: adminKeys.contact() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not send response')),
  });

  const updateStatusM = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiServices.admin.updateContactStatus(id, { status }),
    onSuccess: () => {
      toast.success('Status updated.');
      void qc.invalidateQueries({ queryKey: adminKeys.contact() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update status')),
  });

  const spamM = useMutation({
    mutationFn: (id: string) => apiServices.admin.markContactSpam(id),
    onSuccess: () => {
      toast.success('Marked as spam.');
      void qc.invalidateQueries({ queryKey: adminKeys.contact() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not mark spam')),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => apiServices.admin.deleteContactMessage(id),
    onSuccess: () => {
      toast.success('Message deleted.');
      setSelectedId(null);
      void qc.invalidateQueries({ queryKey: adminKeys.contact() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not delete')),
  });

  const markReadM = useMutation({
    mutationFn: (id: string) => apiServices.admin.updateContactStatus(id, { status: 'READ' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.contact() });
    },
  });

  const selectInquiry = (row: ContactRow) => {
    const id = rowId(row);
    if (!id) return;
    setSelectedId(id);
    if (contactStatus(row) === 'NEW') {
      markReadM.mutate(id);
    }
  };

  const debugPayloads = { contactMessages: q.data } as Record<string, unknown>;

  return (
    <div className="space-y-5">
      <MessagingWorkspaceChrome
        title="Inquiries"
        description="Public-site contact inbox — triage, reply, and archive like a support desk."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void q.refetch()}
            disabled={q.isFetching}
          >
            {q.isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      >
        <div className="space-y-4 px-1 pb-2 pt-1">
          <AdminMetricStrip items={metrics} max={4} />

          {q.isLoading ? (
            <div className="grid gap-3 lg:grid-cols-[minmax(16rem,22rem)_1fr_minmax(14rem,17rem)]">
              <Skeleton className="h-[28rem] w-full rounded-xl" />
              <Skeleton className="h-[28rem] w-full rounded-xl" />
              <Skeleton className="hidden h-[28rem] w-full rounded-xl lg:block" />
            </div>
          ) : null}

          {!q.isLoading && q.error ? (
            <ErrorState
              message={getApiErrorMessage(q.error, 'Could not load contact messages')}
              onRetry={() => {
                void q.refetch();
              }}
            />
          ) : null}

          {!q.isLoading && !q.error ? (
            <MessagingSplitWorkspace
              className="min-h-[36rem] overflow-hidden rounded-xl border border-border bg-card shadow-[var(--ge-shadow-card)]"
              queue={
                <div className="flex h-full min-h-0 flex-col">
                  <div className="space-y-3 border-b border-border/80 p-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <TextInput
                        value={search}
                        onValueChange={setSearch}
                        placeholder="Search name, email, ticket…"
                        className="h-9 pl-8 text-sm"
                        aria-label="Search inquiries"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_FILTERS.map((f) => {
                        const active = statusFilter === f.id;
                        const count = counts[f.id];
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setStatusFilter(f.id)}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                              active
                                ? 'border-primary/40 bg-primary/10 text-primary'
                                : 'border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                            )}
                          >
                            {f.label}
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                                active ? 'bg-primary/15' : 'bg-muted'
                              )}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {filtered.length === 0 ? (
                      <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No inquiries match this view.
                      </div>
                    ) : (
                      <ul className="divide-y divide-border/60">
                        {filtered.map((row) => {
                          const id = rowId(row);
                          const active = id === selectedId;
                          const status = contactStatus(row);
                          const unread = status === 'NEW';
                          return (
                            <li key={id || str(row.ticketId)}>
                              <button
                                type="button"
                                onClick={() => selectInquiry(row)}
                                className={cn(
                                  'flex w-full gap-3 px-3 py-3 text-left transition-colors',
                                  active
                                    ? 'bg-primary/8 ring-1 ring-inset ring-primary/20'
                                    : 'hover:bg-muted/40'
                                )}
                              >
                                <div
                                  className={cn(
                                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                                    unread
                                      ? 'bg-primary/15 text-primary'
                                      : 'bg-muted text-muted-foreground'
                                  )}
                                  aria-hidden
                                >
                                  {initials(contactName(row))}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p
                                      className={cn(
                                        'truncate text-sm',
                                        unread
                                          ? 'font-semibold text-foreground'
                                          : 'font-medium text-foreground'
                                      )}
                                    >
                                      {contactName(row)}
                                    </p>
                                    <span className="shrink-0 text-[11px] text-muted-foreground">
                                      {relativeReceived(row.createdAt)}
                                    </span>
                                  </div>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {contactEmail(row)}
                                  </p>
                                  <p className="mt-1 truncate text-xs capitalize text-foreground/80">
                                    {contactSubject(row)}
                                  </p>
                                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                    {contactMessagePreview(row)}
                                  </p>
                                  <div className="mt-2">
                                    <GeStatusBadge status={status} />
                                  </div>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              }
              context={
                selected ? (
                  <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Properties
                      </p>
                      <div className="mt-3 space-y-3">
                        <div>
                          <label htmlFor="inquiry-status" className="text-xs text-muted-foreground">
                            Status
                          </label>
                          <div className="mt-1.5 flex items-center gap-2">
                            <Select
                              id="inquiry-status"
                              value={statusDraft}
                              onValueChange={setStatusDraft}
                              className="nl-select w-full"
                              aria-label="Status"
                            >
                              {CONTACT_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </Select>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 w-full"
                            disabled={
                              !statusDraft ||
                              statusDraft === contactStatus(selected) ||
                              updateStatusM.isPending
                            }
                            onClick={() => {
                              const id = rowId(selected);
                              if (!id || !statusDraft) return;
                              updateStatusM.mutate({ id, status: statusDraft });
                            }}
                          >
                            Update status
                          </Button>
                        </div>

                        <dl className="space-y-2 text-sm">
                          <div>
                            <dt className="text-xs text-muted-foreground">Ticket</dt>
                            <dd className="font-mono text-xs">{str(selected.ticketId)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Subject</dt>
                            <dd className="capitalize">{contactSubject(selected)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Received</dt>
                            <dd>{formatDate(selected.createdAt)}</dd>
                          </div>
                          {selected.referencePortfolioTitle ? (
                            <div>
                              <dt className="text-xs text-muted-foreground">Portfolio ref</dt>
                              <dd>{str(selected.referencePortfolioTitle)}</dd>
                            </div>
                          ) : null}
                        </dl>
                      </div>
                    </div>

                    <div className="mt-auto space-y-2 border-t border-border pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2"
                        disabled={spamM.isPending}
                        onClick={() => {
                          const id = rowId(selected);
                          if (id) spamM.mutate(id);
                        }}
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Mark spam
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2"
                        disabled={updateStatusM.isPending}
                        onClick={() => {
                          const id = rowId(selected);
                          if (id) updateStatusM.mutate({ id, status: 'ARCHIVED' });
                        }}
                      >
                        <FileArchive className="h-3.5 w-3.5" />
                        Archive
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full justify-start gap-2"
                        disabled={deleteM.isPending}
                        onClick={async () => {
                          const id = rowId(selected);
                          if (!id) return;
                          const { confirmed } = await confirm({
                            title: 'Delete inquiry',
                            description: 'This permanently removes the contact message.',
                            destructive: true,
                            confirmLabel: 'Delete',
                          });
                          if (!confirmed) return;
                          deleteM.mutate(id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                    Select an inquiry to manage properties.
                  </div>
                )
              }
            >
              {!selected ? (
                <MessagingWorkspaceEmpty
                  title="Select an inquiry"
                  description="Choose a message from the queue to read the full body and reply."
                  icon={<Inbox className="h-6 w-6" />}
                />
              ) : (
                <div className="flex h-full min-h-0 flex-col">
                  <header className="header-aurora flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold text-foreground">
                          {contactName(selected)}
                        </h2>
                        <GeStatusBadge status={contactStatus(selected)} />
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {contactEmail(selected)}
                      </p>
                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {contactSubject(selected)} · {str(selected.ticketId)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => {
                        const el = document.getElementById('inquiry-reply-composer');
                        el?.focus();
                      }}
                    >
                      <Send className="h-3.5 w-3.5" />
                      Reply
                    </Button>
                  </header>

                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                    <article className="rounded-xl border border-border bg-muted/25 p-4">
                      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Incoming message · {formatDate(selected.createdAt)}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {contactMessage(selected) || '—'}
                      </p>
                    </article>

                    <section className="composer-glass rounded-xl border border-border p-4">
                      <FormFieldLabel
                        htmlFor="inquiry-reply-composer"
                        fieldKey="contact.responseMessage"
                        label="Response message"
                      >
                        Reply to {contactName(selected)}
                      </FormFieldLabel>
                      <Textarea
                        id="inquiry-reply-composer"
                        value={respondMessage}
                        onChange={(e) => setRespondMessage(e.target.value)}
                        className="mt-2 min-h-[120px] w-full"
                        placeholder="Write a clear reply. This is emailed to the visitor…"
                      />
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Sends via contact respond API · reply-to visitor email
                        </p>
                        <Button
                          disabled={
                            !respondMessage.trim() || respondM.isPending || !rowId(selected)
                          }
                          onClick={() => {
                            const id = rowId(selected);
                            if (!id) return;
                            const subject = `Re: ${contactSubject(selected)}`.slice(0, 200);
                            respondM.mutate({ id, subject, message: respondMessage });
                          }}
                          className="gap-1.5"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {respondM.isPending ? 'Sending…' : 'Send reply'}
                        </Button>
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </MessagingSplitWorkspace>
          ) : null}
        </div>
      </MessagingWorkspaceChrome>

      <DebugApiSection payloads={debugPayloads} />
    </div>
  );
}
