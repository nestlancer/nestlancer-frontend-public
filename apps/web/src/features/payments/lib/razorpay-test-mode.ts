/** True when the public Razorpay key is a test key (`rzp_test_…`). */
export function isRazorpayTestMode(): boolean {
  return (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '').startsWith('rzp_test_');
}

/**
 * NL-BUG-PAY-1: never print full test card credentials on production builds unless
 * operators explicitly opt in via NEXT_PUBLIC_SHOW_TEST_PAYMENT_HINT=true.
 */
export function shouldShowTestPaymentCredentials(): boolean {
  if (!isRazorpayTestMode()) return false;
  if (process.env.NEXT_PUBLIC_SHOW_TEST_PAYMENT_HINT === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}
