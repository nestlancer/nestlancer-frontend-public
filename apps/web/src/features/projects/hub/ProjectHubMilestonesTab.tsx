'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Circle, Lock } from '@nestlancer/ui/icons';
import { useState } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, EmptyState, ErrorState, StatusBadge, cn } from '@nestlancer/ui';

import { TabPanelSkeleton } from '@/components/common/TabPanelSkeleton';
import { WebPanel } from '@/components/web/WebPanel';
import { formatMoneyFromPaise } from '@nestlancer/utils';

import { PaymentCheckoutLink } from '@/features/payments/components/PaymentCheckoutLink';
import { buildClientMilestoneDisplayRows } from '@/features/payments/lib/client-milestone-display';
import { buildPaymentMilestoneMap } from '@/features/payments/lib/payment-milestone-map';
import { apiServices } from '@/lib/axios';
import { invalidateByAction } from '@/lib/invalidate-queries';
import type { MilestoneRow } from '@/lib/client-api-view';
import { webPrimaryButtonClass } from '@/lib/tailadmin-classes';
import {
  canRequestPrePaymentRevision,
  canReviewMilestone,
  formatMilestonePaymentStatusLabel,
  formatMilestoneStatusLabel,
  isMilestoneFullyApproved,
  isMilestonePayable,
  milestonePaymentStatusBadgeVariant,
  milestoneStatusBadgeVariant,
  normalizeMilestoneStatus,
} from '@/lib/milestone-status';

function milestoneDotClass(status: string | undefined): string {
  const s = normalizeMilestoneStatus(status);
  if (s === 'APPROVED') {
    return cn(webPrimaryButtonClass, 'shadow-theme-xs');
  }
  if (s === 'COMPLETED') {
    return 'bg-sky-500 text-white ring-2 ring-sky-500/30';
  }
  if (s === 'IN_PROGRESS' || s === 'REVIEW') {
    return 'bg-primary text-primary-foreground ring-2 ring-primary/30';
  }
  if (s === 'PENDING') {
    return 'border-2 border-border bg-muted text-muted-foreground';
  }
  return 'border-2 border-border bg-white text-muted-foreground dark:bg-white/[0.03]';
}

function milestoneStepHint(
  deliveryStatus: string | undefined,
  paymentStatus: string | undefined,
  opts: {
    order: number;
    isDeposit?: boolean;
    isPayOnly?: boolean;
    canPay?: boolean;
    hasLinkedInstallment?: boolean;
    paymentRequestedAt?: string | null;
  }
): string | null {
  const delivery = normalizeMilestoneStatus(deliveryStatus);
  const payment = normalizeMilestoneStatus(paymentStatus);
  const isDeposit = opts.isDeposit ?? opts.order <= 1;
  const installmentDue =
    opts.canPay === true ||
    (Boolean(opts.paymentRequestedAt) && payment === 'CREATED' && opts.canPay !== false);

  if (isDeposit && payment === 'COMPLETED') {
    return 'Deposit received. Delivery work continues on the project milestones below.';
  }
  if (delivery === 'APPROVED' && payment === 'COMPLETED') {
    return 'Delivery approved and payment received.';
  }
  if (delivery === 'COMPLETED' && payment === 'COMPLETED') {
    return 'Payment received. Review the deliverables and approve when ready.';
  }
  if (delivery === 'IN_PROGRESS' && payment === 'COMPLETED') {
    return 'Payment received. Our team is working on this milestone.';
  }
  if (delivery === 'IN_PROGRESS' && isDeposit && payment !== 'COMPLETED') {
    return 'Complete the deposit payment to start work on this project.';
  }
  // Linked Mid/Final (pay-only) can be due before delivery approval — match Billing.
  if (
    !isDeposit &&
    installmentDue &&
    payment !== 'COMPLETED' &&
    (opts.isPayOnly || opts.hasLinkedInstallment)
  ) {
    return 'Payment has been requested — complete checkout from Billing when ready.';
  }
  if (delivery === 'PENDING' && !isDeposit && payment !== 'COMPLETED' && !installmentDue) {
    return 'This payment becomes due after you approve delivery for this milestone.';
  }
  if (delivery === 'REVISION_REQUESTED') {
    return 'Revision in progress. You will be notified when it is ready for review again.';
  }
  if (delivery === 'APPROVED' && payment !== 'COMPLETED' && payment) {
    return 'Pay the installment or request changes before work continues on later milestones.';
  }
  return null;
}

export function ProjectHubMilestonesTab({
  projectId,
  rows,
  isPending,
  isError,
  errorMessage,
}: {
  projectId: string;
  rows: MilestoneRow[];
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
}) {
  const qc = useQueryClient();
  const [revisionTarget, setRevisionTarget] = useState<string | null>(null);
  const [revisionReason, setRevisionReason] = useState('');

  const paymentMilestones = useQuery({
    queryKey: [...queryKeys.projects.milestones(projectId), 'payment-milestones'],
    queryFn: () => apiServices.payments.listMilestonesByProject(projectId),
    enabled: Boolean(projectId),
  });
  const paymentMetaByMilestone = buildPaymentMilestoneMap(paymentMilestones.data);
  const displayRows = buildClientMilestoneDisplayRows(rows, paymentMetaByMilestone);

  const approveMutation = useMutation({
    mutationFn: (milestoneId: string) => apiServices.progress.approveMilestone(milestoneId),
    onSuccess: async () => {
      toast.success('Milestone approved');
      await invalidateByAction(qc, 'progress.milestone', projectId);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not approve milestone')),
  });

  const revisionMutation = useMutation({
    mutationFn: ({ milestoneId, reason }: { milestoneId: string; reason: string }) =>
      apiServices.progress.requestMilestoneRevision(milestoneId, { reason }),
    onSuccess: async () => {
      toast.success('Revision request submitted');
      setRevisionTarget(null);
      setRevisionReason('');
      await invalidateByAction(qc, 'progress.milestone', projectId);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not submit revision')),
  });

  if (isPending) {
    return <TabPanelSkeleton variant="timeline" />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load milestones"
        message={errorMessage ?? 'Could not load milestones'}
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No milestones yet"
        description="Milestones will appear here once your project delivery plan is set up."
        icon={<Circle className="h-6 w-6" aria-hidden />}
      />
    );
  }

  return (
    <>
      {revisionTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <WebPanel padding="md" className="w-full max-w-md">
            <h2 className="text-sm font-semibold">Request changes</h2>
            <FormFieldLabel fieldKey="projects.revisionNotes" label="What should be revised">
              Describe what needs to change before you pay
            </FormFieldLabel>
            <textarea
              className="mt-4 w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              rows={4}
              placeholder="Explain what changes are needed…"
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRevisionTarget(null);
                  setRevisionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className={webPrimaryButtonClass}
                disabled={!revisionReason.trim() || revisionMutation.isPending}
                onClick={() =>
                  revisionMutation.mutate({
                    milestoneId: revisionTarget,
                    reason: revisionReason,
                  })
                }
              >
                {revisionMutation.isPending ? 'Submitting…' : 'Submit'}
              </Button>
            </div>
          </WebPanel>
        </div>
      ) : null}

      <ol className="relative space-y-0 pl-10" aria-label="Milestone stepper">
        <span className="absolute bottom-6 left-[15px] top-6 w-0.5 bg-border" aria-hidden />
        {displayRows.map((entry, index) => {
          const m = entry.row;
          const paymentMeta = entry.paymentMeta;
          const paymentStatus = paymentMeta?.paymentStatus;
          const isDeposit = entry.isDeposit;
          const isPayOnly = entry.isPayOnly;
          const fullyApproved = isMilestoneFullyApproved(m.status);
          const stepHint = milestoneStepHint(m.status, paymentStatus, {
            order: m.order,
            isDeposit,
            isPayOnly,
            canPay: entry.canPay,
            hasLinkedInstallment: Boolean(entry.linkedInstallmentLabel),
            paymentRequestedAt: paymentMeta?.paymentRequestedAt,
          });
          const showPaymentBadge = Boolean(paymentStatus) || (m.amount != null && m.amount > 0);
          const isLocked = entry.isLocked === true;

          return (
            <li key={m.id} className="relative pb-8 last:pb-0">
              <span
                className={cn(
                  'absolute -left-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                  isLocked
                    ? 'border-2 border-border bg-muted text-muted-foreground'
                    : milestoneDotClass(m.status)
                )}
                aria-hidden
              >
                {isLocked ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : fullyApproved ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </span>
              <WebPanel padding="md" className={cn('space-y-3', isLocked && 'opacity-70')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{m.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {m.amount != null && m.amount > 0 ? (
                        <span>
                          {formatMoneyFromPaise(
                            entry.linkedInstallmentLabel
                              ? (entry.payAmountPaise ?? m.amount)
                              : m.amount,
                            m.currency ?? 'INR'
                          )}
                        </span>
                      ) : null}
                      {m.due ? <span>Due {m.due}</span> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {m.status && !isPayOnly ? (
                      <StatusBadge variant={milestoneStatusBadgeVariant(m.status)} dot>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
                          Delivery
                        </span>
                        {formatMilestoneStatusLabel(m.status)}
                      </StatusBadge>
                    ) : null}
                    {showPaymentBadge ? (
                      <StatusBadge variant={milestonePaymentStatusBadgeVariant(paymentStatus)} dot>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
                          Payment
                        </span>
                        {formatMilestonePaymentStatusLabel(paymentStatus, {
                          order: m.order,
                          paymentRequestedAt: paymentMeta?.paymentRequestedAt,
                          isDeposit,
                          canPay: entry.canPay,
                        })}
                      </StatusBadge>
                    ) : null}
                  </div>
                </div>

                {entry.isPaidAndLocked ? (
                  <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    Payment received. This milestone is locked until the studio delivers the next
                    phase.
                  </p>
                ) : null}

                {isLocked && entry.lockReason ? (
                  <p className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    <Lock className="mr-1 inline h-3 w-3" aria-hidden />
                    {entry.lockReason}
                  </p>
                ) : null}

                {entry.linkedInstallmentLabel ? (
                  <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    {entry.linkedInstallmentInclusive
                      ? `Included in ${entry.linkedInstallmentLabel}`
                      : `Installment due: ${entry.linkedInstallmentLabel}`}
                  </p>
                ) : null}

                {stepHint ? (
                  <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    {stepHint}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {isMilestonePayable({
                    status: m.status,
                    amountPaise: entry.payAmountPaise ?? m.amount,
                    order: m.order,
                    paymentStatus: paymentMeta?.paymentStatus,
                    paymentRequestedAt: paymentMeta?.paymentRequestedAt,
                    isDeposit,
                    isPayOnly,
                    isLocked,
                    canPay: entry.canPay,
                  }) ? (
                    <PaymentCheckoutLink
                      projectId={projectId}
                      milestoneId={entry.payMilestoneId}
                      amount={entry.payAmountPaise ?? m.amount!}
                      currency={m.currency ?? 'INR'}
                      paymentId={paymentMeta?.paymentId}
                      label="Pay now"
                      variant="compact"
                      className={cn(
                        'h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold',
                        webPrimaryButtonClass
                      )}
                    />
                  ) : null}
                  {canReviewMilestone(m.status, {
                    isDeposit,
                    isPayOnly,
                    isLocked,
                    canReviewDelivery: entry.canReviewDelivery,
                  }) ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        className={webPrimaryButtonClass}
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(m.id)}
                      >
                        Approve delivery
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={revisionMutation.isPending}
                        onClick={() => setRevisionTarget(m.id)}
                      >
                        Request revision
                      </Button>
                    </>
                  ) : null}
                  {canRequestPrePaymentRevision({
                    isDeposit,
                    isPayOnly,
                    isLocked,
                    canRequestPrePaymentRevision: entry.canRequestPrePaymentRevision,
                  }) ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={revisionMutation.isPending}
                      onClick={() => setRevisionTarget(m.id)}
                    >
                      Request changes before paying
                    </Button>
                  ) : null}
                </div>
              </WebPanel>
            </li>
          );
        })}
      </ol>
    </>
  );
}
