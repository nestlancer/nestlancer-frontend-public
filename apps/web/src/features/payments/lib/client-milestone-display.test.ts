import { describe, expect, it } from 'vitest';

import type { MilestoneRow } from '@/lib/client-api-view';

import { buildClientMilestoneDisplayRows } from './client-milestone-display';
import type { PaymentMilestoneMeta } from './payment-milestone-map';

const dualRows: MilestoneRow[] = [
  { id: 'deposit', title: 'Deposit', order: 1, status: 'APPROVED', amount: 2250000 },
  { id: 'design', title: 'Design & Architecture', order: 1, status: 'APPROVED', amount: 2250000 },
  { id: 'mid', title: 'Mid-project payment', order: 2, status: 'PENDING', amount: 3000000 },
  {
    id: 'store',
    title: 'Storefront & Checkout',
    order: 2,
    status: 'COMPLETED',
    amount: 3750000,
  },
  { id: 'final', title: 'Final payment', order: 3, status: 'PENDING', amount: 2250000 },
  { id: 'qa', title: 'QA, SEO & Launch', order: 3, status: 'PENDING', amount: 1500000 },
];

function metaMap(entries: Record<string, PaymentMilestoneMeta>) {
  return new Map(Object.entries(entries));
}

describe('buildClientMilestoneDisplayRows', () => {
  it('merges mid installment payment onto the approved work milestone', () => {
    const paymentMeta = metaMap({
      deposit: {
        paymentStatus: 'COMPLETED',
        isDeposit: true,
        isPayOnly: true,
      },
      design: {
        isDeposit: false,
        isPayOnly: false,
        canRequestPrePaymentRevision: true,
        canPay: true,
      },
      mid: {
        paymentStatus: 'CREATED',
        paymentRequestedAt: '2026-07-30T07:48:21.286Z',
        paymentId: 'pay-mid',
        isDeposit: false,
        isPayOnly: true,
      },
      store: { isDeposit: false, isPayOnly: false, isLocked: true, lockReason: 'locked' },
      final: { paymentStatus: 'CREATED', isDeposit: false, isPayOnly: true },
      qa: { isDeposit: false, isPayOnly: false },
    });

    const display = buildClientMilestoneDisplayRows(dualRows, paymentMeta);

    expect(display.map((d) => d.row.title)).toEqual([
      'Deposit',
      'Design & Architecture',
      'Storefront & Checkout',
      'QA, SEO & Launch',
    ]);

    const design = display.find((d) => d.row.id === 'design')!;
    expect(design.payMilestoneId).toBe('mid');
    expect(design.paymentMeta?.paymentId).toBe('pay-mid');
    expect(design.linkedInstallmentLabel).toBe('Mid-project payment');
    expect(design.canRequestPrePaymentRevision).toBe(true);
    // NL-PAY-012: prefer linked installment canPay over work-row canPay.
    expect(design.canPay).toBe(true);

    const storefront = display.find((d) => d.row.id === 'store')!;
    expect(storefront.isLocked).toBe(true);
    expect(storefront.payMilestoneId).toBe('final');
    expect(storefront.linkedInstallmentLabel).toBe('Final payment');
    expect(storefront.linkedInstallmentInclusive).toBe(false);

    const qa = display.find((d) => d.row.id === 'qa')!;
    expect(qa.payMilestoneId).toBe('final');
    expect(qa.linkedInstallmentLabel).toBe('Final payment');
    expect(qa.linkedInstallmentInclusive).toBe(true);
    expect(qa.canPay).toBe(false);
  });

  it('uses installment canPay when Mid payment is due before delivery approval', () => {
    const paymentMeta = metaMap({
      deposit: {
        paymentStatus: 'COMPLETED',
        isDeposit: true,
        isPayOnly: true,
      },
      design: {
        isDeposit: false,
        isPayOnly: false,
        canPay: false,
        canReviewDelivery: false,
      },
      mid: {
        paymentStatus: 'CREATED',
        paymentRequestedAt: '2026-07-30T07:48:21.286Z',
        paymentId: 'pay-mid',
        isDeposit: false,
        isPayOnly: true,
        canPay: true,
      },
      store: { isDeposit: false, isPayOnly: false },
      final: { paymentStatus: 'CREATED', isDeposit: false, isPayOnly: true, canPay: false },
      qa: { isDeposit: false, isPayOnly: false },
    });

    const display = buildClientMilestoneDisplayRows(dualRows, paymentMeta);
    const design = display.find((d) => d.row.id === 'design')!;
    expect(design.canPay).toBe(true);
    expect(design.payMilestoneId).toBe('mid');
  });
});
