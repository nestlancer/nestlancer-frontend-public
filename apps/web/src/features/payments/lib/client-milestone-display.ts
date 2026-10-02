import type { MilestoneRow } from '@/lib/client-api-view';

import type { PaymentMilestoneMeta } from './payment-milestone-map';

const SCHEDULE_NAME =
  /^(deposit|full payment|mid[- ]?project payment|final payment|milestone \d+|payment \d+)\b/i;

export function isPaymentScheduleMilestoneName(
  name: string | undefined,
  percentage?: number | null
): boolean {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return false;
  if (SCHEDULE_NAME.test(trimmed)) return true;
  if (percentage != null && percentage > 0) return true;
  return false;
}

export type ClientMilestoneDisplayRow = {
  row: MilestoneRow;
  paymentMeta?: PaymentMilestoneMeta;
  /** Milestone id used for checkout (may be a linked installment). */
  payMilestoneId: string;
  payAmountPaise?: number;
  isDeposit: boolean;
  isPayOnly: boolean;
  /** When payment is surfaced on a work milestone via a schedule installment. */
  linkedInstallmentLabel?: string;
  /** Trailing work beyond 1:1 installment pairing — included in last installment. */
  linkedInstallmentInclusive?: boolean;
  isLocked?: boolean;
  lockReason?: string | null;
  canPay?: boolean;
  canReviewDelivery?: boolean;
  canRequestPrePaymentRevision?: boolean;
  isPaidAndLocked?: boolean;
};

function sortByOrderThenId(a: MilestoneRow, b: MilestoneRow): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.id.localeCompare(b.id);
}

/**
 * Client-facing milestone list for dual work + schedule projects:
 * - Keep Deposit visible as the upfront payment row.
 * - Hide Mid/Final pay-only schedule rows (payment is shown on work milestones).
 * - Merge installment payment metadata onto paired work milestones (order+1 / index).
 * - Trailing work beyond installment count is included in the last installment.
 */
export function buildClientMilestoneDisplayRows(
  rows: MilestoneRow[],
  paymentMetaByMilestone: Map<string, PaymentMilestoneMeta>
): ClientMilestoneDisplayRow[] {
  const hasWorkMilestones = rows.some(
    (row) => !isPaymentScheduleMilestoneName(row.title, row.percentage)
  );

  if (!hasWorkMilestones) {
    return rows.map((row) => {
      const meta = paymentMetaByMilestone.get(row.id);
      const isDeposit =
        typeof meta?.isDeposit === 'boolean'
          ? meta.isDeposit
          : /^\s*deposit\b/i.test(row.title ?? '');
      const isNamedPayOnlyInstallment = /^(mid[- ]?project payment|final payment)\b/i.test(
        (row.title ?? '').trim()
      );
      // Mid/Final are always pay-only (no delivery track) — matches admin + NL-MS-001.
      const isPayOnly =
        typeof meta?.isPayOnly === 'boolean'
          ? meta.isPayOnly || isNamedPayOnlyInstallment
          : isDeposit || isNamedPayOnlyInstallment;

      return {
        row,
        paymentMeta: meta,
        payMilestoneId: row.id,
        payAmountPaise: row.amount,
        isDeposit,
        isPayOnly,
        isLocked: meta?.isLocked,
        lockReason: meta?.lockReason,
        canPay: meta?.canPay,
        canReviewDelivery: meta?.canReviewDelivery,
        canRequestPrePaymentRevision: meta?.canRequestPrePaymentRevision,
        isPaidAndLocked: meta?.isPaidAndLocked,
      };
    });
  }

  const installmentRows = rows
    .filter((row) => {
      const meta = paymentMetaByMilestone.get(row.id);
      const namedPayOnly = /^(mid[- ]?project payment|final payment)\b/i.test(
        (row.title ?? '').trim()
      );
      // Prefer API flag; fall back to Mid/Final name heuristic (NL-MS-001).
      return Boolean((meta?.isPayOnly || namedPayOnly) && !meta?.isDeposit);
    })
    .sort(sortByOrderThenId);

  const workRows = rows
    .filter((row) => !isPaymentScheduleMilestoneName(row.title, row.percentage))
    .sort(sortByOrderThenId);

  const linkByWorkId = new Map<
    string,
    { row: MilestoneRow; meta?: PaymentMilestoneMeta; inclusive: boolean }
  >();

  workRows.forEach((work, index) => {
    const byOrder = installmentRows.find((inst) => inst.order === work.order + 1);
    if (byOrder) {
      linkByWorkId.set(work.id, {
        row: byOrder,
        meta: paymentMetaByMilestone.get(byOrder.id),
        inclusive: false,
      });
      return;
    }
    if (index < installmentRows.length) {
      const inst = installmentRows[index]!;
      linkByWorkId.set(work.id, {
        row: inst,
        meta: paymentMetaByMilestone.get(inst.id),
        inclusive: false,
      });
      return;
    }
    if (installmentRows.length > 0) {
      const last = installmentRows[installmentRows.length - 1]!;
      linkByWorkId.set(work.id, {
        row: last,
        meta: paymentMetaByMilestone.get(last.id),
        inclusive: true,
      });
    }
  });

  return rows
    .filter((row) => {
      const meta = paymentMetaByMilestone.get(row.id);
      const namedPayOnly = /^(mid[- ]?project payment|final payment)\b/i.test(
        (row.title ?? '').trim()
      );
      return !((meta?.isPayOnly || namedPayOnly) && !meta?.isDeposit);
    })
    .map((row) => {
      const meta = paymentMetaByMilestone.get(row.id);
      const isDeposit =
        typeof meta?.isDeposit === 'boolean'
          ? meta.isDeposit
          : /^\s*deposit\b/i.test(row.title ?? '');
      const isPayOnly =
        typeof meta?.isPayOnly === 'boolean'
          ? meta.isPayOnly
          : isDeposit ||
            (isPaymentScheduleMilestoneName(row.title ?? '', row.percentage) && !isDeposit);
      const isNamedPayOnlyInstallment = /^(mid[- ]?project payment|final payment)\b/i.test(
        (row.title ?? '').trim()
      );

      if (!isPaymentScheduleMilestoneName(row.title, row.percentage)) {
        const installment = linkByWorkId.get(row.id);
        if (installment) {
          const workMeta = meta;
          // Linked Mid/Final are pay-only: Billing uses installment canPay as source of truth.
          const installmentCanPay = installment.meta?.canPay;
          return {
            row,
            paymentMeta: installment.meta,
            payMilestoneId: installment.row.id,
            payAmountPaise: installment.row.amount,
            isDeposit: false,
            isPayOnly: false,
            linkedInstallmentLabel: installment.row.title,
            linkedInstallmentInclusive: installment.inclusive,
            isLocked: workMeta?.isLocked,
            lockReason: workMeta?.lockReason,
            canPay: installment.inclusive ? false : (installmentCanPay ?? workMeta?.canPay),
            canReviewDelivery: workMeta?.canReviewDelivery,
            canRequestPrePaymentRevision: installment.inclusive
              ? false
              : workMeta?.canRequestPrePaymentRevision,
            isPaidAndLocked: workMeta?.isPaidAndLocked,
          };
        }
      }

      return {
        row,
        paymentMeta: meta,
        payMilestoneId: row.id,
        payAmountPaise: row.amount,
        isDeposit,
        isPayOnly: isPayOnly || isNamedPayOnlyInstallment,
        isLocked: meta?.isLocked,
        lockReason: meta?.lockReason,
        canPay: meta?.canPay,
        canReviewDelivery: meta?.canReviewDelivery,
        canRequestPrePaymentRevision: meta?.canRequestPrePaymentRevision,
        isPaidAndLocked: meta?.isPaidAndLocked,
      };
    });
}
