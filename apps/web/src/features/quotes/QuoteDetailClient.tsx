'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight } from '@nestlancer/ui/icons';
import { toast } from '@nestlancer/ui';

import {
  ChangeItemDtoArea,
  DeclineQuoteDtoReason,
  getApiErrorMessage,
  isNotFoundApiError,
  peelSuccessEnvelope,
} from '@nestlancer/api-client';
import { queryKeys, routes } from '@nestlancer/constants';
import { acceptQuoteSchema } from '@nestlancer/validators';
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  SkeletonText,
  Spinner,
  StatusBadge,
  cn,
} from '@nestlancer/ui';
import { formatMoneyFromPaise } from '@nestlancer/utils';

import { FormFieldLabel } from '@nestlancer/field-help';

import { extractQuoteDetailView } from '@/features/quotes/quote-view-model';
import {
  useAcceptQuoteMutation,
  useDeclineQuoteMutation,
  useQuoteDetailQuery,
  useRequestQuoteChangesMutation,
} from '@/features/quotes/hooks/useQuotesApi';
import {
  fetchProjectIdByQuoteId,
  pollProjectIdByQuoteId,
} from '@/features/projects/hooks/useProjectsApi';
import {
  canClientAcceptQuote,
  canClientNegotiateQuote,
  formatWorkStatusLabel,
  normalizeWorkStatus,
  workStatusBadgeVariant,
} from '@/features/work/status-utils';
import { WebPanel } from '@/components/web/WebPanel';
import { LiveQuoteDocumentsPanel } from '@/features/documents/components/LiveQuoteDocumentsPanel';
import { invalidateByAction } from '@/lib/invalidate-queries';
import {
  webPrimaryButtonClass,
  webPrimaryTextClass,
  webStickyActionBarClass,
} from '@/lib/tailadmin-classes';

const POLL_INTERVAL_MS = 1500;

export function QuoteDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [acceptPhase, setAcceptPhase] = useState<'idle' | 'initializing' | 'timeout'>('idle');
  const [showNegotiate, setShowNegotiate] = useState(false);
  const [declineReason, setDeclineReason] = useState<DeclineQuoteDtoReason | ''>('');
  const [declineRevision, setDeclineRevision] = useState(false);
  const [declineFeedback, setDeclineFeedback] = useState('');
  const [declineConfirmed, setDeclineConfirmed] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const declineInFlight = useRef(false);
  const [acceptAgreement, setAcceptAgreement] = useState(false);
  const acceptFormRef = useRef<HTMLDivElement>(null);

  const q = useQuoteDetailQuery(id);

  const quoteData = q.data as Record<string, unknown> | undefined;
  const quoteStatus = normalizeWorkStatus(quoteData?.status);
  const isAcceptedQuote = ['ACCEPTED', 'CONVERTED'].includes(quoteStatus);

  const linkedProjectQ = useQuery({
    queryKey: ['projects', 'byQuote', id],
    queryFn: () => fetchProjectIdByQuoteId(id),
    enabled: Boolean(quoteData) && isAcceptedQuote,
    refetchInterval: (query) => (isAcceptedQuote && !query.state.data ? POLL_INTERVAL_MS : false),
  });

  useEffect(() => {
    const projectId = linkedProjectQ.data;
    if (!projectId) return;
    if (acceptPhase === 'initializing' || acceptPhase === 'timeout') {
      router.push(routes.project(projectId));
    }
  }, [linkedProjectQ.data, acceptPhase, router]);

  const acceptM = useAcceptQuoteMutation({
    mutation: {
      onSuccess: async (raw) => {
        toast.success('Quote accepted.');
        await invalidateByAction(qc, 'quotes.accept');
        void qc.invalidateQueries({ queryKey: queryKeys.quotes.detail(id) });

        const accepted = peelSuccessEnvelope(raw) as Record<string, unknown>;
        const projectPayload = accepted.project as { id?: string } | undefined;
        const directProjectId =
          typeof accepted.projectId === 'string'
            ? accepted.projectId
            : projectPayload?.id && projectPayload.id !== 'pending'
              ? projectPayload.id
              : null;

        if (directProjectId) {
          router.push(routes.project(directProjectId));
          return;
        }

        setAcceptPhase('initializing');
        try {
          const projectId = await pollProjectIdByQuoteId(id);
          if (projectId) {
            router.push(routes.project(projectId));
            return;
          }
          setAcceptPhase('timeout');
          toast.info('Your project is still being set up. Check the Projects page shortly.');
        } catch (e) {
          setAcceptPhase('idle');
          toast.error(getApiErrorMessage(e, 'Could not find your new project'));
        }
      },
      onError: (e) => toast.error(getApiErrorMessage(e, 'Accept failed')),
    },
  });

  const requestChangesM = useRequestQuoteChangesMutation({
    mutation: {
      onSuccess: () => {
        toast.success('Change request sent.');
        void qc.invalidateQueries({ queryKey: queryKeys.quotes.detail(id) });
        setShowNegotiate(false);
      },
      onError: (e) => toast.error(getApiErrorMessage(e, 'Request failed')),
    },
  });

  const declineM = useDeclineQuoteMutation({
    mutation: {
      onSuccess: async () => {
        toast.success('Quote updated.');
        await invalidateByAction(qc, 'quotes.decline');
        void qc.invalidateQueries({ queryKey: queryKeys.quotes.detail(id) });
      },
      onError: (e) => toast.error(getApiErrorMessage(e, 'Decline failed')),
    },
  });

  if (acceptPhase === 'initializing') {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <Spinner className="h-10 w-10 border-2 border-primary/30 border-t-primary" />
        <div>
          <p className="text-lg font-semibold">Initializing your project…</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We are creating your project from this quote. This usually takes a few seconds.
          </p>
        </div>
      </div>
    );
  }

  if (q.isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-8">
        <Skeleton className="h-8 w-48" />
        <SkeletonText lines={4} />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (q.isError) {
    if (isNotFoundApiError(q.error)) {
      notFound();
      return null;
    }
    return (
      <ErrorState
        title="Could not load quote"
        message={getApiErrorMessage(q.error, 'Could not load quote')}
        onRetry={() => void q.refetch()}
      />
    );
  }

  const quote = (q.data ?? {}) as Record<string, unknown>;
  // NL-BUG-UI-015: empty success payload must not render blank chrome.
  const quoteId = quote.id != null ? String(quote.id) : '';
  if (!q.isPending && !quoteId) {
    notFound();
    return null;
  }
  const detail = extractQuoteDetailView(
    quote,
    typeof quote.currency === 'string' ? quote.currency : undefined
  );
  const status = normalizeWorkStatus(quote.status);
  const canAccept = canClientAcceptQuote(quote.status);
  const canNegotiate = canClientNegotiateQuote(quote.status);
  const awaitingSend = ['PENDING', 'DRAFT'].includes(status);
  const isAccepted = ['ACCEPTED', 'CONVERTED'].includes(status);
  const acceptFormComplete = acceptAgreement && signatureName.trim().length > 0;
  const acceptDisabledReason = !canAccept
    ? 'This quote can no longer be accepted.'
    : !acceptAgreement
      ? 'Check the agreement box below to continue.'
      : !signatureName.trim()
        ? 'Enter your legal name to sign.'
        : undefined;

  function submitAccept() {
    const parsed = acceptQuoteSchema.safeParse({
      acceptTerms: true,
      signatureName: signatureName.trim(),
      signatureDate: new Date().toISOString(),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Check the agreement.');
      return;
    }
    acceptM.mutate({
      id,
      data: parsed.data,
    });
  }

  function scrollToAcceptForm() {
    acceptFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function openDeclinePanel() {
    setShowNegotiate(true);
    requestAnimationFrame(() => {
      document
        .getElementById('decline-reason')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  const canSubmitDecline =
    Boolean(declineReason) &&
    declineFeedback.trim().length > 0 &&
    declineConfirmed &&
    canNegotiate &&
    !declineM.isPending;

  function submitDecline() {
    // NL-BUG-QUOTE-1 / QUOTE-2: require reason + detail + inline confirm (no window.confirm —
    // native dialogs are invisible to automation and were swallowing the submit).
    if (!declineReason || !declineFeedback.trim() || !declineConfirmed) {
      openDeclinePanel();
      return;
    }
    if (declineInFlight.current || declineM.isPending) return;
    declineInFlight.current = true;
    declineM.mutate(
      {
        id,
        data: {
          reason: declineReason,
          requestRevision: declineRevision,
          feedback: declineFeedback.trim(),
        },
      },
      {
        onSettled: () => {
          declineInFlight.current = false;
        },
      }
    );
  }

  return (
    <div className="space-y-8 pb-28">
      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href={routes.quotes} className="font-medium text-primary hover:underline">
          ← Back to quotes
        </Link>
        {detail.requestId ? (
          <>
            {' · '}
            <Link
              href={routes.request(detail.requestId)}
              className="font-medium text-primary hover:underline"
            >
              View request
            </Link>
          </>
        ) : null}
      </nav>

      <PageHeader
        eyebrow="Quote"
        title={`Quote #${String(quote.id ?? id).slice(0, 8)}`}
        description={
          detail.requestTitle
            ? `For: ${detail.requestTitle}`
            : 'Review scope and pricing before accepting or declining.'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant={workStatusBadgeVariant(status)} dot className="capitalize">
              {formatWorkStatusLabel(status)}
            </StatusBadge>
            {detail.version != null ? (
              <StatusBadge variant="neutral">Version {detail.version}</StatusBadge>
            ) : null}
          </div>
        }
      />

      {acceptPhase === 'timeout' ? (
        <p className="rounded-lg border border-[hsl(var(--status-warning-border))] bg-[hsl(var(--status-warning-bg))] px-4 py-3 text-sm">
          Project setup is taking longer than expected.{' '}
          <Link href={routes.projects} className="font-medium text-primary underline">
            Open Projects
          </Link>
        </p>
      ) : null}

      {awaitingSend ? (
        <p className="rounded-lg border border-[hsl(var(--status-warning-border))] bg-[hsl(var(--status-warning-bg))] px-4 py-3 text-sm">
          This quote has not been sent yet. You can review it once the Nestlancer team publishes it.
        </p>
      ) : null}

      <WebPanel padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 md:px-6">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Line items</h2>
          <p className={cn('text-2xl tabular-nums', webPrimaryTextClass)}>
            {formatMoneyFromPaise(detail.total, detail.currency)}
          </p>
        </div>
        {detail.lineItems.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              title="No line items"
              description="This quote shows a single total amount without itemized breakdown."
            />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Total: {formatMoneyFromPaise(detail.total, detail.currency)}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-y border-border/80 bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Unit price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.lineItems.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="px-4 py-3">{row.description}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.quantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoneyFromPaise(row.unitPrice, detail.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatMoneyFromPaise(row.total, detail.currency)}
                    </td>
                  </tr>
                ))}
                {detail.subtotal != null || detail.tax != null ? (
                  <>
                    {detail.subtotal != null ? (
                      <tr className="border-b border-border/40">
                        <td
                          colSpan={3}
                          className="px-4 py-2 text-right text-sm text-muted-foreground"
                        >
                          Subtotal
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatMoneyFromPaise(detail.subtotal, detail.currency)}
                        </td>
                      </tr>
                    ) : null}
                    {detail.tax != null && detail.tax > 0 ? (
                      <tr className="border-b border-border/40">
                        <td
                          colSpan={3}
                          className="px-4 py-2 text-right text-sm text-muted-foreground"
                        >
                          {detail.taxPercentage != null
                            ? `GST (${detail.taxPercentage}%)`
                            : 'GST / Tax'}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatMoneyFromPaise(detail.tax, detail.currency)}
                        </td>
                      </tr>
                    ) : null}
                  </>
                ) : null}
                <tr className="bg-muted/30">
                  <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-bold tabular-nums">
                    {formatMoneyFromPaise(detail.total, detail.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </WebPanel>

      {detail.schedule.length > 0 ? (
        <WebPanel padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 md:px-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Payment schedule
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Installments due over the life of this engagement
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-y border-border/80 bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Milestone
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Share
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Due
                  </th>
                </tr>
              </thead>
              <tbody>
                {detail.schedule.map((row, idx) => (
                  <tr key={`${row.label}-${idx}`} className="border-b border-border/60">
                    <td className="px-4 py-3 font-medium">{row.label}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.percentage > 0 ? `${row.percentage}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatMoneyFromPaise(row.amountPaise, detail.currency)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.dueOn || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WebPanel>
      ) : null}

      <LiveQuoteDocumentsPanel
        quoteId={id}
        showContractAction={isAccepted}
        showContractPreview={canAccept || canNegotiate}
        enabled={Boolean(q.data)}
      />

      {(canAccept || canNegotiate || detail.contractStatus === 'signed') && (
        <WebPanel padding="md" className="space-y-4 text-sm text-muted-foreground">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Service agreement
          </h2>
          {detail.contractStatus === 'signed' ? (
            <p>
              Signed on{' '}
              <strong className="text-foreground">{detail.contractSignedAt ?? 'acceptance'}</strong>
              {detail.contractNumber ? (
                <>
                  {' '}
                  · Agreement <strong className="text-foreground">{detail.contractNumber}</strong>
                </>
              ) : null}
            </p>
          ) : (
            <p>
              Review the draft service agreement before accepting. Acceptance electronically signs
              the Nestlancer service agreement for this project.
            </p>
          )}

          {isAccepted && linkedProjectQ.data ? (
            <Button type="button" asChild className={webPrimaryButtonClass}>
              <Link href={routes.project(linkedProjectQ.data)}>Open project</Link>
            </Button>
          ) : null}

          {canAccept ? (
            <div
              ref={acceptFormRef}
              className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/80">
                Accept &amp; sign
              </p>
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={acceptAgreement}
                  onChange={(e) => setAcceptAgreement(e.target.checked)}
                />
                <span>
                  I have read the service agreement and agree to the terms &amp; conditions for this
                  project.
                </span>
              </label>
              <div className="space-y-1">
                <FormFieldLabel
                  htmlFor="sig-name"
                  fieldKey="quotes.signatureName"
                  label="Legal name"
                >
                  Legal name (e-signature)
                </FormFieldLabel>
                <input
                  id="sig-name"
                  placeholder="Type your full legal name"
                  value={signatureName}
                  maxLength={100}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>
              <Button
                type="button"
                className={cn('w-full sm:w-auto', webPrimaryButtonClass)}
                disabled={acceptM.isPending || !acceptFormComplete}
                onClick={submitAccept}
              >
                Accept quote &amp; sign agreement
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
              </Button>
              {acceptDisabledReason && !acceptFormComplete ? (
                <p className="text-xs text-[hsl(var(--status-warning))]">{acceptDisabledReason}</p>
              ) : null}
            </div>
          ) : null}
        </WebPanel>
      )}

      {(detail.standardTerms ||
        detail.additionalTerms ||
        (typeof quote.message === 'string' && quote.message) ||
        detail.validUntil) && (
        <WebPanel padding="md" className="space-y-4 text-sm text-muted-foreground">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Terms & conditions
          </h2>
          {detail.standardTerms ? (
            <div className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Standard terms
              </h3>
              <p className="whitespace-pre-wrap leading-relaxed">{detail.standardTerms}</p>
            </div>
          ) : null}
          {detail.additionalTerms ? (
            <div className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Project-specific terms
              </h3>
              <p className="whitespace-pre-wrap leading-relaxed">{detail.additionalTerms}</p>
            </div>
          ) : null}
          {typeof quote.message === 'string' &&
          quote.message &&
          !detail.standardTerms &&
          !detail.additionalTerms ? (
            <p className="whitespace-pre-wrap leading-relaxed">{quote.message}</p>
          ) : null}
          {detail.validUntil ? (
            <p className="text-xs">
              Valid until:{' '}
              <strong className="text-[hsl(var(--status-warning))]">{detail.validUntil}</strong>
            </p>
          ) : null}
        </WebPanel>
      )}

      {showNegotiate ? (
        <WebPanel padding="md">
          <h2 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
            Request changes or decline
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Request changes</h3>
              <FormFieldLabel htmlFor="changes-area" fieldKey="quotes.changesArea" label="Area">
                Area to adjust
              </FormFieldLabel>
              <select
                id="changes-area"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="budget">Budget</option>
                <option value="timeline">Timeline</option>
                <option value="features">Features / scope</option>
                <option value="terms">Terms</option>
              </select>
              <textarea
                id="changes-message"
                placeholder="e.g. Reduce milestone 2 by ₹20,000 and drop logo design"
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                disabled={requestChangesM.isPending || !canNegotiate}
                onClick={() => {
                  const message =
                    (document.getElementById('changes-message') as HTMLTextAreaElement | null)
                      ?.value ?? '';
                  const area =
                    (document.getElementById('changes-area') as HTMLSelectElement | null)?.value ??
                    ChangeItemDtoArea.terms;
                  requestChangesM.mutate({
                    id,
                    data: {
                      changes: [
                        {
                          area: (Object.values(ChangeItemDtoArea).includes(
                            area as ChangeItemDtoArea
                          )
                            ? area
                            : ChangeItemDtoArea.terms) as ChangeItemDtoArea,
                          request: message,
                        },
                      ],
                      ...(message.trim() ? { additionalNotes: message.trim() } : {}),
                    },
                  });
                }}
              >
                Send change request
              </Button>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Decline quote</h3>
              <select
                id="decline-reason"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value as DeclineQuoteDtoReason | '')}
              >
                <option value="" disabled>
                  Select a reason…
                </option>
                <option value="budgetConstraints">Budget</option>
                <option value="timelineIssues">Timeline</option>
                <option value="scopeDiscrepancy">Scope</option>
                <option value="other">Other</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  id="decline-revision"
                  type="checkbox"
                  checked={declineRevision}
                  onChange={(e) => setDeclineRevision(e.target.checked)}
                />
                Request revision / re-quote
              </label>
              <textarea
                id="decline-feedback"
                placeholder="e.g. Budget is above our range for this phase"
                rows={3}
                value={declineFeedback}
                onChange={(e) => setDeclineFeedback(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                required
              />
              <label className="flex items-start gap-2 text-sm">
                <input
                  id="decline-confirm"
                  type="checkbox"
                  className="mt-0.5"
                  checked={declineConfirmed}
                  onChange={(e) => setDeclineConfirmed(e.target.checked)}
                />
                <span>
                  I understand this declines the quote and notifies the team with the reason above.
                  This cannot be undone.
                </span>
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={!canSubmitDecline}
                onClick={submitDecline}
              >
                {declineM.isPending ? 'Declining…' : 'Decline quote'}
              </Button>
            </div>
          </div>
        </WebPanel>
      ) : null}

      <div
        className={cn(
          webStickyActionBarClass,
          'lg:left-[var(--sidebar-width)]',
          'pb-[max(1rem,env(safe-area-inset-bottom))]'
        )}
      >
        <div className="mx-auto flex max-w-dashboard flex-wrap items-center justify-end gap-3">
          {canNegotiate ? (
            <Button type="button" variant="outline" onClick={() => setShowNegotiate((v) => !v)}>
              {showNegotiate ? 'Hide options' : 'Negotiate'}
            </Button>
          ) : null}
          {canNegotiate ? (
            <Button
              type="button"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              disabled={declineM.isPending}
              onClick={openDeclinePanel}
            >
              Decline
            </Button>
          ) : null}
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="text-xs text-muted-foreground">
              {canAccept ? 'Complete the agreement section above to accept' : 'Quote summary'}
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {formatMoneyFromPaise(detail.total, detail.currency)}
            </p>
          </div>
          {canAccept ? (
            <Button
              type="button"
              className={cn('w-full sm:w-auto', webPrimaryButtonClass)}
              disabled={acceptM.isPending || !acceptFormComplete}
              onClick={() => {
                if (acceptFormComplete) {
                  submitAccept();
                  return;
                }
                scrollToAcceptForm();
              }}
            >
              {acceptFormComplete ? (
                <>
                  Accept quote &amp; sign agreement
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                </>
              ) : (
                'Complete agreement to accept'
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
