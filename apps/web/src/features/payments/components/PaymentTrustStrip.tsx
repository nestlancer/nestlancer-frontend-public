'use client';

import { Lock, ShieldCheck, Smartphone } from '@nestlancer/ui/icons';

import { cn } from '@nestlancer/ui';

const METHODS = ['UPI', 'Cards', 'Netbanking', 'Wallets'] as const;

export function PaymentTrustStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">Secured by Razorpay</p>
          <p className="text-xs text-muted-foreground">
            256-bit encryption · PCI-DSS compliant checkout
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {METHODS.map((m) => (
          <span
            key={m}
            className="rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {m}
          </span>
        ))}
        <span className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" aria-hidden />
          <Smartphone className="h-3 w-3 sm:hidden" aria-hidden />
        </span>
      </div>
    </div>
  );
}
