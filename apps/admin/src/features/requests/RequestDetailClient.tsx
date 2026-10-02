'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';
import { FileStack, Pencil } from '@nestlancer/ui/icons';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { DEFAULT_CURRENCY, formatRequestCategory } from '@nestlancer/constants';
import { formatIsoDate, formatMoneyFromPaise, openSafeHttpUrl } from '@nestlancer/utils';
import { FieldHelp, FormFieldLabel } from '@nestlancer/field-help';
import { Button, Input, StatusBadge } from '@nestlancer/ui';
import { Select, SelectItem } from '@nestlancer/ui';

import {
  GeCard,
  GeCardHeader,
  GePageHeader as PageHeader,
} from '@/components/admin/AdminGentelellaUI';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { AdminQueryState, AdminSection } from '@/components/admin/AdminConsolePrimitives';
import { UserSearchCombobox } from '@/components/admin/UserSearchCombobox';
import {
  canAdminSendQuote,
  isChangesRequestedStatus,
  isQuoteEditable,
} from '@/features/quotes/admin-quote-utils';
import { adminKeys } from '@/lib/admin-query-keys';
import { canAdminCreateQuoteForRequest, normalizeAdminStatusKey } from '@/lib/admin-queue-filters';
import { formatAdminStatus, pickAdminRecord } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

const REQUEST_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'underReview', label: 'Under review' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'convertedToProject', label: 'Converted to project' },
  { value: 'changesRequested', label: 'Changes requested' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expiredQuote', label: 'Expired quote' },
];

function clientLabel(user: Record<string, unknown> | undefined): string {
  if (!user) return '—';
  const name = [user.firstName, user.lastName].filter((x) => typeof x === 'string' && x).join(' ');
  const email = typeof user.email === 'string' ? user.email : '';
  if (name && email) return `${name} (${email})`;
  return name || email || '—';
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1.5 text-sm text-foreground">{children}</div>
    </div>
  );
}

export function RequestDetailClient({ requestId }: { requestId: string }) {
  const qc = useQueryClient();
  const router = useRouter();
  const { confirm } = useAdminConfirm();

  const [newStatus, setNewStatus] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [assigneeDisplay, setAssigneeDisplay] = useState<string | undefined>(undefined);
  const [showEditMode, setShowEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const q = useQuery({
    queryKey: adminKeys.request(requestId),
    queryFn: () => apiServices.admin.getAdminRequest(requestId),
  });

  const notesQ = useQuery({
    queryKey: [...adminKeys.request(requestId), 'notes'],
    queryFn: () => apiServices.admin.listAdminRequestNotes(requestId),
  });

  const record = pickAdminRecord(q.data) ?? {};
  const user = record.user as Record<string, unknown> | undefined;
  const budget = (record.budget as Record<string, unknown> | undefined) ?? {};
  const timeline = (record.timeline as Record<string, unknown> | undefined) ?? {};
  const requirements = Array.isArray(record.requirements)
    ? (record.requirements as string[]).filter(Boolean)
    : [];
  const attachments = Array.isArray(record.attachments)
    ? (record.attachments as Record<string, unknown>[])
    : [];
  const statusHistory = Array.isArray(record.statusHistory)
    ? (record.statusHistory as Record<string, unknown>[])
    : [];
  const adminNotes = (() => {
    const notesData = notesQ.data as unknown;
    if (Array.isArray(notesData)) return notesData as Record<string, unknown>[];
    const inner = (notesData as Record<string, unknown> | undefined)?.data;
    if (Array.isArray(inner)) return inner as Record<string, unknown>[];
    return Array.isArray(record.adminNotes) ? (record.adminNotes as Record<string, unknown>[]) : [];
  })();

  const quotesArr = Array.isArray(record.quotes) ? record.quotes : [];
  const quote = (quotesArr[0] as Record<string, unknown> | undefined) ?? null;
  const quoteId = quote && typeof quote.id === 'string' ? quote.id : null;
  const quoteStatus = quote ? String(quote.status ?? '') : '';
  const budgetCurrency = typeof budget.currency === 'string' ? budget.currency : DEFAULT_CURRENCY;

  const sendQuoteInFlight = useRef(false);
  const sendQuoteM = useMutation({
    mutationFn: () => apiServices.admin.sendAdminQuote(quoteId!),
    onSuccess: () => {
      toast.success('Quote sent to client.');
      void qc.invalidateQueries({ queryKey: adminKeys.request(requestId) });
      void qc.invalidateQueries({ queryKey: adminKeys.quotes() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not send quote')),
    onSettled: () => {
      sendQuoteInFlight.current = false;
    },
  });

  function sendQuoteOnce() {
    // NL-BUG-QUOTE-3: guard the click race before React re-renders isPending.
    if (!quoteId || sendQuoteInFlight.current || sendQuoteM.isPending) return;
    sendQuoteInFlight.current = true;
    sendQuoteM.mutate();
  }

  const changeStatusM = useMutation({
    mutationFn: (status: string) =>
      apiServices.admin.updateAdminRequestStatus(requestId, { status }),
    onSuccess: () => {
      toast.success('Status updated.');
      setNewStatus('');
      void qc.invalidateQueries({ queryKey: adminKeys.request(requestId) });
      void qc.invalidateQueries({ queryKey: adminKeys.requests() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update status')),
  });

  const addNoteM = useMutation({
    mutationFn: () => apiServices.admin.addAdminRequestNote(requestId, { content: noteContent }),
    onSuccess: () => {
      toast.success('Note added.');
      setNoteContent('');
      void qc.invalidateQueries({ queryKey: [...adminKeys.request(requestId), 'notes'] });
      void qc.invalidateQueries({ queryKey: adminKeys.request(requestId) });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not add note')),
  });

  const assignM = useMutation({
    mutationFn: () => apiServices.admin.assignAdminRequest(requestId, { assigneeId }),
    onSuccess: () => {
      toast.success('Request assigned.');
      setAssigneeId('');
      void qc.invalidateQueries({ queryKey: adminKeys.request(requestId) });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not assign request')),
  });

  const deleteM = useMutation({
    mutationFn: () => apiServices.admin.deleteAdminRequest(requestId),
    onSuccess: () => {
      toast.success('Request deleted.');
      router.push('/requests');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not delete request')),
  });

  const patchM = useMutation({
    mutationFn: () =>
      apiServices.admin.patchAdminRequest(requestId, {
        title: editTitle || undefined,
        description: editDescription || undefined,
      }),
    onSuccess: () => {
      toast.success('Request updated.');
      setShowEditMode(false);
      void qc.invalidateQueries({ queryKey: adminKeys.request(requestId) });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update request')),
  });

  const downloadAttachmentM = useMutation({
    mutationFn: (attachmentId: string) =>
      apiServices.requests.getAdminAttachmentDownloadUrl(requestId, attachmentId),
    onSuccess: (url) => {
      if (url) openSafeHttpUrl(url);
      else toast.error('Download URL not available');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Download failed')),
  });

  const statusNorm = normalizeAdminStatusKey(record.status);
  const isClientDraft = statusNorm === 'draft';
  const quoteEditable = quoteId ? isQuoteEditable(quoteStatus) : false;
  const canCreateQuote = !quoteId && canAdminCreateQuoteForRequest(record.status);
  const quoteBuilderMode = canCreateQuote;
  const quoteEditMode = Boolean(quoteId && quoteEditable);
  const showQuoteRail = Boolean(quoteId && !quoteEditable);
  const canSendQuote = quoteId && canAdminSendQuote(quoteStatus);

  const tech = record.technicalRequirements as Record<string, unknown> | null | undefined;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/requests" className="font-medium text-primary hover:underline">
          ← Back to requests
        </Link>
      </nav>

      <PageHeader
        pretitle="Operations"
        title={String(record.title ?? 'Request')}
        description={
          quoteEditMode
            ? 'Review the client brief here. Use the full-screen quote editor for phases, line items, and pricing.'
            : quoteBuilderMode
              ? 'Review the client brief, then open the full-screen quote builder to scope phases and pricing.'
              : 'Review the full client brief before creating and sending a platform quote.'
        }
        actions={
          <div className="flex items-center gap-2">
            {quoteEditMode ? (
              <Button className="rounded-lg font-semibold" asChild>
                <Link href={`/requests/${encodeURIComponent(requestId)}/quote/edit`}>
                  <Pencil className="mr-1.5 h-4 w-4" aria-hidden />
                  Open quote editor
                </Link>
              </Button>
            ) : null}
            {quoteBuilderMode ? (
              <Button className="rounded-lg font-semibold" asChild>
                <Link href={`/requests/${encodeURIComponent(requestId)}/quote/new`}>
                  <FileStack className="mr-1.5 h-4 w-4" aria-hidden />
                  Open quote builder
                </Link>
              </Button>
            ) : null}
            <StatusBadge variant={statusNorm === 'submitted' ? 'warning' : 'neutral'}>
              {formatAdminStatus(record.status ?? '—')}
            </StatusBadge>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                setEditTitle(String(record.title ?? ''));
                setEditDescription(String(record.description ?? ''));
                setShowEditMode((v) => !v);
              }}
            >
              {showEditMode ? 'Cancel edit' : 'Edit'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-lg"
              disabled={deleteM.isPending}
              onClick={async () => {
                const { confirmed } = await confirm({
                  title: 'Delete request',
                  description: 'Permanently delete this request? This cannot be undone.',
                  destructive: true,
                  confirmLabel: 'Delete',
                });
                if (!confirmed) return;
                deleteM.mutate();
              }}
            >
              Delete
            </Button>
          </div>
        }
      />

      <AdminQueryState isLoading={q.isLoading} error={q.error}>
        {isClientDraft ? (
          <div className="mb-6 rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <strong className="text-foreground">Client draft — not submitted yet.</strong> The
            client is still editing this request. You cannot create a quote until they submit it for
            review.
          </div>
        ) : null}
        {isChangesRequestedStatus(statusNorm) || isChangesRequestedStatus(quoteStatus) ? (
          <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
            <strong>Client requested quote changes.</strong>{' '}
            {quoteEditMode ? (
              <>
                Open the full quote editor to revise line items and resend — the narrow sidebar is
                not suitable for multi-phase quotes.
              </>
            ) : (
              <>Use the quote editor to update line items and terms, then resend.</>
            )}
            {quoteEditMode ? (
              <div className="mt-3">
                <Button size="sm" className="rounded-lg font-semibold" asChild>
                  <Link href={`/requests/${encodeURIComponent(requestId)}/quote/edit`}>
                    <Pencil className="mr-2 h-4 w-4" aria-hidden />
                    Open quote editor
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {showEditMode ? (
          <AdminSection title="Edit request">
            <div className="space-y-3">
              <div>
                <FormFieldLabel fieldKey="requests.title" label="Title">
                  Title
                </FormFieldLabel>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="rounded-lg"
                  placeholder="e.g. Redesign marketing site"
                />
              </div>
              <div>
                <FormFieldLabel fieldKey="requests.description" label="Description">
                  Description
                </FormFieldLabel>
                <textarea
                  value={editDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditDescription(e.target.value)
                  }
                  className="min-h-[120px] w-full rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Goals, constraints, and what success looks like…"
                />
              </div>
              <Button
                disabled={patchM.isPending}
                className="rounded-lg"
                onClick={() => patchM.mutate()}
              >
                {patchM.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </AdminSection>
        ) : null}

        {quoteBuilderMode ? (
          <div className="mb-6 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-xl">
                <h3 className="text-lg font-semibold text-foreground">Ready to quote</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use the full-screen quote builder to split the project into phases, drag to
                  reorder, duplicate phases, and set pricing — with the client brief always visible.
                </p>
              </div>
              <Button size="lg" className="shrink-0 rounded-lg font-semibold" asChild>
                <Link href={`/requests/${encodeURIComponent(requestId)}/quote/new`}>
                  <FileStack className="mr-2 h-4 w-4" aria-hidden />
                  Open quote builder
                </Link>
              </Button>
            </div>
          </div>
        ) : null}

        {quoteEditMode ? (
          <div className="mb-6 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-xl">
                <h3 className="text-lg font-semibold text-foreground">
                  Quote needs your attention
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Edit phases, line items, payment schedule, and terms in the full-screen quote
                  editor. The request details stay on this page for reference.
                </p>
                {quote && typeof quote.totalAmount === 'number' ? (
                  <p className="mt-2 text-sm font-semibold tabular-nums text-foreground">
                    Current total: {formatMoneyFromPaise(Number(quote.totalAmount), budgetCurrency)}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="lg" className="shrink-0 rounded-lg font-semibold" asChild>
                  <Link href={`/requests/${encodeURIComponent(requestId)}/quote/edit`}>
                    <Pencil className="mr-2 h-4 w-4" aria-hidden />
                    Open quote editor
                  </Link>
                </Button>
                {canSendQuote ? (
                  <Button
                    size="lg"
                    variant="outline"
                    className="shrink-0 rounded-lg"
                    disabled={sendQuoteM.isPending}
                    onClick={sendQuoteOnce}
                  >
                    {sendQuoteM.isPending ? 'Sending…' : 'Send without opening editor'}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {!quoteId && !quoteBuilderMode ? (
          <p className="mb-6 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            {isClientDraft
              ? 'Waiting for the client to submit this request before you can create a quote.'
              : 'This request cannot receive a new quote in its current status.'}
          </p>
        ) : null}

        <div className={showQuoteRail ? 'grid gap-8 xl:grid-cols-3' : 'space-y-6'}>
          <div className={showQuoteRail ? 'space-y-6 xl:col-span-2' : 'space-y-6'}>
            <GeCard flush>
              <GeCardHeader title="Actions" subtitle="Status, assignment, and operator workflow" />
              <div className="ge-card-body space-y-6 border-t border-border">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                      <FieldHelp fieldKey="requests.status" label="Status" />
                    </span>
                    <div className="flex items-center gap-2">
                      <Select
                        value={newStatus}
                        onValueChange={setNewStatus}
                        placeholder="Change status…"
                        className="w-full max-w-xs"
                      >
                        {REQUEST_STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </Select>
                      <Button
                        size="sm"
                        className="rounded-lg"
                        disabled={!newStatus || changeStatusM.isPending}
                        onClick={() => newStatus && changeStatusM.mutate(newStatus)}
                      >
                        {changeStatusM.isPending ? 'Updating…' : 'Update'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <FormFieldLabel fieldKey="requests.assigneeId" label="Assignee user ID">
                      Assignee
                    </FormFieldLabel>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        <UserSearchCombobox
                          mode="single"
                          value={assigneeId}
                          displayName={assigneeDisplay}
                          placeholder="Select assignee…"
                          roleFilter="ADMIN"
                          onChange={(id, user) => {
                            setAssigneeId(id);
                            setAssigneeDisplay(user.name);
                          }}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        disabled={!assigneeId.trim() || assignM.isPending}
                        onClick={() => assignM.mutate()}
                      >
                        {assignM.isPending ? 'Assigning…' : 'Assign'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </GeCard>

            <AdminSection title="Client">
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailBlock label="Contact">{clientLabel(user)}</DetailBlock>
                <DetailBlock label="Category">
                  {formatRequestCategory(String(record.category ?? record.serviceCategory ?? ''))}
                </DetailBlock>
                {record.createdAt ? (
                  <DetailBlock label="Created">
                    {formatIsoDate(String(record.createdAt), 'PPp')}
                  </DetailBlock>
                ) : null}
                {record.updatedAt ? (
                  <DetailBlock label="Last updated">
                    {formatIsoDate(String(record.updatedAt), 'PPp')}
                  </DetailBlock>
                ) : null}
              </dl>
            </AdminSection>

            <AdminSection title="Project brief">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {String(record.description ?? '—')}
              </p>
              <dl className="mt-6 grid gap-4 border-t border-border/50 pt-6 sm:grid-cols-2">
                <DetailBlock label="Budget">
                  {typeof budget.min === 'number' && typeof budget.max === 'number'
                    ? `${formatMoneyFromPaise(Number(budget.min), budgetCurrency)} – ${formatMoneyFromPaise(Number(budget.max), budgetCurrency)}`
                    : '—'}
                </DetailBlock>
                <DetailBlock label="Preferred start">
                  {timeline.preferredStartDate
                    ? formatIsoDate(String(timeline.preferredStartDate), 'PP')
                    : '—'}
                </DetailBlock>
                <DetailBlock label="Deadline">
                  {timeline.deadline ? formatIsoDate(String(timeline.deadline), 'PP') : '—'}
                </DetailBlock>
              </dl>
            </AdminSection>

            <AdminSection title="Requirements">
              {requirements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No requirements listed.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {requirements.map((r) => (
                    <li
                      key={r}
                      className="rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-sm"
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </AdminSection>

            {tech && typeof tech === 'object' && Object.keys(tech).length > 0 ? (
              <AdminSection title="Technical preferences">
                <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {Object.entries(tech as Record<string, unknown>).map(([key, val]) => (
                    <div
                      key={key}
                      className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                    >
                      <dt className="text-xs font-medium text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                      </dt>
                      <dd className="mt-0.5 break-words">
                        {Array.isArray(val)
                          ? val.join(', ')
                          : typeof val === 'boolean'
                            ? val
                              ? 'Yes'
                              : 'No'
                            : String(val ?? '—')}
                      </dd>
                    </div>
                  ))}
                </dl>
              </AdminSection>
            ) : null}

            <AdminSection title="Attachments">
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attachments.</p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {attachments.map((a) => {
                    const aid = String(a.id ?? '');
                    const name = String(a.filename ?? aid);
                    return (
                      <li key={aid} className="py-3 first:pt-0">
                        <button
                          type="button"
                          className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                          disabled={downloadAttachmentM.isPending}
                          onClick={() => downloadAttachmentM.mutate(aid)}
                        >
                          {name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </AdminSection>

            <AdminSection title="Status history">
              {statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No status transitions recorded.</p>
              ) : (
                <ol className="relative space-y-0 border-l-2 border-primary/20 pl-6">
                  {statusHistory.map((sh, i) => (
                    <li key={String(sh.id ?? i)} className="relative pb-6 last:pb-0">
                      <span
                        className="absolute -left-[1.4rem] top-1 flex h-3 w-3 rounded-full border-2 border-card bg-primary"
                        aria-hidden
                      />
                      <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium capitalize text-foreground">
                            {formatAdminStatus(sh.status ?? '—')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {sh.timestamp ? formatIsoDate(String(sh.timestamp), 'PPp') : '—'}
                          </span>
                        </div>
                        {sh.note ? (
                          <p className="mt-1 text-sm text-muted-foreground">{String(sh.note)}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </AdminSection>

            <AdminSection title="Internal notes">
              <div className="space-y-3">
                <FormFieldLabel fieldKey="requests.internalNote" label="Internal note">
                  New note
                </FormFieldLabel>
                <textarea
                  value={noteContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNoteContent(e.target.value)
                  }
                  placeholder="Team-only note, not visible to the client…"
                  className="min-h-[80px] w-full rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <Button
                  size="sm"
                  className="rounded-lg"
                  disabled={!noteContent.trim() || addNoteM.isPending}
                  onClick={() => addNoteM.mutate()}
                >
                  {addNoteM.isPending ? 'Saving…' : 'Add note'}
                </Button>
              </div>
              {adminNotes.length > 0 ? (
                <ul className="mt-4 space-y-3 border-t border-border/50 pt-4">
                  {adminNotes.map((n) => (
                    <li
                      key={String(n.id ?? '')}
                      className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm"
                    >
                      <p>{String(n.content ?? '')}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {n.createdAt ? formatIsoDate(String(n.createdAt), 'PPp') : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </AdminSection>
          </div>

          {showQuoteRail ? (
            <div className="space-y-6">
              {quoteId ? (
                <section className="ge-card rounded-lg border border-border/70 bg-muted/20 p-5">
                  <h3 className="font-semibold text-foreground">Quote (read-only)</h3>
                  <p className="mt-2 text-sm capitalize text-muted-foreground">
                    Status: {quoteStatus || 'unknown'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sent or finalized quotes cannot be edited here. If the client requested changes,
                    their quote status should show as changes requested — refresh this page after
                    they submit.
                  </p>
                  {quote && typeof quote.totalAmount === 'number' ? (
                    <p className="mt-2 text-lg font-semibold tabular-nums">
                      {formatMoneyFromPaise(Number(quote.totalAmount), budgetCurrency)}
                    </p>
                  ) : null}
                  <Link
                    href={`/quotes/${encodeURIComponent(quoteId)}`}
                    className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    View quote (read-only) →
                  </Link>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </AdminQueryState>
    </div>
  );
}
