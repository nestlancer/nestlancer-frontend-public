import { describe, expect, it } from 'vitest';

import {
  formatPaymentStatusLabel,
  groupMilestonesByProject,
  installmentSlotCounts,
  isBillableMilestoneRow,
  isDeliveryMilestoneRow,
  parseReconciliationPayload,
} from './payment-hub-utils';

describe('payment-hub-utils dual-model billing', () => {
  const khandeshRows = [
    {
      id: 'dep',
      projectId: 'p1',
      projectTitle: 'Khandesh Spice',
      name: 'Deposit',
      amount: 2250000,
      billableAmount: 2250000,
      latestStatus: 'COMPLETED',
      status: 'APPROVED',
      isDeposit: true,
      isPayOnly: true,
      paymentsCount: 1,
    },
    {
      id: 'w1',
      projectId: 'p1',
      projectTitle: 'Khandesh Spice',
      name: 'Design & Architecture',
      amount: 2250000,
      billableAmount: 3000000,
      latestStatus: 'CREATED',
      status: 'COMPLETED',
      isDeposit: false,
      isPayOnly: false,
      linkedInstallmentId: 'mid',
      linkedInstallmentName: 'Mid-project payment',
      paymentsCount: 1,
    },
    {
      id: 'mid',
      projectId: 'p1',
      projectTitle: 'Khandesh Spice',
      name: 'Mid-project payment',
      amount: 3000000,
      billableAmount: 3000000,
      latestStatus: 'CREATED',
      paymentRequestedAt: '2026-08-23T15:15:31.375Z',
      status: 'PENDING',
      isDeposit: false,
      isPayOnly: true,
      paymentsCount: 1,
    },
    {
      id: 'w2',
      projectId: 'p1',
      projectTitle: 'Khandesh Spice',
      name: 'Storefront & Checkout',
      amount: 3750000,
      billableAmount: 2250000,
      latestStatus: 'CREATED',
      status: 'PENDING',
      isDeposit: false,
      isPayOnly: false,
      linkedInstallmentId: 'final',
      linkedInstallmentName: 'Final payment',
      paymentsCount: 1,
    },
    {
      id: 'final',
      projectId: 'p1',
      projectTitle: 'Khandesh Spice',
      name: 'Final payment',
      amount: 2250000,
      billableAmount: 2250000,
      latestStatus: 'CREATED',
      status: 'PENDING',
      isDeposit: false,
      isPayOnly: true,
      paymentsCount: 1,
    },
    {
      id: 'w3',
      projectId: 'p1',
      projectTitle: 'Khandesh Spice',
      name: 'QA, SEO & Launch',
      amount: 1500000,
      billableAmount: 2250000,
      latestStatus: 'CREATED',
      status: 'PENDING',
      isDeposit: false,
      isPayOnly: false,
      linkedInstallmentId: 'final',
      linkedInstallmentName: 'Final payment',
      linkedInstallmentInclusive: true,
      paymentsCount: 1,
    },
  ];

  it('classifies billable vs delivery rows', () => {
    expect(isBillableMilestoneRow(khandeshRows[0]!)).toBe(true);
    expect(isBillableMilestoneRow(khandeshRows[1]!)).toBe(false);
    expect(isBillableMilestoneRow(khandeshRows[2]!)).toBe(true);
    expect(isDeliveryMilestoneRow(khandeshRows[1]!)).toBe(true);
    expect(isDeliveryMilestoneRow(khandeshRows[2]!)).toBe(false);
  });

  it('does not double-count work + schedule amounts', () => {
    const [summary] = groupMilestonesByProject(khandeshRows);
    expect(summary!).toBeDefined();
    expect(summary!.totalBudgetPaise).toBe(7500000);
    expect(summary!.paidAmountPaise).toBe(2250000);
    expect(summary!.pendingAmountPaise).toBe(5250000);
    expect(summary!.milestoneCount).toBe(3);
    expect(summary!.paidCount).toBe(1);
    expect(summary!.deliveryCount).toBe(3);
    expect(summary!.progressPercent).toBe(30);
    expect(summary!.awaitingApprovalCount).toBe(1);
  });

  it('labels CREATED + paymentRequestedAt as payment due', () => {
    expect(formatPaymentStatusLabel('CREATED')).toBe('Not requested');
    expect(
      formatPaymentStatusLabel('CREATED', {
        paymentRequestedAt: '2026-08-23T15:15:31.375Z',
      })
    ).toBe('Payment due');
  });

  it('summarizes installment slots without treating scheduled rows as paid', () => {
    expect(
      installmentSlotCounts([
        { status: 'COMPLETED' },
        { status: 'CREATED', paymentRequestedAt: '2026-08-23T15:15:31.375Z' },
        { status: 'CREATED' },
      ])
    ).toEqual({ paid: 1, due: 1, scheduled: 1 });
  });
});

describe('parseReconciliationPayload', () => {
  it('reads summary KPIs and nested payments instead of treating the object as a table', () => {
    const parsed = parseReconciliationPayload({
      status: 'success',
      data: {
        matchedCount: 12,
        mismatchCount: 1,
        payments: [{ id: 'pay_1', status: 'COMPLETED' }],
        mismatches: [{ id: 'mm_1', reason: 'amount' }],
      },
    });
    expect(parsed.payments).toHaveLength(1);
    expect(parsed.mismatches).toHaveLength(1);
    expect(parsed.kpis.some((k) => k.label.toLowerCase().includes('matched'))).toBe(true);
  });
});
