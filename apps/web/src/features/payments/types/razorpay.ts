export interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayPrefill {
  name?: string;
  email?: string;
  contact?: string;
}

export interface RazorpayUpiCollectOptions {
  flow?: 'collect' | 'intent' | 'qr';
  vpa?: string;
}

export interface RazorpayDisplayConfig {
  display?: {
    blocks?: Record<string, { name: string; instruments: unknown[] }>;
    hide?: Array<{ method: string }>;
    sequence?: string[];
    preferences?: { show_default_blocks?: boolean };
  };
}

export interface RazorpayCheckoutOptions {
  key: string;
  /** Omit when `order_id` is set — amount is taken from the Razorpay order. */
  amount?: number;
  currency?: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  /** Opens a specific payment method (e.g. `upi` for VPA collect). */
  method?: string;
  upi?: RazorpayUpiCollectOptions;
  config?: RazorpayDisplayConfig;
  checkout_config_id?: string;
  prefill?: RazorpayPrefill;
  readonly?: { contact?: boolean; email?: boolean; name?: boolean };
  notes?: Record<string, string>;
  handler: (response: RazorpayCheckoutResponse) => void;
  modal?: { ondismiss?: () => void; escape?: boolean; backdropclose?: boolean };
  theme?: { color?: string; backdrop_color?: string };
}

export interface RazorpayPaymentFailedResponse {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
    source?: string;
    step?: string;
  };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response?: RazorpayPaymentFailedResponse) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export interface PaymentIntentResult {
  id?: string;
  projectId?: string;
  amount?: number;
  currency?: string;
  clientSecret?: string;
  status?: string;
}
