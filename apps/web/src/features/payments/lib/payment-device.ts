/**
 * Razorpay UPI Collect (manual VPA / UPI ID field) is not available on desktop web.
 * NPCI + Razorpay only allow QR on desktop; Collect works on mobile web / iOS per Razorpay docs.
 *
 * @see https://razorpay.com/docs/announcements/upi-collect-migration/custom-integration/
 * @see https://razorpay.com/docs/payments/payment-methods/upi/upi-intent/
 */

const MOBILE_UA =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

/**
 * True when the browser is likely to show Razorpay's UPI ID / VPA text field (not QR-only).
 * Desktop browsers always return false — Razorpay ignores `upi.flow: collect` on desktop.
 */
export function supportsUpiIdFieldEntry(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent ?? '';
  if (MOBILE_UA.test(ua)) return true;

  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const narrowViewport = window.matchMedia('(max-width: 768px)').matches;
  return coarsePointer && narrowViewport;
}

export function isDesktopBrowser(): boolean {
  return !supportsUpiIdFieldEntry();
}
