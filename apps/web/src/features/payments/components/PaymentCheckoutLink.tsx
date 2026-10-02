'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Lock } from '@nestlancer/ui/icons';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage, parsePaymentIntentResult } from '@nestlancer/api-client';
import { routes } from '@nestlancer/constants';
import { Button, cn } from '@nestlancer/ui';

import { apiServices } from '@/lib/axios';

export interface PaymentCheckoutLinkProps {
  projectId: string;
  milestoneId?: string;
  /** Amount in paise (smallest currency unit). */
  amount: number;
  currency?: string;
  /** When known, links directly to the centralized checkout page. */
  paymentId?: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'compact';
}

/**
 * Routes every pay action to `/payments/[id]` — the single checkout surface.
 * Razorpay opens only from that page, not from scattered entry points.
 */
export function PaymentCheckoutLink({
  projectId,
  milestoneId,
  amount,
  currency = 'INR',
  paymentId,
  label = 'Pay now',
  className,
  variant = 'default',
}: PaymentCheckoutLinkProps) {
  const router = useRouter();
  const [isResolving, setIsResolving] = useState(false);

  const canPay = Boolean(projectId && amount > 0);

  if (paymentId) {
    return (
      <Button
        type="button"
        className={cn(variant === 'default' && 'gap-2', className)}
        disabled={!canPay}
        asChild
      >
        <Link href={routes.payment(paymentId)}>
          {variant === 'default' ? <Lock className="h-4 w-4" aria-hidden /> : null}
          {label}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      className={cn(variant === 'default' && 'gap-2', className)}
      disabled={!canPay || isResolving}
      onClick={() => {
        if (!canPay) return;
        void (async () => {
          setIsResolving(true);
          try {
            const raw = await apiServices.payments.initiate({
              projectId,
              milestoneId,
              amount,
              currency,
            });
            const parsed = parsePaymentIntentResult(raw);
            if (!parsed.id) {
              throw new Error('Payment record was not created');
            }
            router.push(routes.payment(parsed.id));
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Could not open checkout'));
          } finally {
            setIsResolving(false);
          }
        })();
      }}
    >
      {isResolving ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : variant === 'default' ? (
        <Lock className="h-4 w-4" aria-hidden />
      ) : null}
      {isResolving ? 'Opening checkout…' : label}
    </Button>
  );
}
