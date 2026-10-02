import { describe, expect, it } from 'vitest';

import {
  getMilestonePipelineActions,
  getNextPipelineAction,
  normalizePipelineStatus,
} from './payment-pipeline';

describe('payment-pipeline', () => {
  it('normalizes mixed status shapes', () => {
    expect(normalizePipelineStatus('inProgress')).toBe('IN_PROGRESS');
    expect(normalizePipelineStatus('pending payment')).toBe('PENDING_PAYMENT');
  });

  it('keeps deposit pay-only with no delivery actions', () => {
    const actions = getMilestonePipelineActions({
      name: 'Deposit',
      isDeposit: true,
      isPayOnly: true,
      status: 'APPROVED',
      latestStatus: 'COMPLETED',
      projectStatus: 'IN_PROGRESS',
    });
    expect(actions.every((a) => !a.enabled)).toBe(true);
  });

  it('blocks submit on Mid/Final pay-only installments and allows request after deposit', () => {
    const actions = getMilestonePipelineActions({
      name: 'Mid-project payment',
      isDeposit: false,
      isPayOnly: true,
      status: 'PENDING',
      latestStatus: 'CREATED',
      projectStatus: 'IN_PROGRESS',
      paymentsCount: 1,
    });
    expect(actions.find((a) => a.action === 'submitForApproval')?.enabled).toBe(false);
    expect(actions.find((a) => a.action === 'requestPayment')?.enabled).toBe(true);
    expect(
      getNextPipelineAction({
        name: 'Mid-project payment',
        isPayOnly: true,
        status: 'PENDING',
        latestStatus: 'CREATED',
        projectStatus: 'IN_PROGRESS',
        paymentsCount: 1,
      })?.action
    ).toBe('requestPayment');
  });

  it('enables submit on work milestones after deposit is paid', () => {
    const actions = getMilestonePipelineActions({
      name: 'Design & Architecture',
      isDeposit: false,
      isPayOnly: false,
      status: 'PENDING',
      latestStatus: null,
      projectStatus: 'IN_PROGRESS',
    });
    expect(actions.find((a) => a.action === 'submitForApproval')?.enabled).toBe(true);
    expect(actions.find((a) => a.action === 'requestPayment')?.enabled).toBe(false);
  });

  it('does not request payment on approved work milestones without a payment row', () => {
    const actions = getMilestonePipelineActions({
      name: 'Design & Architecture',
      isPayOnly: false,
      status: 'APPROVED',
      latestStatus: null,
      paymentsCount: 0,
      projectStatus: 'IN_PROGRESS',
    });
    expect(actions.find((a) => a.action === 'requestPayment')?.enabled).toBe(false);
    expect(actions.find((a) => a.action === 'submitForApproval')?.enabled).toBe(false);
  });

  it('does not enable submit on already-paid installment', () => {
    const actions = getMilestonePipelineActions({
      name: 'Final payment',
      isPayOnly: true,
      status: 'IN_PROGRESS',
      latestStatus: 'COMPLETED',
      projectStatus: 'REVIEW',
      paymentsCount: 1,
    });
    expect(actions.find((a) => a.action === 'submitForApproval')?.enabled).toBe(false);
    expect(actions.find((a) => a.action === 'requestPayment')?.enabled).toBe(false);
  });
});
