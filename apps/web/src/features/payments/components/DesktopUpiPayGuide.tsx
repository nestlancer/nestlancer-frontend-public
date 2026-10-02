'use client';

import { CreditCard, MonitorSmartphone, QrCode, Smartphone } from '@nestlancer/ui/icons';

import { cn } from '@nestlancer/ui';

import { shouldShowTestPaymentCredentials } from '../lib/razorpay-test-mode';

export function DesktopUpiPayGuide({ className }: { className?: string }) {
  const testMode = shouldShowTestPaymentCredentials();

  return (
    <div
      className={cn('rounded-2xl border border-amber-500/35 bg-amber-500/8 px-5 py-5', className)}
      role="note"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <MonitorSmartphone className="h-4 w-4 text-amber-700 dark:text-amber-400" aria-hidden />
        UPI ID entry is not available on desktop browsers
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Razorpay and NPCI do not support typing a UPI ID (VPA) in checkout on desktop web. If you
        choose UPI here, Razorpay will always show a{' '}
        <strong className="text-foreground">QR code</strong> to scan with your phone — that is
        expected, not a bug in Nestlancer.
      </p>

      <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
        <li className="flex gap-3">
          <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>
            <strong className="text-foreground">Pay with UPI on desktop:</strong> use{' '}
            <strong className="text-foreground">Proceed to secure checkout</strong> → UPI → scan the
            QR with Google Pay, PhonePe, or Paytm on your phone.
          </span>
        </li>
        <li className="flex gap-3">
          <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>
            <strong className="text-foreground">No phone handy:</strong> use{' '}
            <strong className="text-foreground">Card</strong> in the same checkout.
            {testMode ? (
              <>
                {' '}
                Test card{' '}
                <code className="rounded bg-muted px-1 font-mono text-[0.65rem]">
                  5267 3181 8797 5449
                </code>
                , OTP <code className="rounded bg-muted px-1 font-mono text-[0.65rem]">123456</code>
                , ≤ ₹5,000.
              </>
            ) : null}
          </span>
        </li>
        <li className="flex gap-3">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>
            <strong className="text-foreground">Type your UPI ID:</strong> open this payment page on
            your <strong className="text-foreground">phone browser</strong> (not desktop) — the UPI
            ID field appears there.
          </span>
        </li>
      </ul>
    </div>
  );
}
