'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { formatIsoDate, openSafeHttpUrl } from '@nestlancer/utils';
import { Button, ErrorState, StatusBadge } from '@nestlancer/ui';

import {
  GeCard,
  GeCardHeader,
  GePageHeader as PageHeader,
} from '@/components/admin/AdminGentelellaUI';
import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { DebugApiSection } from '@/components/admin/AdminDataViews';
import { AdminMetricStrip } from '@/components/admin/AdminPageChrome';
import { LiveAdminPaymentDocumentsPanel } from '@/features/documents/components/LiveAdminPaymentDocumentsPanel';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRecord, pickAdminRows } from '@/lib/admin-response';
import { resolvePaymentStatusVariant } from '@/lib/admin-status';
import { apiServices } from '@/lib/axios';

import { PaymentRefundModal } from './PaymentRefundModal';
import { formatAdminCurrency, formatPaymentStatusLabel } from './payment-hub-utils';

function clientLabel(client: Record<string, unknown> | undefined): string {
  if (!client) return '—';
  const name = [client.firstName, client.lastName]
    .filter((x) => typeof x === 'string' && x)
    .join(' ');
  const email = typeof client.email === 'string' ? client.email : '';
  if (name && email) return `${name} (${email})`;
  return name || email || '—';
}

function DetailFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  );
}

export function PaymentDetailClient({ paymentId }: { paymentId: string }) {
  const qc = useQueryClient();
  const [refundOpen, setRefundOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const detailQ = useQuery({
    queryKey: adminKeys.payment(paymentId),
    queryFn: () => apiServices.admin.getAdminPaymentDetail(paymentId),
  });

  const timelineQ = useQuery({
    queryKey: [...adminKeys.payment(paymentId), 'timeline'],
    queryFn: () => apiServices.admin.getAdminPaymentTimeline(paymentId),
  });

  const transactionsQ = useQuery({
    queryKey: [...adminKeys.payment(paymentId), 'transactions'],
    queryFn: () => apiServices.admin.getAdminPaymentTransactions(paymentId),
  });

  const record = pickAdminRecord(detailQ.data) ?? {};
  const client = record.client as Record<string, unknown> | undefined;
  const project = record.project as Record<string, unknown> | undefined;
  const milestone = record.milestone as Record<string, unknown> | undefined;

  const timelineEvents = useMemo(() => {
    const timelineRec = pickAdminRecord(timelineQ.data);
    const events = timelineRec?.events;
    if (Array.isArray(events)) return events as Record<string, unknown>[];
    return pickAdminRows(timelineQ.data);
  }, [timelineQ.data]);

  const transactionRows = useMemo(() => {
    const txRec = pickAdminRecord(transactionsQ.data);
    const txs = txRec?.transactions;
    if (Array.isArray(txs)) return txs as Record<string, unknown>[];
    return pickAdminRows(transactionsQ.data);
  }, [transactionsQ.data]);

  const status = String(record.status ?? '—');
  const amount = record.amount;
  const currency = record.currency ?? 'INR';
  const canRefund = ['COMPLETED', 'completed'].includes(status);
  const canVerify = ['PENDING', 'PROCESSING', 'pending', 'processing'].includes(status);
  const canApproveTransfer = ['PENDING_VERIFICATION', 'pending_verification'].includes(status);

  const verifyM = useMutation({
    mutationFn: () => apiServices.admin.verifyPayment(paymentId, {}),
    onSuccess: (result) => {
      const data = (result as { data?: { verified?: boolean; alreadyCompleted?: boolean } })?.data;
      if (data?.verified === false) {
        toast.error('Gateway has not captured this payment yet');
      } else {
        toast.success(data?.alreadyCompleted ? 'Payment already completed' : 'Payment verified');
      }
      void qc.invalidateQueries({ queryKey: adminKeys.payment(paymentId) });
      void qc.invalidateQueries({ queryKey: adminKeys.payments() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const approveTransferM = useMutation({
    mutationFn: () => apiServices.admin.approveTransfer(paymentId, {}),
    onSuccess: (result) => {
      const warn = (result as { data?: { duplicateUtrWarning?: string | null } })?.data
        ?.duplicateUtrWarning;
      toast.success(
        warn ? `Transfer approved (duplicate UTR warning: ${warn})` : 'Transfer approved'
      );
      void qc.invalidateQueries({ queryKey: adminKeys.payment(paymentId) });
      void qc.invalidateQueries({ queryKey: adminKeys.payments() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const rejectTransferM = useMutation({
    mutationFn: () =>
      apiServices.admin.rejectTransfer(paymentId, {
        reason: rejectReason.trim(),
        allowRetry: true,
      }),
    onSuccess: () => {
      toast.success('Transfer rejected — client can retry');
      setShowReject(false);
      setRejectReason('');
      void qc.invalidateQueries({ queryKey: adminKeys.payment(paymentId) });
      void qc.invalidateQueries({ queryKey: adminKeys.payments() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const proofs = Array.isArray(record.proofs) ? (record.proofs as { mediaId: string }[]) : [];
  const transferReference =
    typeof record.transferReference === 'string' ? record.transferReference : null;

  const metricItems = [
    { label: 'Amount', value: formatAdminCurrency(amount, currency) },
    { label: 'Method', value: String(record.method ?? record.provider ?? '—') },
    {
      label: 'Paid at',
      value:
        typeof record.paidAt === 'string'
          ? formatIsoDate(record.paidAt, 'PPp')
          : typeof record.createdAt === 'string'
            ? formatIsoDate(record.createdAt, 'PPp')
            : '—',
    },
    { label: 'Transactions', value: String(transactionRows.length) },
  ];

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/payments" className="font-medium text-primary hover:underline">
          ← Back to payments
        </Link>
      </nav>

      <PageHeader
        pretitle="Operations"
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xl">Payment {paymentId.slice(0, 10)}…</span>
            <StatusBadge variant={resolvePaymentStatusVariant(status)} dot>
              {formatPaymentStatusLabel(status)}
            </StatusBadge>
          </span>
        }
        description={formatAdminCurrency(amount, currency)}
        actions={
          <div className="flex flex-wrap gap-2">
            {canApproveTransfer ? (
              <>
                <Button
                  size="sm"
                  disabled={approveTransferM.isPending}
                  onClick={() => approveTransferM.mutate()}
                >
                  {approveTransferM.isPending ? 'Approving…' : 'Approve transfer'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowReject((v) => !v)}>
                  Reject transfer
                </Button>
              </>
            ) : null}
            {canVerify ? (
              <Button size="sm" disabled={verifyM.isPending} onClick={() => verifyM.mutate()}>
                {verifyM.isPending ? 'Verifying…' : 'Verify payment'}
              </Button>
            ) : null}
            {canRefund ? (
              <Button size="sm" variant="outline" onClick={() => setRefundOpen(true)}>
                Refund
              </Button>
            ) : null}
          </div>
        }
      />

      {showReject ? (
        <GeCard>
          <GeCardHeader title="Reject offline transfer" subtitle="Client will be notified" />
          <div className="ge-card-body space-y-3 border-t border-border">
            <textarea
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              rows={3}
              placeholder="e.g. UTR does not match the amount"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <Button
              size="sm"
              disabled={!rejectReason.trim() || rejectTransferM.isPending}
              onClick={() => rejectTransferM.mutate()}
            >
              {rejectTransferM.isPending ? 'Rejecting…' : 'Confirm reject'}
            </Button>
          </div>
        </GeCard>
      ) : null}

      {refundOpen ? (
        <PaymentRefundModal
          paymentId={paymentId}
          amount={amount}
          currency={currency}
          onClose={() => setRefundOpen(false)}
        />
      ) : null}

      <AdminQueryState isLoading={detailQ.isLoading} error={detailQ.error}>
        <AdminMetricStrip items={metricItems} max={4} />

        <GeCard flush>
          <GeCardHeader title="Payment summary" subtitle="Client, project, and milestone context" />
          <div className="ge-card-body border-t border-border">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailFact label="Project">
                {project && typeof project.id === 'string' ? (
                  <Link
                    href={`/payments/projects/${encodeURIComponent(project.id)}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {String(project.title ?? project.id)}
                  </Link>
                ) : (
                  '—'
                )}
              </DetailFact>
              <DetailFact label="Client">
                {client && typeof client.id === 'string' ? (
                  <Link
                    href={`/users/${encodeURIComponent(client.id)}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {clientLabel(client)}
                  </Link>
                ) : (
                  clientLabel(client)
                )}
              </DetailFact>
              <DetailFact label="Milestone">
                {milestone ? String(milestone.name ?? milestone.id ?? '—') : '—'}
              </DetailFact>
              <DetailFact label="Payment ID">
                <span className="font-mono text-xs">{paymentId}</span>
              </DetailFact>
              {transferReference ? (
                <DetailFact label="Transfer reference (UTR)">
                  <span className="font-mono text-xs">{transferReference}</span>
                </DetailFact>
              ) : null}
            </dl>
            {proofs.length > 0 ? (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Transfer proofs
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {proofs.map((p) => (
                    <li key={p.mediaId}>
                      <button
                        type="button"
                        className="font-mono text-primary hover:underline"
                        onClick={async () => {
                          try {
                            const url = await apiServices.mediaAdmin.downloadUrl(p.mediaId);
                            if (url) openSafeHttpUrl(url);
                            else toast.error('Could not open proof');
                          } catch (e) {
                            toast.error(getApiErrorMessage(e, 'Could not open proof'));
                          }
                        }}
                      >
                        Open proof {p.mediaId.slice(0, 8)}…
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </GeCard>

        <div className="grid gap-6 lg:grid-cols-3">
          <GeCard className="lg:col-span-1">
            <GeCardHeader title="Documents" subtitle="Invoice, receipt, and versions" />
            <div className="ge-card-body border-t border-border">
              <LiveAdminPaymentDocumentsPanel paymentId={paymentId} />
            </div>
          </GeCard>

          <GeCard flush className="lg:col-span-2">
            <GeCardHeader title="Payment timeline" subtitle="Audit events for this transaction" />
            <div className="ge-card-body border-t border-border">
              {timelineQ.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading timeline…</p>
              ) : null}
              {timelineQ.error ? (
                <ErrorState
                  message={getApiErrorMessage(timelineQ.error, 'Could not load timeline')}
                  onRetry={() => void timelineQ.refetch()}
                />
              ) : null}
              {!timelineQ.isLoading && !timelineQ.error && timelineEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No timeline events recorded.</p>
              ) : null}
              {!timelineQ.isLoading && !timelineQ.error && timelineEvents.length > 0 ? (
                <ol className="relative space-y-0 border-l-2 border-primary/20 pl-6">
                  {timelineEvents.map((event, i) => (
                    <li key={String(event.id ?? i)} className="relative pb-5 last:pb-0">
                      <span
                        className="absolute -left-[1.4rem] top-1 flex h-3 w-3 rounded-full border-2 border-card bg-primary"
                        aria-hidden
                      />
                      <p className="font-medium text-foreground">
                        {String(event.action ?? event.title ?? 'Event')}
                      </p>
                      {event.description ? (
                        <p className="text-sm text-muted-foreground">{String(event.description)}</p>
                      ) : null}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {typeof event.createdAt === 'string'
                          ? formatIsoDate(event.createdAt, 'PPp')
                          : typeof event.timestamp === 'string'
                            ? formatIsoDate(event.timestamp, 'PPp')
                            : '—'}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          </GeCard>
        </div>

        <GeCard flush>
          <GeCardHeader title="Transaction history" subtitle="Captures and refunds" />
          <div className="max-h-80 overflow-auto border-t border-border">
            {transactionsQ.isLoading ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Loading transactions…</p>
            ) : null}
            {!transactionsQ.isLoading && transactionRows.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No related transactions.</p>
            ) : null}
            {!transactionsQ.isLoading && transactionRows.length > 0 ? (
              <table className="ge-table">
                <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
                  <tr>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionRows.map((row, i) => (
                    <tr key={String(row.id ?? i)}>
                      <td className="font-medium capitalize">
                        {String(row.kind ?? row.type ?? '—')}
                      </td>
                      <td className="tabular-nums">{formatAdminCurrency(row.amount, currency)}</td>
                      <td>
                        <StatusBadge
                          variant={resolvePaymentStatusVariant(String(row.status ?? ''))}
                          dot
                        >
                          {formatPaymentStatusLabel(String(row.status ?? '—'))}
                        </StatusBadge>
                      </td>
                      <td className="whitespace-nowrap text-muted-foreground">
                        {typeof row.paidAt === 'string'
                          ? formatIsoDate(row.paidAt, 'PPp')
                          : typeof row.createdAt === 'string'
                            ? formatIsoDate(row.createdAt, 'PPp')
                            : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </GeCard>
      </AdminQueryState>

      <DebugApiSection
        payloads={{
          payment: detailQ.data,
          timeline: timelineQ.data,
          transactions: transactionsQ.data,
        }}
      />
    </div>
  );
}
