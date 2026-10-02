'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, Hash, Receipt } from '@nestlancer/ui/icons';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys, routes } from '@nestlancer/constants';
import type { Payment } from '@nestlancer/types';
import { cn } from '@nestlancer/ui';
import { formatMoneyFromPaise, openSafeHttpUrl } from '@nestlancer/utils';

import { FormFieldLabel } from '@nestlancer/field-help';

import {
  Button,
  ErrorState,
  PageHeader,
  Skeleton,
  SkeletonText,
  StatusBadge,
} from '@nestlancer/ui';
import { StatusPill } from '@/components/common/StatusPill';
import { apiServices } from '@/lib/axios';
import { invalidateByAction } from '@/lib/invalidate-queries';

import { useWebConfirm } from '@/components/web/WebConfirmProvider';
import { webPanelClass, webPrimaryButtonClass } from '@/lib/tailadmin-classes';

import { LivePaymentDocumentsPanel } from '@/features/documents/components/LivePaymentDocumentsPanel';

import { DevTestPaymentHint } from './components/DevTestPaymentHint';
import { PaymentCheckoutPanel } from './components/PaymentCheckoutPanel';
import { PaymentStatusTimeline } from './components/PaymentStatusTimeline';
import { useProjectMilestonesQuery } from './hooks/usePaymentsApi';
import { buildPaymentMilestoneMap } from './lib/payment-milestone-map';
import { formatPaymentStatusLabel, paymentStatusBadgeVariant } from './payment-status-utils';
import { paymentsDebug, paymentsDebugError } from './payments-debug';

const PAYABLE_STATUSES = new Set(['pending', 'created', 'failed']);

const DEFAULT_GATE_MESSAGE =
  'Payment is available after you approve the milestone or when the studio requests payment.';

type PaymentRefund = {
  id: string;
  amount: number;
  currency?: string;
  type?: string;
  reason?: string | null;
  status?: string;
  processedAt?: string | null;
  createdAt?: string;
};

type PaymentWithRelations = Payment & {
  milestoneId?: string;
  amountRefunded?: number;
  refundStatus?: string | null;
  refunds?: PaymentRefund[];
  paymentRequestedAt?: string | Date | null;
  canPay?: boolean;
  invoiceNumber?: string | null;
  project?: { title?: string };
  milestone?: { name?: string; status?: string };
};

export function PaymentDetailClient({ id }: { id: string }) {
  const confirm = useWebConfirm();
  const qc = useQueryClient();
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');

  const q = useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: async () => {
      paymentsDebug('detail:fetch', { paymentId: id });
      const result = await apiServices.payments.getById(id);
      paymentsDebug('detail:response', {
        paymentId: id,
        status: (result as PaymentWithRelations)?.status,
        amount: (result as PaymentWithRelations)?.amount,
        amountRefunded: (result as PaymentWithRelations)?.amountRefunded,
        refundCount: Array.isArray((result as PaymentWithRelations)?.refunds)
          ? (result as PaymentWithRelations).refunds?.length
          : 0,
      });
      return result;
    },
  });

  const paymentPreview = q.data as PaymentWithRelations | undefined;
  const projectIdForGate = paymentPreview?.projectId;
  const milestoneIdForGate = paymentPreview?.milestoneId;
  const milestonesQ = useProjectMilestonesQuery(
    projectIdForGate ?? '',
    Boolean(projectIdForGate && milestoneIdForGate)
  );
  const milestoneMetaById = useMemo(
    () => buildPaymentMilestoneMap(milestonesQ.data),
    [milestonesQ.data]
  );

  useEffect(() => {
    if (q.isError) {
      paymentsDebugError('detail:error', q.error, { paymentId: id });
    }
  }, [q.isError, q.error, id]);

  useEffect(() => {
    if (!q.data) return;
    const payment = q.data as PaymentWithRelations;
    const paymentStatus = String(payment.status).toLowerCase();
    const paymentRefunds = Array.isArray(payment.refunds) ? payment.refunds : [];
    const refundedAmount = typeof payment.amountRefunded === 'number' ? payment.amountRefunded : 0;
    const milestoneMeta = payment.milestoneId
      ? milestoneMetaById.get(payment.milestoneId)
      : undefined;
    const statusPayable =
      PAYABLE_STATUSES.has(paymentStatus) && Boolean(payment.projectId && payment.amount > 0);
    const gateOpen = !payment.milestoneId || milestonesQ.isError || milestoneMeta?.canPay === true;
    paymentsDebug('detail:state', {
      paymentId: id,
      status: paymentStatus,
      canPay: statusPayable && gateOpen,
      milestoneCanPay: milestoneMeta?.canPay ?? null,
      canCancel: paymentStatus === 'pending',
      amountRefunded: refundedAmount,
      refundCount: paymentRefunds.length,
      hasRefundActivity:
        paymentStatus.includes('refund') || refundedAmount > 0 || paymentRefunds.length > 0,
    });
  }, [q.data, id, milestoneMetaById, milestonesQ.isError]);

  const cancelM = useMutation({
    mutationFn: () => {
      paymentsDebug('cancel:submit', { paymentId: id });
      return apiServices.payments.cancel(id);
    },
    onSuccess: async () => {
      paymentsDebug('cancel:success', { paymentId: id });
      toast.success('Payment cancelled');
      await invalidateByAction(qc, 'payments.cancel', id);
    },
    onError: (e) => {
      paymentsDebugError('cancel:error', e, { paymentId: id });
      toast.error(getApiErrorMessage(e, 'Could not cancel payment'));
    },
  });

  const disputeM = useMutation({
    mutationFn: () => {
      paymentsDebug('dispute:submit', { paymentId: id, reason: disputeReason.trim() });
      return apiServices.payments.fileDispute(id, {
        reason: disputeReason.trim(),
        description: disputeDescription.trim() || disputeReason.trim(),
      });
    },
    onSuccess: async () => {
      paymentsDebug('dispute:success', { paymentId: id });
      toast.success('Dispute submitted');
      setShowDispute(false);
      setDisputeReason('');
      setDisputeDescription('');
      await invalidateByAction(qc, 'payments.dispute', id);
    },
    onError: (e) => {
      paymentsDebugError('dispute:error', e, { paymentId: id });
      toast.error(getApiErrorMessage(e, 'Could not file dispute'));
    },
  });

  async function openReceipt() {
    paymentsDebug('receipt:open', { paymentId: id });
    const url = await apiServices.payments.getReceiptUrl(id);
    paymentsDebug('receipt:url', { paymentId: id, hasUrl: Boolean(url) });
    if (url) openSafeHttpUrl(url);
    else toast.message('Receipt not available yet');
  }

  async function openInvoice() {
    paymentsDebug('invoice:open', { paymentId: id });
    const url = await apiServices.payments.getInvoiceUrl(id);
    paymentsDebug('invoice:url', { paymentId: id, hasUrl: Boolean(url) });
    if (url) openSafeHttpUrl(url);
    else toast.message('Invoice not available yet');
  }

  if (q.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <SkeletonText lines={2} />
        <div className="grid gap-8 lg:grid-cols-5">
          <Skeleton className="h-96 rounded-3xl lg:col-span-3" />
          <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (q.isError) {
    return (
      <ErrorState
        title="Could not load payment"
        message={getApiErrorMessage(q.error, 'Could not load payment')}
        onRetry={() => void q.refetch()}
      />
    );
  }

  const p = q.data as PaymentWithRelations;
  const status = String(p.status).toLowerCase();
  const statusPayable = PAYABLE_STATUSES.has(status) && Boolean(p.projectId && p.amount > 0);
  const milestoneMeta = p.milestoneId ? milestoneMetaById.get(p.milestoneId) : undefined;
  const eligibilityPending =
    statusPayable && Boolean(p.milestoneId) && milestonesQ.isPending && !milestonesQ.isError;
  // Prefer payment.canPay from detail API (same rules as list); fall back to milestones map.
  const gateOpen =
    typeof p.canPay === 'boolean'
      ? p.canPay
      : !p.milestoneId || milestonesQ.isError || milestoneMeta?.canPay === true;
  const canPay = statusPayable && !eligibilityPending && gateOpen;
  const notDueYet = statusPayable && !canPay && !eligibilityPending;
  const gateMessage = eligibilityPending
    ? 'Checking whether this installment is ready for checkout…'
    : statusPayable && !gateOpen
      ? milestoneMeta?.lockReason?.trim() || DEFAULT_GATE_MESSAGE
      : null;
  const canCancel = status === 'pending';
  const refunds = Array.isArray(p.refunds) ? p.refunds : [];
  const amountRefunded = typeof p.amountRefunded === 'number' ? p.amountRefunded : 0;
  const hasRefundActivity = status.includes('refund') || amountRefunded > 0 || refunds.length > 0;
  const statusLabel = formatPaymentStatusLabel(String(p.status), {
    canPay: notDueYet ? false : canPay || undefined,
  });
  const isPaid = ['completed', 'paid', 'success'].includes(status) || status.includes('refund');
  const canDownloadInvoice =
    !notDueYet && (canPay || isPaid || status === 'processing' || status.includes('verification'));
  const canDownloadReceipt = isPaid;
  // Async document worker lag: COMPLETED payment with no invoiceNumber yet.
  const invoiceGenerating = isPaid && !p.invoiceNumber;

  return (
    <div className="space-y-8">
      <Link
        href={routes.payments}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to payments
      </Link>

      <PageHeader
        title={notDueYet ? 'Payment details' : canPay ? 'Checkout' : 'Payment details'}
        description={
          notDueYet
            ? 'This installment is not due yet. Checkout unlocks after you approve delivery or when the studio requests payment.'
            : canPay
              ? "Review your order, then complete payment through Razorpay's secure gateway."
              : 'Review this payment and related documents.'
        }
        actions={
          <StatusBadge
            variant={paymentStatusBadgeVariant(String(p.status), {
              canPay: notDueYet ? false : canPay || undefined,
            })}
            className="text-sm"
          >
            {statusLabel}
          </StatusBadge>
        }
      />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PaymentCheckoutPanel
            amount={p.amount}
            currency={p.currency}
            status={String(p.status)}
            statusLabel={statusLabel}
            projectId={p.projectId}
            milestoneId={p.milestoneId}
            projectTitle={p.project?.title}
            milestoneName={p.milestone?.name}
            paymentId={p.id}
            createdAt={p.createdAt}
            canPay={canPay}
            gateMessage={gateMessage}
            canCancel={canCancel}
            cancelPending={cancelM.isPending}
            onCancel={async () => {
              if (
                await confirm({
                  title: 'Cancel this pending payment?',
                  destructive: true,
                })
              ) {
                cancelM.mutate();
              }
            }}
            onPaySuccess={() => void invalidateByAction(qc, 'payments.confirm', id, p.projectId)}
            onOpenReceipt={canDownloadReceipt ? () => void openReceipt() : undefined}
            onOpenInvoice={canDownloadInvoice ? () => void openInvoice() : undefined}
          />
        </div>

        <aside className="space-y-4 lg:col-span-2">
          <div className={cn(webPanelClass, 'p-5')}>
            <h3 className="font-display text-sm font-semibold text-foreground">Status</h3>
            <div className="mt-4">
              <PaymentStatusTimeline
                status={String(p.status)}
                canPay={notDueYet ? false : canPay || undefined}
              />
            </div>
            {canCancel ? (
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                disabled={cancelM.isPending}
                onClick={async () => {
                  if (
                    await confirm({
                      title: 'Cancel this pending payment?',
                      description:
                        'You can create a new payment later if you still need to complete checkout.',
                      destructive: true,
                    })
                  ) {
                    cancelM.mutate();
                  }
                }}
              >
                {cancelM.isPending ? 'Cancelling…' : 'Cancel pending payment'}
              </Button>
            ) : null}
          </div>

          <div className={cn(webPanelClass, 'p-5')}>
            <h3 className="font-display text-sm font-semibold text-foreground">Payment details</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <DetailRow
                icon={Hash}
                label="Payment ID"
                value={<span className="select-all break-all">{p.id}</span>}
                mono
              />
              {p.projectId ? (
                <DetailRow
                  label="Project"
                  value={
                    p.project?.title ? (
                      <Link
                        href={routes.project(p.projectId)}
                        className="text-primary hover:underline"
                      >
                        {p.project.title}
                      </Link>
                    ) : (
                      p.projectId.slice(0, 12) + '…'
                    )
                  }
                />
              ) : null}
              <DetailRow
                icon={Calendar}
                label="Created"
                value={p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}
              />
            </dl>
          </div>

          {canPay ? <DevTestPaymentHint /> : null}

          {hasRefundActivity ? (
            <div className={cn(webPanelClass, 'p-5')}>
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-sky-600" aria-hidden />
                <h3 className="font-display text-sm font-semibold text-foreground">
                  Refund details
                </h3>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                {amountRefunded > 0 ? (
                  <DetailRow
                    label="Amount refunded"
                    value={formatMoneyFromPaise(amountRefunded, p.currency ?? 'INR', 'en-IN')}
                  />
                ) : null}
                {p.refundStatus ? (
                  <DetailRow label="Refund status" value={p.refundStatus.replace(/_/g, ' ')} />
                ) : null}
              </dl>
              {refunds.length > 0 ? (
                <ul className="mt-4 space-y-3 border-t border-border pt-4">
                  {refunds.map((refund) => (
                    <li
                      key={refund.id}
                      className="rounded-xl border border-border/70 bg-muted/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {formatMoneyFromPaise(
                              refund.amount,
                              refund.currency ?? p.currency ?? 'INR',
                              'en-IN'
                            )}
                          </p>
                          {refund.reason ? (
                            <p className="mt-1 text-xs text-muted-foreground">{refund.reason}</p>
                          ) : null}
                        </div>
                        {refund.status ? (
                          <StatusPill status={refund.status} className="text-xs" />
                        ) : null}
                      </div>
                      {refund.processedAt || refund.createdAt ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {refund.processedAt
                            ? `Processed ${new Date(refund.processedAt).toLocaleString()}`
                            : `Created ${new Date(refund.createdAt ?? '').toLocaleString()}`}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  A refund has been initiated for this payment. Contact support if you have
                  questions.
                </p>
              )}
            </div>
          ) : null}

          {['completed', 'failed'].includes(status) ? (
            <div className="rounded-2xl border border-border bg-card/40 p-4">
              {!showDispute ? (
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() => setShowDispute(true)}
                >
                  File a payment dispute
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Payment dispute</p>
                  <div className="space-y-2">
                    <FormFieldLabel fieldKey="payments.disputeReason" label="Dispute reason">
                      Reason
                    </FormFieldLabel>
                    <input
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="e.g. Charged twice for the same milestone"
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <FormFieldLabel fieldKey="payments.disputeDetails" label="Dispute details">
                      Details
                    </FormFieldLabel>
                    <textarea
                      className="min-h-[72px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      placeholder="Dates, UTR, and what you expected instead"
                      value={disputeDescription}
                      onChange={(e) => setDisputeDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className={webPrimaryButtonClass}
                      disabled={!disputeReason.trim() || disputeM.isPending}
                      onClick={() => disputeM.mutate()}
                    >
                      {disputeM.isPending ? 'Submitting…' : 'Submit dispute'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowDispute(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {canPay ? (
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-5 py-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How checkout works</p>
              <ol className="mt-2 list-inside list-decimal space-y-1.5 text-xs leading-relaxed">
                <li>We create a Razorpay order for this milestone amount.</li>
                <li>
                  Use <strong className="text-foreground">Pay with UPI ID</strong> if you cannot
                  scan the QR code, or use card / netbanking in the full checkout.
                </li>
                <li>Pay the scheduled milestone installment when the studio requests payment.</li>
              </ol>
            </div>
          ) : null}
        </aside>
      </div>

      <LivePaymentDocumentsPanel
        paymentId={id}
        showInvoice={canDownloadInvoice}
        showReceipt={canDownloadReceipt}
        enabled={canDownloadInvoice || canDownloadReceipt}
        invoiceGenerating={invoiceGenerating}
      />
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon?: typeof Hash;
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-3">
      {Icon ? (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <span className="w-4 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd
          className={cn(
            'mt-0.5 font-medium text-foreground',
            mono && 'break-all font-mono text-xs'
          )}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}
