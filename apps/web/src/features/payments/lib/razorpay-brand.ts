/** Nestlancer brand tokens for Razorpay Checkout (see Razorpay checkout styling docs). */
export const RAZORPAY_THEME = {
  color: '#1a6b63',
  backdrop_color: '#f8f7f4',
} as const;

export function razorpayLogoUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}/icons/icon-512x512.png`;
}
