const INDIAN_MOBILE = /^[6-9]\d{9}$/;

/**
 * Normalize a stored phone (E.164 or local) into Razorpay `prefill.contact` format.
 *
 * For INR, Razorpay accepts a 10-digit Indian mobile (country code 91 is implied).
 * See: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
 */
export function formatRazorpayContact(
  phone: string | null | undefined,
  currency = 'INR'
): string | undefined {
  const raw = phone?.trim();
  if (!raw) return undefined;

  const digits = raw.replace(/\D/g, '');
  if (!digits) return undefined;

  if (currency === 'INR') {
    if (digits.length === 10 && INDIAN_MOBILE.test(digits)) return digits;
    if (digits.length === 12 && digits.startsWith('91') && INDIAN_MOBILE.test(digits.slice(2))) {
      return digits.slice(2);
    }
    return undefined;
  }

  if (raw.startsWith('+')) return raw;
  return `+${digits}`;
}
