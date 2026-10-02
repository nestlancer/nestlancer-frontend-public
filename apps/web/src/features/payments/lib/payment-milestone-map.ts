import { asRecord } from '@/lib/client-api-view';

export type PaymentMilestoneMeta = {
  paymentId?: string;
  paymentStatus?: string;
  paymentRequestedAt?: string | null;
  isDeposit?: boolean;
  isPayOnly?: boolean;
  isLocked?: boolean;
  lockReason?: string | null;
  canPay?: boolean;
  canReviewDelivery?: boolean;
  canRequestPrePaymentRevision?: boolean;
  isPaidAndLocked?: boolean;
};

/** Index payment-milestone API rows by milestone id for checkout routing. */
export function buildPaymentMilestoneMap(data: unknown): Map<string, PaymentMilestoneMeta> {
  const map = new Map<string, PaymentMilestoneMeta>();
  const r = asRecord(data);
  const list = Array.isArray(r?.milestones)
    ? (r!.milestones as unknown[])
    : Array.isArray(r?.data)
      ? (r!.data as unknown[])
      : Array.isArray(data)
        ? (data as unknown[])
        : [];

  for (const item of list) {
    const o = asRecord(item) ?? {};
    const milestoneId =
      typeof o.milestoneId === 'string'
        ? o.milestoneId
        : typeof o.id === 'string'
          ? o.id
          : undefined;
    if (!milestoneId) continue;

    const payments = Array.isArray(o.payments) ? (o.payments as unknown[]) : [];
    const latestPayment = asRecord(payments[0]);
    const name = typeof o.name === 'string' ? o.name : typeof o.title === 'string' ? o.title : '';

    map.set(milestoneId, {
      paymentId:
        typeof o.latestPaymentId === 'string'
          ? o.latestPaymentId
          : typeof latestPayment?.id === 'string'
            ? latestPayment.id
            : undefined,
      paymentStatus:
        typeof o.latestStatus === 'string'
          ? o.latestStatus
          : typeof o.paymentStatus === 'string'
            ? o.paymentStatus
            : typeof latestPayment?.status === 'string'
              ? String(latestPayment.status)
              : payments.length > 0 && typeof o.status === 'string'
                ? o.status
                : undefined,
      paymentRequestedAt: typeof o.paymentRequestedAt === 'string' ? o.paymentRequestedAt : null,
      isDeposit: typeof o.isDeposit === 'boolean' ? o.isDeposit : /^\s*deposit\b/i.test(name),
      isPayOnly:
        typeof o.isPayOnly === 'boolean'
          ? o.isPayOnly
          : /^(deposit|mid[- ]?project payment|final payment)\b/i.test(name.trim()),
      isLocked: typeof o.isLocked === 'boolean' ? o.isLocked : undefined,
      lockReason: typeof o.lockReason === 'string' ? o.lockReason : null,
      canPay: typeof o.canPay === 'boolean' ? o.canPay : undefined,
      canReviewDelivery: typeof o.canReviewDelivery === 'boolean' ? o.canReviewDelivery : undefined,
      canRequestPrePaymentRevision:
        typeof o.canRequestPrePaymentRevision === 'boolean'
          ? o.canRequestPrePaymentRevision
          : undefined,
      isPaidAndLocked: typeof o.isPaidAndLocked === 'boolean' ? o.isPaidAndLocked : undefined,
    });
  }

  return map;
}
