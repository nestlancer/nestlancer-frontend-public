import { describe, expect, it, vi } from 'vitest';

import { confirmCheckoutPayment } from './confirm-checkout-payment';

const payload = {
  paymentIntentId: 'order_1',
  externalPaymentId: 'pay_1',
  signature: 'sig',
};

describe('confirmCheckoutPayment', () => {
  it('calls confirm once and does not replay a failed payment write', async () => {
    const confirmFn = vi.fn().mockRejectedValue(new Error('gateway 503'));
    const refreshSession = vi.fn().mockResolvedValue(undefined);

    await expect(
      confirmCheckoutPayment(confirmFn, payload, {
        hasAccessToken: () => true,
        refreshSession,
      })
    ).rejects.toThrow('gateway 503');

    expect(confirmFn).toHaveBeenCalledTimes(1);
    expect(confirmFn).toHaveBeenCalledWith(payload);
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('refreshes the session once when no access token is in memory', async () => {
    const confirmFn = vi.fn().mockResolvedValue({ ok: true });
    const refreshSession = vi.fn().mockResolvedValue(undefined);

    await confirmCheckoutPayment(confirmFn, payload, {
      hasAccessToken: () => false,
      refreshSession,
    });

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(confirmFn).toHaveBeenCalledTimes(1);
  });
});
