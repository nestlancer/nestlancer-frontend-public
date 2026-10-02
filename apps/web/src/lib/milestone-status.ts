/** Milestone status helpers aligned with backend MilestoneStatus enum. */

export function normalizeMilestoneStatus(status: string | undefined): string {
  return (status ?? '').trim().toUpperCase();
}

/** Client may approve delivery or request revision when the studio submitted work for review. */
export function canReviewMilestone(
  status: string | undefined,
  opts?: {
    isDeposit?: boolean;
    isPayOnly?: boolean;
    isLocked?: boolean;
    canReviewDelivery?: boolean;
  }
): boolean {
  if (opts?.isLocked) return false;
  if (typeof opts?.canReviewDelivery === 'boolean') return opts.canReviewDelivery;
  if (opts?.isPayOnly || opts?.isDeposit) return false;
  return normalizeMilestoneStatus(status) === 'COMPLETED';
}

/** Client may request changes after approving delivery but before paying the installment. */
export function canRequestPrePaymentRevision(opts?: {
  isDeposit?: boolean;
  isPayOnly?: boolean;
  isLocked?: boolean;
  canRequestPrePaymentRevision?: boolean;
}): boolean {
  if (opts?.isLocked) return false;
  if (opts?.isDeposit || opts?.isPayOnly) return false;
  return opts?.canRequestPrePaymentRevision === true;
}

/** Stepper checkmark — only when the client has fully approved delivery. */
export function isMilestoneFullyApproved(status: string | undefined): boolean {
  return normalizeMilestoneStatus(status) === 'APPROVED';
}

export function formatMilestoneStatusLabel(status: string | undefined): string {
  const s = normalizeMilestoneStatus(status);
  switch (s) {
    case 'PENDING':
      return 'Awaiting work';
    case 'IN_PROGRESS':
      return 'Work in progress';
    case 'REVIEW':
      return 'In review';
    case 'COMPLETED':
      return 'Ready for your approval';
    case 'APPROVED':
      return 'Approved';
    case 'REVISION_REQUESTED':
      return 'Revision requested';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status ? String(status) : '—';
  }
}

export type MilestoneBadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'purple' | 'neutral';

export function milestoneStatusBadgeVariant(status: string | undefined): MilestoneBadgeVariant {
  const s = normalizeMilestoneStatus(status);
  switch (s) {
    case 'APPROVED':
      return 'success';
    case 'COMPLETED':
      return 'info';
    case 'IN_PROGRESS':
    case 'REVIEW':
      return 'info';
    case 'PENDING':
      return 'warning';
    case 'REVISION_REQUESTED':
      return 'error';
    case 'CANCELLED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function formatMilestonePaymentStatusLabel(
  paymentStatus: string | undefined,
  ctx?: {
    order?: number;
    paymentRequestedAt?: string | null;
    isDeposit?: boolean;
    canPay?: boolean;
  }
): string {
  const s = normalizeMilestoneStatus(paymentStatus);
  const isDeposit = typeof ctx?.isDeposit === 'boolean' ? ctx.isDeposit : (ctx?.order ?? 1) <= 1;

  switch (s) {
    case 'COMPLETED':
      return 'Paid';
    case 'PENDING':
      return 'Payment due';
    case 'PROCESSING':
      return 'Processing';
    case 'FAILED':
      return 'Payment failed';
    case 'REFUNDED':
      return 'Refunded';
    case 'CREATED':
      // Align with Billing: canPay=false → Not due yet; due open rows → Pending.
      if (ctx?.canPay === false) {
        return 'Not due yet';
      }
      if (!isDeposit && !ctx?.paymentRequestedAt && ctx?.canPay !== true) {
        return 'Not due yet';
      }
      return isDeposit ? 'Payment due' : 'Pending';
    default:
      return isDeposit ? 'Unpaid' : 'Not due yet';
  }
}

export function milestonePaymentStatusBadgeVariant(
  paymentStatus: string | undefined
): MilestoneBadgeVariant {
  const s = normalizeMilestoneStatus(paymentStatus);
  switch (s) {
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
    case 'PROCESSING':
      return 'warning';
    case 'FAILED':
      return 'error';
    case 'REFUNDED':
      return 'purple';
    default:
      return 'neutral';
  }
}

export type MilestonePayContext = {
  status?: string;
  amountPaise?: number;
  order?: number;
  paymentStatus?: string;
  paymentRequestedAt?: string | null;
  projectStatus?: string;
  isDeposit?: boolean;
  isPayOnly?: boolean;
  isLocked?: boolean;
  canPay?: boolean;
};

/**
 * Deposit (first schedule item): payable while not yet paid.
 * Pay-only installments (Mid/Final in dual model): after payment was requested.
 * Later work milestones: only after client approves delivery AND payment was requested.
 */
export function isMilestonePayable(ctx: MilestonePayContext): boolean {
  if (ctx.isLocked) return false;
  if (typeof ctx.canPay === 'boolean') return ctx.canPay;

  const amount = ctx.amountPaise ?? 0;
  if (amount <= 0) return false;

  const payStatus = normalizeMilestoneStatus(ctx.paymentStatus);
  if (payStatus === 'COMPLETED') return false;

  const isDeposit = typeof ctx.isDeposit === 'boolean' ? ctx.isDeposit : (ctx.order ?? 1) <= 1;
  const isPayOnly = typeof ctx.isPayOnly === 'boolean' ? ctx.isPayOnly : isDeposit;
  const milestoneStatus = normalizeMilestoneStatus(ctx.status);

  if (isDeposit) {
    return (
      milestoneStatus === 'PENDING' ||
      milestoneStatus === 'IN_PROGRESS' ||
      milestoneStatus === '' ||
      payStatus === 'CREATED' ||
      payStatus === 'PENDING' ||
      payStatus === 'FAILED'
    );
  }

  // Mid/Final pay-only installments: payable once studio requested payment.
  if (isPayOnly) {
    if (!ctx.paymentRequestedAt) return false;
    return (
      payStatus === 'CREATED' || payStatus === 'PENDING' || payStatus === 'FAILED' || !payStatus
    );
  }

  if (milestoneStatus !== 'APPROVED') return false;
  if (!ctx.paymentRequestedAt) return false;

  return payStatus === 'CREATED' || payStatus === 'PENDING' || payStatus === 'FAILED' || !payStatus;
}

/** @deprecated Use isMilestonePayable({ status, amountPaise, order }) */
export function isMilestonePayableLegacy(
  status: string | undefined,
  amountPaise: number | undefined
): boolean {
  return isMilestonePayable({ status, amountPaise, order: 1 });
}
