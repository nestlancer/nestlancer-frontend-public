'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { DEFAULT_CURRENCY } from '@nestlancer/constants';
import { formatIsoDate, formatMoneyFromPaise, openSafeHttpUrl } from '@nestlancer/utils';

import { StatusBadge } from '@nestlancer/ui';

import { GePageHeader as PageHeader } from '@/components/admin/AdminGentelellaUI';

import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { AdminEditQuoteForm } from '@/features/quotes/AdminEditQuoteForm';
import { QuoteHistoryPanel } from '@/features/quotes/QuoteHistoryPanel';
import {
  canAdminSendQuote,
  isChangesRequestedStatus,
  isQuoteEditable,
  quoteRecordFromPayload,
} from '@/features/quotes/admin-quote-utils';
import { LiveAdminQuoteDocumentsPanel } from '@/features/documents/components/LiveAdminQuoteDocumentsPanel';
import { adminKeys } from '@/lib/admin-query-keys';
import { apiServices } from '@/lib/axios';
import { Button } from '@nestlancer/ui';

export function QuoteDetailClient({ quoteId }: { quoteId: string }) {
  const qc = useQueryClient();
  const router = useRouter();
  const q = useQuery({
    queryKey: adminKeys.quote(quoteId),
    queryFn: () => apiServices.admin.getAdminQuote(quoteId),
  });

  const record = quoteRecordFromPayload(q.data);
  const status = String(record.status ?? '');
  const editable = isQuoteEditable(status);
  const currency = typeof record.currency === 'string' ? record.currency : DEFAULT_CURRENCY;
  const requestId = typeof record.requestId === 'string' ? record.requestId : null;

  const sendM = useMutation({
    mutationFn: () => apiServices.admin.sendAdminQuote(quoteId),
    onSuccess: () => {
      toast.success('Quote sent to client.');
      void qc.invalidateQueries({ queryKey: adminKeys.quote(quoteId) });
      void qc.invalidateQueries({ queryKey: adminKeys.quotes() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not send quote')),
  });

  const resendM = useMutation({
    mutationFn: () => apiServices.admin.resendQuote(quoteId),
    onSuccess: () => {
      toast.success('Quote resent to client.');
      void qc.invalidateQueries({ queryKey: adminKeys.quote(quoteId) });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not resend quote')),
  });

  const duplicateM = useMutation({
    mutationFn: () => apiServices.admin.duplicateAdminQuote(quoteId),
    onSuccess: (raw) => {
      const rec = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
      const inner =
        rec.data && typeof rec.data === 'object' ? (rec.data as Record<string, unknown>) : rec;
      const newQuoteId = String(inner.newQuoteId ?? inner.quoteId ?? '');
      toast.success(newQuoteId ? 'Quote duplicated — opening draft.' : 'Quote duplicated.');
      void qc.invalidateQueries({ queryKey: adminKeys.quotes() });
      if (newQuoteId) {
        router.push(`/quotes/${newQuoteId}`);
      }
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not duplicate quote')),
  });

  const extendM = useMutation({
    mutationFn: () => apiServices.admin.extendQuoteValidity(quoteId, { extendDays: 14 }),
    onSuccess: () => {
      toast.success('Quote validity extended by 14 days.');
      void qc.invalidateQueries({ queryKey: adminKeys.quote(quoteId) });
      void qc.invalidateQueries({ queryKey: adminKeys.quotes() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not extend validity')),
  });

  const pdfM = useMutation({
    mutationFn: () => apiServices.admin.getAdminQuotePdf(quoteId),
    onSuccess: (raw) => {
      const rec = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
      const inner =
        rec.data && typeof rec.data === 'object' ? (rec.data as Record<string, unknown>) : rec;
      const url = String(inner.pdfUrl ?? inner.downloadUrl ?? '');
      if (url) openSafeHttpUrl(url);
      else toast.message('PDF not available yet');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not download quote PDF')),
  });

  const changesRequested = isChangesRequestedStatus(status);
  const canSend = canAdminSendQuote(status);
  const canResend = !editable && status.length > 0;
  const canExtend = ['PENDING', 'REVISED', 'DRAFT', 'SENT'].includes(status.toUpperCase());

  // NL-BUG-UI-016: invalid quote id must show an explicit empty/error state, not a blank shell.
  if (q.isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/quotes"
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          ← All quotes
        </Link>
        <AdminQueryState isLoading error={null}>
          {null}
        </AdminQueryState>
      </div>
    );
  }

  if (q.isError || !record.id) {
    return (
      <div className="space-y-6">
        <Link
          href="/quotes"
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          ← All quotes
        </Link>
        <PageHeader
          pretitle="Operations"
          title="Quote not found"
          description="This quote id does not exist or is no longer available."
        />
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {q.isError ? getApiErrorMessage(q.error, 'Quote not found') : 'No quote matched this id.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="Operations"
        title={String(record.title ?? 'Quote')}
        description={
          changesRequested
            ? 'The client requested changes to this quote. Revise pricing and terms, then resend.'
            : 'Review pricing, edit draft quotes, and send to the client when ready.'
        }
        actions={
          <StatusBadge variant={changesRequested ? 'warning' : editable ? 'warning' : 'neutral'}>
            {status.replace(/_/g, ' ')}
          </StatusBadge>
        }
      />

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/quotes" className="font-medium text-primary hover:underline">
          ← All quotes
        </Link>
        {requestId ? (
          <Link
            href={`/requests/${encodeURIComponent(requestId)}`}
            className="font-medium text-primary hover:underline"
          >
            View source request →
          </Link>
        ) : null}
      </div>

      <AdminQueryState isLoading={q.isLoading} error={q.error}>
        {editable && requestId ? (
          <div className="mb-4 rounded-xl border border-primary/25 bg-primary/10 px-5 py-4">
            <p className="text-sm text-foreground">
              <strong>Tip:</strong> For multi-phase quotes, use the request quote editor — client
              brief stays visible beside the full-width workspace.
            </p>
            <Button className="mt-3" size="sm" asChild>
              <Link href={`/requests/${encodeURIComponent(requestId)}/quote/edit`}>
                Open quote editor with client brief →
              </Link>
            </Button>
          </div>
        ) : null}
        {editable ? (
          <div className="space-y-4">
            <AdminEditQuoteForm
              variant="fullscreen"
              quoteId={quoteId}
              onSaved={() => void qc.invalidateQueries({ queryKey: adminKeys.quote(quoteId) })}
              onSend={canSend ? () => sendM.mutate() : undefined}
              sendPending={sendM.isPending}
            />
            <QuoteHistoryPanel quoteId={quoteId} />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="ge-card rounded-lg border border-border/70 bg-card p-5 lg:col-span-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Overview
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Total</dt>
                  <dd className="text-xl font-semibold tabular-nums">
                    {typeof record.totalAmount === 'number'
                      ? formatMoneyFromPaise(Number(record.totalAmount), currency)
                      : '—'}
                  </dd>
                </div>
                {typeof record.subtotal === 'number' ? (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="tabular-nums">
                      {formatMoneyFromPaise(Number(record.subtotal), currency)}
                    </dd>
                  </div>
                ) : null}
                {typeof record.taxPercentage === 'number' ? (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tax</dt>
                    <dd>
                      {record.taxPercentage}% (
                      {typeof record.taxAmount === 'number'
                        ? formatMoneyFromPaise(Number(record.taxAmount), currency)
                        : '—'}
                      )
                    </dd>
                  </div>
                ) : null}
                {record.validUntil ? (
                  <div>
                    <dt className="text-muted-foreground">Valid until</dt>
                    <dd>{formatIsoDate(String(record.validUntil), 'PP')}</dd>
                  </div>
                ) : null}
                {record.createdAt ? (
                  <div>
                    <dt className="text-muted-foreground">Created</dt>
                    <dd>{formatIsoDate(String(record.createdAt), 'PPp')}</dd>
                  </div>
                ) : null}
              </dl>
              {record.description ? (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {String(record.description)}
                </p>
              ) : null}
            </section>

            <div className="lg:col-span-2">
              <div className="space-y-4">
                <section className="ge-card rounded-lg border border-border/70 bg-muted/20 p-6">
                  <h3 className="font-semibold">Quote is read-only</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sent or finalized quotes cannot be edited. Resend to the client or duplicate to
                    start a new draft.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
                      disabled={pdfM.isPending}
                      onClick={() => pdfM.mutate()}
                    >
                      {pdfM.isPending ? 'Preparing PDF…' : 'Download quote PDF'}
                    </button>
                    {canResend ? (
                      <button
                        type="button"
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
                        disabled={resendM.isPending}
                        onClick={() => resendM.mutate()}
                      >
                        {resendM.isPending ? 'Resending…' : 'Resend to client'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
                      disabled={duplicateM.isPending}
                      onClick={() => duplicateM.mutate()}
                    >
                      {duplicateM.isPending ? 'Duplicating…' : 'Duplicate quote'}
                    </button>
                    {canExtend ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={extendM.isPending}
                        onClick={() => extendM.mutate()}
                      >
                        {extendM.isPending ? 'Extending…' : 'Extend validity (+14 days)'}
                      </Button>
                    ) : null}
                  </div>
                </section>

                <QuoteHistoryPanel quoteId={quoteId} />
              </div>
            </div>
          </div>
        )}
      </AdminQueryState>

      {!editable ? (
        <LiveAdminQuoteDocumentsPanel quoteId={quoteId} enabled={Boolean(q.data)} />
      ) : null}
    </div>
  );
}
