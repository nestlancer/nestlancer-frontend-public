export type MilestonePipelineRow = {
  status?: string;
  latestStatus?: string | null;
  projectStatus?: string;
  /** First payment-schedule milestone (deposit) — pay-only, no delivery approval. */
  isDeposit?: boolean;
  /**
   * Pay-only installment (Deposit, or Mid/Final when dedicated work milestones exist).
   * No submit-for-approval — only request/verify payment.
   */
  isPayOnly?: boolean;
  name?: string;
  order?: number;
  paymentRequestedAt?: string | null;
  paymentsCount?: number;
};

export type PipelineAction = 'submitForApproval' | 'requestPayment' | 'verifyPayment';

export type PipelineActionState = {
  action: PipelineAction;
  enabled: boolean;
  reason?: string;
};

/** Normalize camelCase / snake_case / spaced statuses to SCREAMING_SNAKE. */
export function normalizePipelineStatus(s: string | undefined | null): string {
  const raw = (s ?? '').trim();
  if (!raw) return '';
  return raw
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
}

const SCHEDULE_PAYMENT_NAME =
  /^(deposit|full payment|mid[- ]?project payment|final payment|milestone \d+|payment \d+)\b/i;

function isDepositRow(row: MilestonePipelineRow): boolean {
  if (typeof row.isDeposit === 'boolean') return row.isDeposit;
  return /^\s*deposit\b/i.test(row.name ?? '');
}

function isPayOnlyRow(row: MilestonePipelineRow): boolean {
  if (typeof row.isPayOnly === 'boolean') return row.isPayOnly;
  if (isDepositRow(row)) return true;
  // Heuristic when API flag missing: Mid/Final look like schedule installments.
  return SCHEDULE_PAYMENT_NAME.test((row.name ?? '').trim()) && !isDepositRow(row)
    ? (row.paymentsCount ?? 0) > 0 || Boolean(row.latestStatus)
    : false;
}

/**
 * Canonical admin pipeline:
 *
 * Work milestones:
 *   1. Submit for client approval  (IN_PROGRESS | REVISION_REQUESTED | PENDING)
 *   2. Client approves             → APPROVED (client action)
 *   3. Request payment on installment (dual model) or on this milestone
 *   4. Verify payment              (in-flight gateway / requested payments)
 *
 * Pay-only schedule (Deposit, or Mid/Final when work milestones exist):
 *   — no submit/approve; request/verify (deposit: client pays, no request)
 */
export function getMilestonePipelineActions(row: MilestonePipelineRow): PipelineActionState[] {
  const ms = normalizePipelineStatus(row.status);
  const pay = normalizePipelineStatus(row.latestStatus ?? '');
  const project = normalizePipelineStatus(row.projectStatus ?? '');
  const deposit = isDepositRow(row);
  const payOnly = isPayOnlyRow(row);
  const depositBlocking = project === 'PENDING_PAYMENT';
  const paymentRequested = Boolean(row.paymentRequestedAt);
  const alreadyPaid = pay === 'COMPLETED';

  // Work delivery submit — never on pay-only schedule rows, never after paid.
  const submitEnabled =
    !payOnly &&
    !depositBlocking &&
    !alreadyPaid &&
    (ms === 'IN_PROGRESS' || ms === 'REVISION_REQUESTED' || ms === 'PENDING');

  let submitReason: string | undefined;
  if (payOnly) {
    submitReason = deposit
      ? 'Deposit is pay-only — submit work milestones after the deposit is paid'
      : 'This is a payment installment — submit the related work milestone for approval instead';
  } else if (depositBlocking) {
    submitReason = 'Client must pay the deposit before work can be submitted for approval';
  } else if (alreadyPaid) {
    submitReason = 'Already paid — no delivery submit needed';
  } else if (ms === 'COMPLETED' || ms === 'APPROVED') {
    submitReason = 'Already submitted or approved';
  }

  // Request payment:
  // - Deposit: never
  // - Pay-only Mid/Final: after deposit paid (not PENDING_PAYMENT), until paid
  // - Work with an existing payment row (schedule-as-work): after APPROVED
  // - Pure work milestones (dual model): never — use the installment row instead
  let requestEnabled = false;
  let requestReason: string | undefined;
  if (deposit) {
    requestReason = 'Deposit is collected upfront — no payment request needed';
  } else if (alreadyPaid) {
    requestReason = 'Already paid';
  } else if (payOnly) {
    requestEnabled = !depositBlocking;
    if (depositBlocking) {
      requestReason = 'Client must pay the deposit first';
    }
  } else if (ms === 'APPROVED') {
    const hasPaymentRow = (row.paymentsCount ?? 0) > 0 || Boolean(row.latestStatus);
    if (hasPaymentRow) {
      requestEnabled = true;
    } else {
      requestReason =
        'Request payment on the installment (Mid-project / Final payment), not on this work milestone';
    }
  } else {
    requestReason = 'Client must approve the milestone first';
  }

  // Verify only for in-flight payments (client started checkout) or after payment was requested.
  // Bare CREATED schedule rows are not verifiable — use Manual payment for offline funds.
  const verifyEnabled =
    !deposit &&
    !alreadyPaid &&
    (pay === 'PENDING' ||
      pay === 'PROCESSING' ||
      (paymentRequested && (pay === 'CREATED' || pay === 'PENDING')));

  let verifyReason: string | undefined;
  if (deposit) {
    verifyReason = alreadyPaid
      ? 'Deposit already paid'
      : 'Deposit is paid by the client (or via Manual payment) — nothing to verify here';
  } else if (alreadyPaid) {
    verifyReason = 'Payment already completed';
  } else if (!paymentRequested && (pay === 'CREATED' || !pay)) {
    verifyReason = payOnly
      ? 'Request payment on this installment before verifying'
      : 'Request payment after client approval before verifying';
  } else if (!pay) {
    verifyReason = 'No payment record yet';
  }

  return [
    {
      action: 'submitForApproval',
      enabled: submitEnabled,
      reason: submitEnabled ? undefined : submitReason,
    },
    {
      action: 'requestPayment',
      enabled: requestEnabled,
      reason: requestEnabled ? undefined : requestReason,
    },
    {
      action: 'verifyPayment',
      enabled: verifyEnabled,
      reason: verifyEnabled ? undefined : verifyReason,
    },
  ];
}

/** Next action in the sequential pipeline (first enabled). */
export function getNextPipelineAction(row: MilestonePipelineRow): PipelineActionState | null {
  return getMilestonePipelineActions(row).find((a) => a.enabled) ?? null;
}

export function isPipelineActionEnabled(
  row: MilestonePipelineRow,
  action: PipelineAction
): boolean {
  return getMilestonePipelineActions(row).find((a) => a.action === action)?.enabled ?? false;
}

export function pipelineDisabledReason(
  row: MilestonePipelineRow,
  action: PipelineAction
): string | undefined {
  return getMilestonePipelineActions(row).find((a) => a.action === action)?.reason;
}
