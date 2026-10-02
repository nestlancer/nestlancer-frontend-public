import { describe, expect, it } from 'vitest';

import { formatRazorpayContact } from './format-razorpay-contact';

describe('formatRazorpayContact', () => {
  it('returns 10-digit Indian mobile for E.164 +91 numbers', () => {
    expect(formatRazorpayContact('+919876543210')).toBe('9876543210');
  });

  it('returns 10-digit Indian mobile when already local', () => {
    expect(formatRazorpayContact('9876543210')).toBe('9876543210');
  });

  it('strips spaces and punctuation', () => {
    expect(formatRazorpayContact('+91 98765 43210')).toBe('9876543210');
  });

  it('rejects invalid Indian numbers', () => {
    expect(formatRazorpayContact('+14155551234')).toBeUndefined();
    expect(formatRazorpayContact('12345')).toBeUndefined();
  });

  it('returns E.164 for non-INR currencies', () => {
    expect(formatRazorpayContact('+14155551234', 'USD')).toBe('+14155551234');
  });
});
