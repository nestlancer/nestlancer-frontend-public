'use client';

import { Loader2, Lock } from '@nestlancer/ui/icons';

import { Button, cn } from '@nestlancer/ui';

import { usePaymentCheckout, type PaymentCheckoutParams } from '../hooks/usePaymentCheckout';

/** Opens Razorpay directly — use only on `/payments/[id]` (PaymentCheckoutPanel). */
export interface PaymentButtonProps extends PaymentCheckoutParams {
  label?: string;
  className?: string;
  onSuccess?: () => void;
  variant?: 'default' | 'compact';
}

export function PaymentButton({
  label = 'Pay now',
  className,
  onSuccess,
  variant = 'default',
  projectId,
  milestoneId,
  amount,
  currency,
  paymentMethodId,
  description,
}: PaymentButtonProps) {
  const { checkout, isProcessing } = usePaymentCheckout({ onSuccess });

  const canPay = Boolean(projectId && amount > 0);

  return (
    <Button
      type="button"
      className={cn(variant === 'default' && 'gap-2', className)}
      disabled={!canPay || isProcessing}
      onClick={() => {
        if (!canPay) return;
        void checkout({
          projectId,
          milestoneId,
          amount,
          currency,
          paymentMethodId,
          description,
        }).catch(() => {
          /* toast + debug logging handled in usePaymentCheckout */
        });
      }}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : variant === 'default' ? (
        <Lock className="h-4 w-4" aria-hidden />
      ) : null}
      {isProcessing ? 'Opening checkout…' : label}
    </Button>
  );
}
