import { describe, expect, it } from 'vitest';

import {
  acceptQuoteSchema,
  adminResetPasswordSchema,
  changePasswordSchema,
  createQuoteSchema,
} from '@nestlancer/validators';

describe('changePasswordSchema', () => {
  it('rejects a confirmation that does not match', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass123!',
      newPassword: 'NewSecurePass99!',
      confirmPassword: 'DifferentPass99!',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a matching complex password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass123!',
      newPassword: 'NewSecurePass99!',
      confirmPassword: 'NewSecurePass99!',
    });
    expect(result.success).toBe(true);
  });
});

describe('adminResetPasswordSchema', () => {
  it('rejects a short password and a mismatched confirmation', () => {
    expect(
      adminResetPasswordSchema.safeParse({ newPassword: 'short', confirmPassword: 'short' }).success
    ).toBe(false);
    expect(
      adminResetPasswordSchema.safeParse({
        newPassword: 'long-enough',
        confirmPassword: 'different',
      }).success
    ).toBe(false);
  });
});

describe('acceptQuoteSchema', () => {
  it('requires a legal name', () => {
    const result = acceptQuoteSchema.safeParse({
      acceptTerms: true,
      signatureName: '   ',
      signatureDate: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});

describe('createQuoteSchema', () => {
  const future = new Date(Date.now() + 86_400_000).toISOString();

  it('rejects a line with no price', () => {
    const result = createQuoteSchema.safeParse({
      items: [{ description: 'Design', quantity: 1, unitPrice: 0 }],
      currency: 'INR',
      taxPercentage: 0,
      validUntil: future,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a custom schedule that does not total 100', () => {
    const result = createQuoteSchema.safeParse({
      items: [{ description: 'Design', quantity: 1, unitPrice: 100 }],
      currency: 'INR',
      taxPercentage: 0,
      validUntil: future,
      paymentSchedule: [
        { label: 'Deposit', percentage: 40, dueTrigger: 'on_accept' },
        { label: 'Final', percentage: 40, dueTrigger: 'on_prior_approved' },
      ],
    });
    expect(result.success).toBe(false);
  });
});
