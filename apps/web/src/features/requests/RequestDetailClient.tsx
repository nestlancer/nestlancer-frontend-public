'use client';

import type { ChangeEvent, ReactNode } from 'react';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { ACCEPTED_REQUEST_ATTACHMENT_ACCEPT, getApiErrorMessage } from '@nestlancer/api-client';
import { DEFAULT_CURRENCY, formatRequestCategory, queryKeys, routes } from '@nestlancer/constants';
import type { RequestDetail } from '@nestlancer/types';
import { formatIsoDate, formatMoneyFromPaise, fromPaise, openSafeHttpUrl } from '@nestlancer/utils';

import { FormFieldLabel } from '@nestlancer/field-help';
import {
  REQUEST_DESCRIPTION_MAX,
  REQUEST_DESCRIPTION_MIN,
  REQUEST_TITLE_MAX,
  REQUEST_TITLE_MIN,
  requestCreateSchema,
} from '@nestlancer/validators';

import {
  Button,
  PageHeader,
  ErrorState,
  Skeleton,
  SkeletonText,
  StatusBadge,
  cn,
} from '@nestlancer/ui';

import { formatWorkStatusLabel, workStatusBadgeVariant } from '@/features/work/status-utils';
import { TabPanelSkeleton } from '@/components/common/TabPanelSkeleton';
import { useWebConfirm } from '@/components/web/WebConfirmProvider';
import { WebPanel } from '@/components/web/WebPanel';
import { webPrimaryButtonClass } from '@/lib/tailadmin-classes';
import { invalidateByAction } from '@/lib/invalidate-queries';
import {
  requestsRequestsControllerGetAttachmentDownloadUrl,
  useAddRequestAttachmentMutation,
  useDeleteRequestMutation,
  useRemoveRequestAttachmentMutation,
  useRequestDetailQuery,
  useRequestQuotesQuery,
  useRequestStatusTimelineQuery,
  useSubmitRequestMutation,
  useUpdateRequestMutation,
} from '@/features/requests/hooks/useRequestsApi';

function DetailField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  );
}

function StatusTimeline({ events }: { events: unknown[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No status history yet.</p>;
  }
  return (
    <ol className="relative ml-2 space-y-0 pl-8">
      <span className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-border" aria-hidden />
      {events.map((ev, i) => {
        const o = ev && typeof ev === 'object' ? (ev as Record<string, unknown>) : {};
        const status = String(o.status ?? o.title ?? 'Event');
        const when = o.timestamp || o.createdAt;
        const isLast = i === events.length - 1;
        return (
          <li key={String(o.id ?? i)} className="relative pb-6 last:pb-0">
            <span
              className="absolute -left-8 top-1 h-4 w-4 rounded-full border-2 border-[hsl(var(--status-success))] bg-[hsl(var(--status-success))]"
              aria-hidden
            />
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm font-semibold">{formatWorkStatusLabel(status)}</p>
              {o.note ? (
                <p className="mt-1 text-xs text-muted-foreground">{String(o.note)}</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {when ? formatIsoDate(String(when), 'PPp') : '—'}
              </p>
            </div>
            {!isLast ? null : null}
          </li>
        );
      })}
    </ol>
  );
}

function requestActionsCopy(status: string): { body: string; ctaHref?: string; ctaLabel?: string } {
  const key = status
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
  if (key === 'converted_to_project' || key === 'convertedtoproject') {
    return {
      body: 'This request was converted to a project. Track delivery, milestones, and files in Projects.',
      ctaHref: routes.projects,
      ctaLabel: 'Open projects',
    };
  }
  if (key === 'quoted' || key === 'accepted') {
    return {
      body:
        key === 'accepted'
          ? 'You accepted a quote for this request. Review the quote or wait for project setup to finish.'
          : 'A quote is ready for your review. Open it from the Quotes section on this page.',
    };
  }
  if (key === 'under_review' || key === 'underreview') {
    return {
      body: 'The team is reviewing your request and will follow up with questions or a quote.',
    };
  }
  if (key === 'changes_requested' || key === 'changesrequested') {
    return { body: 'Changes were requested. Update the brief and resubmit when you are ready.' };
  }
  if (
    key === 'rejected' ||
    key === 'cancelled' ||
    key === 'expired_quote' ||
    key === 'expiredquote'
  ) {
    return {
      body: 'This request is closed. You can start a new request from Work Hub if you still need help.',
    };
  }
  return {
    body: 'This request has been submitted. The team will review it and send quotes here.',
  };
}

export function RequestDetailClient({ id }: { id: string }) {
  const confirm = useWebConfirm();
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBudgetMin, setEditBudgetMin] = useState(0);
  const [editBudgetMax, setEditBudgetMax] = useState(0);
  const [editBudgetFlexible, setEditBudgetFlexible] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const detailQ = useRequestDetailQuery(id);
  const quotesQ = useRequestQuotesQuery(id, Boolean(id) && !detailQ.isError);
  const statusQ = useRequestStatusTimelineQuery(id, Boolean(id) && !detailQ.isError);

  const submitM = useSubmitRequestMutation({
    mutation: {
      onSuccess: async () => {
        setSubmitError(null);
        toast.success('Request submitted for review.');
        await invalidateByAction(qc, 'requests.submit');
        void qc.invalidateQueries({ queryKey: queryKeys.requests.detail(id) });
      },
      onError: (e) => {
        const message = getApiErrorMessage(e, 'Submit failed');
        setSubmitError(message);
        toast.error(message);
      },
    },
  });

  function handleSubmitForReview() {
    setSubmitError(null);
    const requestBudget = (detailQ.data as RequestDetail | undefined)?.budget;
    const budgetMin = Number(requestBudget?.min ?? 0);
    const budgetMax = Number(requestBudget?.max ?? 0);
    if (!budgetMin || !budgetMax) {
      const message = 'Set a minimum and maximum budget before submitting for review.';
      setSubmitError(message);
      toast.error(message);
      return;
    }
    if (budgetMax < budgetMin) {
      const message = 'Maximum budget must be at least the minimum.';
      setSubmitError(message);
      toast.error(message);
      return;
    }
    submitM.mutate({ id });
  }

  const deleteM = useDeleteRequestMutation({
    mutation: {
      onSuccess: () => {
        toast.success('Request deleted.');
        void qc.invalidateQueries({ queryKey: queryKeys.requests.list() });
        window.location.href = routes.requests;
      },
      onError: (e) => toast.error(getApiErrorMessage(e, 'Delete failed')),
    },
  });

  const uploadM = useAddRequestAttachmentMutation({
    mutation: {
      onSuccess: () => {
        toast.success('Attachment uploaded.');
        void qc.invalidateQueries({ queryKey: queryKeys.requests.detail(id) });
      },
      onError: (e) => toast.error(getApiErrorMessage(e, 'Upload failed')),
    },
  });

  const removeAttachmentM = useRemoveRequestAttachmentMutation({
    mutation: {
      onSuccess: () => {
        toast.success('Attachment removed.');
        void qc.invalidateQueries({ queryKey: queryKeys.requests.detail(id) });
      },
      onError: (e) => toast.error(getApiErrorMessage(e, 'Remove failed')),
    },
  });

  const downloadAttachmentM = useMutation({
    mutationFn: (attachmentId: string) =>
      requestsRequestsControllerGetAttachmentDownloadUrl(id, attachmentId),
    onSuccess: (data) => {
      const inner = data as { downloadUrl?: string; url?: string };
      const url = inner?.downloadUrl ?? inner?.url ?? null;
      if (url) openSafeHttpUrl(url);
      else toast.error('Download URL not available');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Download failed')),
  });

  const updateM = useUpdateRequestMutation({
    mutation: {
      onSuccess: async () => {
        toast.success('Request updated.');
        setEditMode(false);
        await invalidateByAction(qc, 'requests.update', id);
      },
      onError: (e) => toast.error(getApiErrorMessage(e, 'Update failed')),
    },
  });

  if (detailQ.isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-8">
        <Skeleton className="h-10 w-2/3 max-w-md" />
        <SkeletonText lines={3} />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }
  if (detailQ.isError) {
    return (
      <ErrorState
        title="Could not load request"
        message={getApiErrorMessage(detailQ.error, 'Could not load request')}
        onRetry={() => void detailQ.refetch()}
      />
    );
  }

  const d = detailQ.data as RequestDetail;
  const budget = d.budget ?? { min: 0, max: 0, currency: DEFAULT_CURRENCY, flexible: false };
  const timeline = d.timeline ?? {
    preferredStartDate: '',
    deadline: '',
    flexible: false,
  };
  const requirements = (d.requirements ?? []).filter(Boolean);
  const attachments = d.attachments ?? [];
  const quotesFromDetail = d.quotes ?? [];
  const quotesFromQuery = quotesQ.data?.quotes ?? [];
  const quotesRaw = quotesFromDetail.length > 0 ? quotesFromDetail : quotesFromQuery;
  // NL-QUOTE-006: never link clients to draft quotes (avoids Quote not found).
  const quotes = quotesRaw.filter((raw) => {
    const status = String((raw as { status?: string }).status ?? '')
      .trim()
      .toUpperCase();
    return status && status !== 'DRAFT' && status !== 'PENDING';
  });

  const statusEvents = Array.isArray(statusQ.data) ? statusQ.data : (d.statusHistory ?? []);

  const tech = d.technicalRequirements as Record<string, unknown> | null | undefined;
  const techLines: string[] = [];
  if (tech) {
    const techs = tech.preferredTechnologies;
    if (Array.isArray(techs) && techs.length > 0) {
      techLines.push(`Technologies: ${techs.map(String).join(', ')}`);
    }
    if (typeof tech.hosting === 'string' && tech.hosting)
      techLines.push(`Hosting: ${tech.hosting}`);
    const integrations = tech.integrations;
    if (Array.isArray(integrations) && integrations.length > 0) {
      techLines.push(`Integrations: ${integrations.map(String).join(', ')}`);
    }
  }

  const isDraft = String(d.status).toLowerCase() === 'draft';
  const actionsCopy = requestActionsCopy(String(d.status));

  const primaryQuote = quotes[0] as
    | {
        id?: string;
        status?: string;
        totalAmount?: number;
        currency?: string;
        version?: string | number;
        validUntil?: string;
      }
    | undefined;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          eyebrow={`Request ${d.id}`}
          title={d.title}
          description={`${formatRequestCategory(d.category)} · Full project brief and delivery timeline`}
          className="mb-0"
        />
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            variant={workStatusBadgeVariant(String(d.status))}
            dot
            className="capitalize"
          >
            {formatWorkStatusLabel(String(d.status))}
          </StatusBadge>
          {isDraft ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditTitle(d.title ?? '');
                setEditDescription(d.description ?? '');
                // API returns paise; edit form uses major units (rupees) like create.
                setEditBudgetMin(fromPaise(Number(budget.min ?? 0)));
                setEditBudgetMax(fromPaise(Number(budget.max ?? 0)));
                setEditBudgetFlexible(Boolean(budget.flexible));
                setEditMode((v) => !v);
              }}
            >
              {editMode ? 'Cancel edit' : 'Edit'}
            </Button>
          ) : null}
        </div>
      </div>

      {editMode && isDraft ? (
        <WebPanel padding="md" className="border-ta-brand-500/30">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Edit request</h2>
          <div className="mt-4 space-y-3">
            <div>
              <FormFieldLabel fieldKey="requests.title" label="Title">
                Title
              </FormFieldLabel>
              <input
                value={editTitle}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value)}
                minLength={REQUEST_TITLE_MIN}
                maxLength={REQUEST_TITLE_MAX}
                className="h-11 w-full rounded-xl border border-border/70 bg-background/80 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. Redesign marketing site"
              />
            </div>
            <div>
              <FormFieldLabel fieldKey="requests.description" label="Description">
                Description
              </FormFieldLabel>
              <textarea
                value={editDescription}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setEditDescription(e.target.value)
                }
                minLength={REQUEST_DESCRIPTION_MIN}
                maxLength={REQUEST_DESCRIPTION_MAX}
                className="min-h-[100px] w-full rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Goals, constraints, and what success looks like…"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FormFieldLabel fieldKey="requests.budgetMin" label="Budget min">
                  Budget min ({budget.currency || DEFAULT_CURRENCY})
                </FormFieldLabel>
                <input
                  type="number"
                  min={0}
                  value={editBudgetMin}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditBudgetMin(Number(e.target.value) || 0)
                  }
                  className="h-11 w-full rounded-xl border border-border/70 bg-background/80 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="50000"
                />
              </div>
              <div>
                <FormFieldLabel fieldKey="requests.budgetMax" label="Budget max">
                  Budget max ({budget.currency || DEFAULT_CURRENCY})
                </FormFieldLabel>
                <input
                  type="number"
                  min={0}
                  value={editBudgetMax}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditBudgetMax(Number(e.target.value) || 0)
                  }
                  className="h-11 w-full rounded-xl border border-border/70 bg-background/80 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="150000"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={editBudgetFlexible}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEditBudgetFlexible(e.target.checked)
                }
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
              />
              <FormFieldLabel fieldKey="requests.budgetFlexible" label="Budget is flexible">
                Budget is flexible
              </FormFieldLabel>
            </label>
            <Button
              type="button"
              className={webPrimaryButtonClass}
              disabled={!editTitle.trim() || updateM.isPending}
              onClick={() => {
                const parsed = requestCreateSchema.safeParse({
                  title: editTitle.trim(),
                  description: editDescription.trim(),
                });
                if (!parsed.success) {
                  toast.error(parsed.error.issues[0]?.message ?? 'Check title and description.');
                  return;
                }
                if (editBudgetMax < editBudgetMin) {
                  toast.error('Maximum budget must be at least the minimum.');
                  return;
                }
                updateM.mutate({
                  id,
                  data: {
                    title: parsed.data.title,
                    description: parsed.data.description,
                    budget: {
                      min: editBudgetMin,
                      max: editBudgetMax,
                      currency: budget.currency || DEFAULT_CURRENCY,
                      flexible: editBudgetFlexible,
                    },
                  },
                });
              }}
            >
              {updateM.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </WebPanel>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border bg-muted/40 px-3 py-1">
          Category: {formatRequestCategory(d.category)}
        </span>
        {d.createdAt ? (
          <span className="rounded-full border border-border bg-muted/40 px-3 py-1">
            Created {formatIsoDate(d.createdAt, 'PP')}
          </span>
        ) : null}
        {d.submittedAt ? (
          <span className="rounded-full border border-border bg-muted/40 px-3 py-1">
            Submitted {formatIsoDate(d.submittedAt, 'PP')}
          </span>
        ) : null}
        {d.updatedAt ? (
          <span className="rounded-full border border-border bg-muted/40 px-3 py-1">
            Updated {formatIsoDate(d.updatedAt, 'PP')}
          </span>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <WebPanel padding="md">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Request details
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
              {d.description || '—'}
            </p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <DetailField label="Budget">
                {budget.min === budget.max && budget.max > 0
                  ? formatMoneyFromPaise(budget.max, budget.currency)
                  : `${formatMoneyFromPaise(budget.min, budget.currency)} – ${formatMoneyFromPaise(budget.max, budget.currency)}`}
                {budget.flexible ? (
                  <span className="ml-1 text-muted-foreground">(flexible)</span>
                ) : null}
              </DetailField>
              <DetailField label="Preferred start">
                {timeline.preferredStartDate
                  ? formatIsoDate(String(timeline.preferredStartDate), 'PP')
                  : '—'}
              </DetailField>
              <DetailField label="Deadline">
                {timeline.deadline ? formatIsoDate(String(timeline.deadline), 'PP') : '—'}
              </DetailField>
              <DetailField label="Timeline">
                {timeline.flexible ? 'Dates are flexible' : 'Fixed dates'}
              </DetailField>
            </dl>
          </WebPanel>

          <WebPanel padding="md">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Requirements</h2>
            {requirements.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No requirements listed.</p>
            ) : (
              <ul className="mt-4 flex flex-wrap gap-2">
                {requirements.map((r) => (
                  <li
                    key={r}
                    className="rounded-lg border border-border/80 bg-muted/30 px-3 py-1.5 text-sm"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </WebPanel>

          {techLines.length > 0 ? (
            <WebPanel padding="md">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Technical preferences
              </h2>
              <ul className="mt-3 space-y-1 text-sm">
                {techLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </WebPanel>
          ) : null}

          <WebPanel padding="md">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Attachments</h2>
            {attachments.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No files attached yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border/60">
                {attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0"
                  >
                    <button
                      type="button"
                      className="text-left text-sm font-medium text-primary hover:underline disabled:opacity-50"
                      disabled={downloadAttachmentM.isPending}
                      onClick={() => downloadAttachmentM.mutate(a.id)}
                    >
                      {a.filename ?? a.id}
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      {a.size != null ? (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(a.size / 1024)} KB
                        </span>
                      ) : null}
                      {isDraft ? (
                        <button
                          type="button"
                          className="text-xs text-destructive hover:underline disabled:opacity-50"
                          disabled={removeAttachmentM.isPending}
                          onClick={async () => {
                            if (
                              await confirm({
                                title: 'Remove this attachment?',
                                destructive: true,
                              })
                            ) {
                              removeAttachmentM.mutate({ id, attachmentId: a.id });
                            }
                          }}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {isDraft ? (
              <div className="mt-4 flex cursor-pointer flex-col gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
                <FormFieldLabel fieldKey="requests.attachments" label="Upload a file">
                  Upload a file
                </FormFieldLabel>
                <p className="text-xs text-muted-foreground">
                  PDF, images, Word, plain text, CSV, or Markdown (.md).
                </p>
                <input
                  type="file"
                  accept={ACCEPTED_REQUEST_ATTACHMENT_ACCEPT}
                  className="text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-sm"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadM.mutate({ id, data: { file: f } });
                    e.target.value = '';
                  }}
                />
              </div>
            ) : null}
          </WebPanel>

          <WebPanel padding="md">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Status history
            </h2>
            {statusQ.isPending ? (
              <TabPanelSkeleton variant="timeline" />
            ) : statusQ.isError ? (
              <ErrorState
                title="Could not load status history"
                message={getApiErrorMessage(statusQ.error)}
                onRetry={() => void statusQ.refetch()}
              />
            ) : (
              <StatusTimeline events={statusEvents} />
            )}
          </WebPanel>
        </div>

        <div className="space-y-6">
          {primaryQuote?.id ? (
            <WebPanel padding="md" className="border-ta-brand-500/30">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold">Linked quote</h2>
                {primaryQuote.status ? (
                  <StatusBadge variant={workStatusBadgeVariant(String(primaryQuote.status))} dot>
                    {formatWorkStatusLabel(String(primaryQuote.status))}
                  </StatusBadge>
                ) : null}
              </div>
              {primaryQuote.version != null ? (
                <p className="mt-2 text-xs text-muted-foreground">Version {primaryQuote.version}</p>
              ) : null}
              {primaryQuote.totalAmount != null ? (
                <p className="mt-3 text-2xl font-bold tabular-nums">
                  {formatMoneyFromPaise(Number(primaryQuote.totalAmount), budget.currency)}
                </p>
              ) : null}
              <Button className={cn('mt-4 w-full', webPrimaryButtonClass)} asChild>
                <Link href={routes.quote(String(primaryQuote.id))}>Review quote</Link>
              </Button>
            </WebPanel>
          ) : null}

          <WebPanel padding="md" className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Actions</h2>
            {isDraft ? (
              <>
                <Button
                  type="button"
                  className={cn('w-full', webPrimaryButtonClass)}
                  disabled={submitM.isPending}
                  onClick={handleSubmitForReview}
                >
                  {submitM.isPending ? 'Submitting…' : 'Submit for review'}
                </Button>
                {submitError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {submitError}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                  disabled={deleteM.isPending}
                  onClick={async () => {
                    if (
                      await confirm({
                        title: 'Delete this draft?',
                        description: 'This request draft will be permanently removed.',
                        destructive: true,
                      })
                    ) {
                      deleteM.mutate({ id });
                    }
                  }}
                >
                  Delete draft
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{actionsCopy.body}</p>
                {actionsCopy.ctaHref && actionsCopy.ctaLabel ? (
                  <Button className={cn('w-full', webPrimaryButtonClass)} asChild>
                    <Link href={actionsCopy.ctaHref}>{actionsCopy.ctaLabel}</Link>
                  </Button>
                ) : null}
              </>
            )}
            <Button variant="ghost" className="w-full" asChild>
              <Link href={routes.requests}>← Back to Work Hub</Link>
            </Button>
          </WebPanel>

          <WebPanel padding="md">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">All quotes</h2>
            {quotesQ.isPending && quotes.length === 0 ? <TabPanelSkeleton variant="list" /> : null}
            {quotesQ.isError && quotes.length === 0 ? (
              <ErrorState
                className="mt-3"
                title="Could not load quotes"
                message={getApiErrorMessage(quotesQ.error)}
                onRetry={() => void quotesQ.refetch()}
              />
            ) : null}
            {quotes.length === 0 && !quotesQ.isPending ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No quotes yet. You will be notified when the team sends one.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {quotes.map((raw) => {
                  const q = raw as {
                    id?: string;
                    status?: string;
                    totalAmount?: number;
                    currency?: string;
                  };
                  const qid = String(q.id ?? '');
                  return (
                    <li
                      key={qid}
                      className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge
                          variant={workStatusBadgeVariant(String(q.status ?? 'pending'))}
                          dot
                          className="capitalize"
                        >
                          {formatWorkStatusLabel(String(q.status ?? 'pending'))}
                        </StatusBadge>
                        {q.totalAmount != null ? (
                          <span className="text-sm font-semibold tabular-nums">
                            {formatMoneyFromPaise(Number(q.totalAmount), budget.currency)}
                          </span>
                        ) : null}
                      </div>
                      {qid ? (
                        <Button variant="link" className="mt-2 h-auto p-0" asChild>
                          <Link href={routes.quote(qid)}>View quote →</Link>
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </WebPanel>
        </div>
      </div>
    </div>
  );
}
