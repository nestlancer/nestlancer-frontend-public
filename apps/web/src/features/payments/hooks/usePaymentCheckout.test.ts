import { describe, expect, it } from 'vitest';

import { parsePaymentIntentResult } from '@nestlancer/api-client';

describe('parsePaymentIntentResult', () => {
  it('parses Razorpay order fields from gateway payload', () => {
    const parsed = parsePaymentIntentResult({
      orderId: 'order_abc',
      razorpayOrderId: 'order_abc',
      amount: 150000,
      currency: 'INR',
      keyId: 'rzp_test',
    });
    expect(parsed.clientSecret).toBe('order_abc');
    expect(parsed.amount).toBe(150000);
    expect(parsed.currency).toBe('INR');
  });

  it('returns empty clientSecret when payload is invalid', () => {
    const parsed = parsePaymentIntentResult(null);
    expect(parsed.clientSecret).toBeUndefined();
  });
});
