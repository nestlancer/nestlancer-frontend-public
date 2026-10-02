'use client';

import { TestTube2 } from '@nestlancer/ui/icons';

import { isRazorpayTestMode, shouldShowTestPaymentCredentials } from '../lib/razorpay-test-mode';

/** Shown on checkout only while Razorpay test keys are configured (dev/staging). */
export function DevTestPaymentHint() {
  if (!isRazorpayTestMode()) return null;

  if (!shouldShowTestPaymentCredentials()) {
    return (
      <div className="rounded-2xl border border-amber-500/35 bg-amber-500/8 px-5 py-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          <TestTube2 className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
          Test mode checkout
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          This environment is using Razorpay test keys. Test card details are hidden on production
          builds.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/35 bg-amber-500/8 px-5 py-4 text-sm">
      <p className="flex items-center gap-2 font-semibold text-foreground">
        <TestTube2 className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
        Test mode checkout
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Use the mandated <strong className="text-foreground">Mastercard test card</strong> (disable
        browser autofill):{' '}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.65rem]">
          5267 3181 8797 5449
        </code>
        , expiry{' '}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.65rem]">12/30</code>, CVV{' '}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.65rem]">123</code>, OTP{' '}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.65rem]">123456</code>. Keep
        each test charge ≤ ₹5,000. Real or international cards fail with &quot;domestic Indian cards
        only&quot; on this merchant. For UPI on desktop, use checkout → UPI →{' '}
        <strong className="text-foreground">scan QR with your phone</strong>. UPI ID typing only
        works on <strong className="text-foreground">mobile browser</strong> (
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.65rem]">
          success@razorpay
        </code>
        ).
      </p>
    </div>
  );
}
