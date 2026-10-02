import { RAZORPAY_THEME, razorpayLogoUrl } from './razorpay-brand';
import type { RazorpayCheckoutOptions, RazorpayCheckoutResponse } from '../types/razorpay';

export type RazorpayCheckoutMode = 'standard' | 'upi-collect';

export interface BuildRazorpayOptionsParams {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  description: string;
  mode?: RazorpayCheckoutMode;
  /** Customer UPI ID (VPA), e.g. name@okicici — used with upi-collect flow. */
  upiVpa?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  /** When true, Razorpay locks the prefilled contact field (avoids invalid manual edits). */
  readonlyContact?: boolean;
  notes?: Record<string, string>;
  onSuccess: (response: RazorpayCheckoutResponse) => void | Promise<void>;
  onDismiss: () => void;
}

function resolveCheckoutConfigId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_RAZORPAY_CHECKOUT_CONFIG_ID?.trim();
  return id && id.length > 0 ? id : undefined;
}

/**
 * Builds Razorpay Checkout options.
 *
 * - `standard`: full modal (card, netbanking, wallets, UPI — often QR-only on desktop).
 * - `upi-collect`: UPI Collect (VPA field). **Only works on mobile web** — desktop always gets QR (Razorpay/NPCI).
 *
 * Also passes `checkout_config_id` when set (Dashboard → enable UPI ID/Number on that config).
 */
export function buildRazorpayCheckoutOptions(
  params: BuildRazorpayOptionsParams
): RazorpayCheckoutOptions {
  const {
    keyId,
    orderId,
    description,
    mode = 'standard',
    upiVpa,
    prefill,
    notes,
    onSuccess,
    onDismiss,
    readonlyContact,
  } = params;

  const checkoutConfigId = resolveCheckoutConfigId();

  // When order_id is set, Razorpay reads amount/currency from the order — passing both
  // can trigger 400s on Standard Checkout v2 after a retry.
  const options: RazorpayCheckoutOptions = {
    key: keyId,
    name: 'Nestlancer',
    description,
    image: razorpayLogoUrl(),
    order_id: orderId,
    prefill,
    notes,
    theme: { ...RAZORPAY_THEME },
    handler: (response) => Promise.resolve(onSuccess(response)),
    modal: {
      ondismiss: onDismiss,
      escape: true,
      backdropclose: false,
    },
  };

  if (checkoutConfigId) {
    options.checkout_config_id = checkoutConfigId;
  }

  if (readonlyContact && prefill?.contact) {
    options.readonly = { contact: true };
  }

  if (mode === 'upi-collect') {
    options.method = 'upi';
    options.upi = {
      flow: 'collect',
      ...(upiVpa?.trim() ? { vpa: upiVpa.trim() } : {}),
    };
  } else if (checkoutConfigId) {
    options.config = {
      display: {
        sequence: ['upi', 'card', 'netbanking', 'wallet'],
        preferences: { show_default_blocks: true },
      },
    };
  }

  return options;
}

/** Basic VPA shape: localpart@psp */
export function isLikelyUpiVpa(value: string): boolean {
  const v = value.trim();
  if (v.length < 5 || v.length > 256) return false;
  const at = v.indexOf('@');
  return at > 0 && at < v.length - 1 && !/\s/.test(v);
}
