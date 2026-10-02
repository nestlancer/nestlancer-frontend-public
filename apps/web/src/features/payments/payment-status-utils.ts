import type { StatusBadgeProps } from '@nestlancer/ui';

import { formatWorkStatusLabel, workStatusBadgeVariant } from '@/features/work/status-utils';

export function paymentStatusBadgeVariant(
  status: string,
  opts?: { canPay?: boolean }
): NonNullable<StatusBadgeProps['variant']> {
  const s = status.toLowerCase();
  if (opts?.canPay === false && (s === 'created' || s === 'pending' || s.includes('created'))) {
    return 'info';
  }
  if (s.includes('dispute')) return 'purple';
  if (s.includes('pending_verification') || s.includes('verification')) return 'warning';
  if (s.includes('pending') || s.includes('processing') || s.includes('created')) return 'warning';
  if (s.includes('complete') || s.includes('paid')) return 'success';
  if (s.includes('fail') || s.includes('cancel') || s.includes('reject')) return 'error';
  if (s.includes('refund')) return 'info';
  return workStatusBadgeVariant(status);
}

export function formatPaymentStatusLabel(status: string, opts?: { canPay?: boolean }): string {
  const s = status.toLowerCase();
  // NL-PAY-007: schedule rows that are not yet due match milestone hub copy.
  if (opts?.canPay === false && (s === 'created' || s === 'pending')) {
    return 'Not due yet';
  }
  // NL-PAY-005: client billing vocabulary — Created schedule rows that are due are "Pending".
  if (s === 'created') return 'Pending';
  if (s === 'pending_verification') return 'Awaiting verification';
  return formatWorkStatusLabel(status);
}

/** Whether Billing/Dashboard should expose a Checkout CTA for this row. */
export function isPaymentCheckoutVisible(status: string, canPay?: boolean): boolean {
  const s = status.toLowerCase();
  if (!['pending', 'created', 'failed'].includes(s)) return false;
  // Undefined canPay (older payloads) keeps prior behavior; false hides Checkout.
  return canPay !== false;
}

/** Sum amounts still awaiting settlement (pending / processing / created / verification). */
export function sumPendingPaise(
  items: { status: string; amount: number; canPay?: boolean }[]
): number {
  return items.reduce((sum, p) => {
    if (p.canPay === false) return sum;
    const s = String(p.status).toLowerCase();
    if (
      !(
        s.includes('pending') ||
        s.includes('processing') ||
        s.includes('created') ||
        s.includes('verification')
      )
    )
      return sum;
    return sum + (typeof p.amount === 'number' ? p.amount : 0);
  }, 0);
}
