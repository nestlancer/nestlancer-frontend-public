'use client';

import { useEffect, useState } from 'react';
import { Smartphone } from '@nestlancer/ui/icons';

import { FormFieldLabel } from '@nestlancer/field-help';
import { cn } from '@nestlancer/ui';

import { isLikelyUpiVpa } from '../lib/build-razorpay-options';
import { supportsUpiIdFieldEntry } from '../lib/payment-device';
import { shouldShowTestPaymentCredentials } from '../lib/razorpay-test-mode';
import { usePaymentCheckout, type PaymentCheckoutParams } from '../hooks/usePaymentCheckout';

import { DesktopUpiPayGuide } from './DesktopUpiPayGuide';

export interface UpiIdCheckoutSectionProps extends Pick<
  PaymentCheckoutParams,
  'projectId' | 'milestoneId' | 'amount' | 'currency' | 'description'
> {
  className?: string;
  onSuccess?: () => void;
}

export function UpiIdCheckoutSection({
  projectId,
  milestoneId,
  amount,
  currency,
  description,
  className,
  onSuccess,
}: UpiIdCheckoutSectionProps) {
  const [upiId, setUpiId] = useState('');
  const [canUseUpiIdField, setCanUseUpiIdField] = useState<boolean | null>(null);
  const { checkout, isProcessing } = usePaymentCheckout({ onSuccess });

  useEffect(() => {
    setCanUseUpiIdField(supportsUpiIdFieldEntry());
  }, []);

  const canPay = Boolean(projectId && amount > 0);
  const vpaValid = upiId.trim().length === 0 || isLikelyUpiVpa(upiId);

  if (canUseUpiIdField === null) {
    return (
      <div className={cn('h-32 animate-pulse rounded-2xl bg-muted/40', className)} aria-hidden />
    );
  }

  if (!canUseUpiIdField) {
    return <DesktopUpiPayGuide className={className} />;
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/8 via-background to-background p-5',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
          <Smartphone className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-sm font-semibold text-foreground">Pay with UPI ID</h4>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Enter your UPI ID (VPA), for example{' '}
            <span className="font-mono text-foreground/80">yourname@okicici</span>, then approve the
            request in your UPI app.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <FormFieldLabel fieldKey="payments.upiId" label="Your UPI ID">
          Your UPI ID
        </FormFieldLabel>
        <input
          type="text"
          inputMode="email"
          autoComplete="off"
          spellCheck={false}
          placeholder="yourname@okicici"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          className={cn(
            'mt-1.5 w-full rounded-xl border bg-background px-4 py-3 font-mono text-sm transition-theme',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            !vpaValid ? 'border-destructive/60' : 'border-border'
          )}
        />
        {!vpaValid ? (
          <p className="mt-1 text-xs text-destructive">
            Enter a valid UPI ID (e.g. name@bankhandle)
          </p>
        ) : null}
      </div>

      <button
        type="button"
        disabled={!canPay || isProcessing || upiId.trim().length === 0 || !isLikelyUpiVpa(upiId)}
        className={cn(
          'mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/40',
          'bg-background text-sm font-semibold text-primary transition-theme',
          'hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50'
        )}
        onClick={() => {
          if (!canPay) return;
          const trimmed = upiId.trim();
          if (!isLikelyUpiVpa(trimmed)) return;
          void checkout({
            projectId,
            milestoneId,
            amount,
            currency,
            description,
            checkoutMode: 'upi-collect',
            upiVpa: trimmed,
          });
        }}
      >
        {isProcessing ? 'Opening UPI checkout…' : 'Continue with UPI ID'}
      </button>

      {shouldShowTestPaymentCredentials() ? (
        <p className="mt-2 text-center text-[0.65rem] text-muted-foreground">
          Test mode: use <code className="rounded bg-muted px-1 font-mono">success@razorpay</code>
        </p>
      ) : null}
    </div>
  );
}
