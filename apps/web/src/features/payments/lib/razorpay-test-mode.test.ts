import { afterEach, describe, expect, it } from 'vitest';

import { isRazorpayTestMode, shouldShowTestPaymentCredentials } from './razorpay-test-mode';

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe('isRazorpayTestMode', () => {
  it('is true for Razorpay test keys', () => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_abc';
    expect(isRazorpayTestMode()).toBe(true);
  });

  it('is false for live keys', () => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_live_abc';
    expect(isRazorpayTestMode()).toBe(false);
  });

  it('is false when the key is missing', () => {
    delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    expect(isRazorpayTestMode()).toBe(false);
  });
});

describe('shouldShowTestPaymentCredentials', () => {
  it('hides credentials on production builds even with a test key (NL-BUG-PAY-1)', () => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_abc';
    process.env.NODE_ENV = 'production';
    delete process.env.NEXT_PUBLIC_SHOW_TEST_PAYMENT_HINT;
    expect(shouldShowTestPaymentCredentials()).toBe(false);
  });

  it('shows credentials when explicitly opted in on production', () => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_abc';
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_SHOW_TEST_PAYMENT_HINT = 'true';
    expect(shouldShowTestPaymentCredentials()).toBe(true);
  });

  it('shows credentials in non-production with a test key', () => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_abc';
    process.env.NODE_ENV = 'development';
    delete process.env.NEXT_PUBLIC_SHOW_TEST_PAYMENT_HINT;
    expect(shouldShowTestPaymentCredentials()).toBe(true);
  });
});
