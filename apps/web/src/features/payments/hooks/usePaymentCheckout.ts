'use client';

import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';
import { analyticsEvents } from '@nestlancer/constants';
import { paymentIntentSchema } from '@nestlancer/validators';

import { getApiErrorCode, getApiErrorMessage } from '@nestlancer/api-client';
import { getAccessTokenExpiresAt, hasTokens, trySilentRefresh, useAuth } from '@nestlancer/auth';

import { apiServices } from '@/lib/axios';
import { trackEvent } from '@/lib/telemetry';

import { confirmCheckoutPayment } from '../lib/confirm-checkout-payment';
import { paymentsDebug, paymentsDebugError } from '../payments-debug';

import {
  buildRazorpayCheckoutOptions,
  type RazorpayCheckoutMode,
} from '../lib/build-razorpay-options';
import { formatRazorpayContact } from '../lib/format-razorpay-contact';
import { loadRazorpayScript } from '../lib/load-razorpay';
import type { RazorpayCheckoutResponse } from '../types/razorpay';

const PAYMENT_GATE_CODE_PREFIX = 'PAYMENT_GATE_';

function paymentGateToastMessage(code: string | null, fallback: string): string {
  if (code === 'PAYMENT_GATE_001') {
    return 'Payment is available after you approve the milestone or when the studio requests payment.';
  }
  if (code?.startsWith(PAYMENT_GATE_CODE_PREFIX)) {
    return fallback;
  }
  return fallback;
}

async function resolveCheckoutContact(
  currency: string,
  userPhone?: string | null
): Promise<string | undefined> {
  const fromSession = formatRazorpayContact(userPhone, currency);
  if (fromSession) return fromSession;

  try {
    const profile = await apiServices.users.getProfile();
    return formatRazorpayContact(profile.phone, currency);
  } catch {
    return undefined;
  }
}

async function ensureCheckoutAuth(): Promise<void> {
  const expiresAt = getAccessTokenExpiresAt();
  const nearExpiry = expiresAt != null && Date.now() >= expiresAt - 60_000;
  if (!hasTokens() || nearExpiry) {
    const ok = await trySilentRefresh();
    if (!ok && !hasTokens()) {
      throw new Error('Session expired — sign in again to pay.');
    }
  }
}

async function pollPaymentCompleted(paymentId: string, timeoutMs = 30_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const status = await apiServices.payments.getStatus(paymentId);
      const row = status && typeof status === 'object' ? (status as Record<string, unknown>) : null;
      const paymentStatus =
        (row?.status as string | undefined) ??
        ((row?.data as Record<string, unknown> | undefined)?.status as string | undefined);
      if (paymentStatus === 'COMPLETED') return true;
    } catch {
      // keep polling
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

export interface PaymentCheckoutParams {
  projectId: string;
  milestoneId?: string;
  /** Amount in paise (smallest currency unit), matching API/DB. */
  amount: number;
  currency?: string;
  paymentMethodId?: string;
  description?: string;
  /** `upi-collect` opens Razorpay with UPI ID / VPA text field instead of QR-only. */
  checkoutMode?: RazorpayCheckoutMode;
  /** Customer UPI ID when using `upi-collect` (optional prefill). */
  upiVpa?: string;
}

export function usePaymentCheckout(options?: { onSuccess?: () => void }) {
  const { user } = useAuth();
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);

  const confirmM = useMutation({
    mutationFn: (payload: {
      paymentIntentId: string;
      externalPaymentId: string;
      signature: string;
    }) => apiServices.payments.confirm(payload),
  });

  const checkout = useCallback(
    async (params: PaymentCheckoutParams) => {
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
      if (!keyId) {
        toast.error('Payment is not configured. Missing Razorpay key.');
        throw new Error('NEXT_PUBLIC_RAZORPAY_KEY_ID is not set');
      }

      setIsOpeningCheckout(true);
      try {
        paymentsDebug('checkout:start', {
          projectId: params.projectId,
          milestoneId: params.milestoneId ?? null,
          amount: params.amount,
          currency: params.currency ?? 'INR',
          mode: params.checkoutMode ?? 'standard',
        });
        trackEvent(analyticsEvents.paymentCheckoutStarted, {
          projectId: params.projectId,
          milestoneId: params.milestoneId ?? null,
          amount: params.amount,
          mode: params.checkoutMode ?? 'standard',
        });
        const parsedIntent = paymentIntentSchema.safeParse({
          amount: params.amount,
          currency: params.currency ?? 'INR',
        });
        if (!parsedIntent.success) {
          toast.error(parsedIntent.error.issues[0]?.message ?? 'Invalid payment amount.');
          throw new Error('Invalid payment intent');
        }

        await ensureCheckoutAuth();

        const intent = await apiServices.payments.createIntent({
          projectId: params.projectId,
          milestoneId: params.milestoneId,
          amount: parsedIntent.data.amount,
          currency: parsedIntent.data.currency,
          paymentMethodId: params.paymentMethodId,
        });
        const nestlancerPaymentId = intent.id;
        paymentsDebug('checkout:intent-created', {
          paymentIntentId: intent.id,
          orderId: intent.clientSecret,
          amount: intent.amount,
          currency: intent.currency,
        });
        const orderId = intent.clientSecret;
        if (!orderId) {
          throw new Error(
            'Payment intent did not return an order id. The payment service may be misconfigured.'
          );
        }

        await loadRazorpayScript();
        if (!window.Razorpay) {
          throw new Error('Razorpay checkout failed to initialize');
        }

        const amountPaise = Math.round(
          typeof intent.amount === 'number' ? intent.amount : params.amount
        );
        const currency = intent.currency ?? params.currency ?? 'INR';
        const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
        const checkoutMode = params.checkoutMode ?? 'standard';
        const contact = await resolveCheckoutContact(currency, user?.phone);

        if (!contact) {
          toast.error(
            'Add a valid Indian mobile number in Profile before paying. Razorpay requires it at checkout.'
          );
          throw new Error('Missing checkout contact phone');
        }

        await new Promise<void>((resolve, reject) => {
          const rzpOptions = buildRazorpayCheckoutOptions({
            keyId,
            orderId,
            amountPaise,
            currency,
            description: params.description ?? 'Project milestone payment',
            mode: checkoutMode,
            upiVpa: params.upiVpa,
            prefill: {
              name: displayName || undefined,
              email: user?.email,
              contact,
            },
            readonlyContact: true,
            notes: {
              project_id: params.projectId,
              ...(params.milestoneId ? { milestone_id: params.milestoneId } : {}),
            },
            onSuccess: async (response: RazorpayCheckoutResponse) => {
              try {
                paymentsDebug('checkout:razorpay-success', {
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                });
                await confirmCheckoutPayment(
                  (payload) => confirmM.mutateAsync(payload),
                  {
                    paymentIntentId: response.razorpay_order_id,
                    externalPaymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                  },
                  { hasAccessToken: hasTokens, refreshSession: trySilentRefresh }
                );
                paymentsDebug('checkout:confirm-success', {
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                });
                trackEvent(analyticsEvents.paymentCheckoutCompleted, {
                  projectId: params.projectId,
                  milestoneId: params.milestoneId ?? null,
                  paymentIntentId: response.razorpay_order_id,
                });
                toast.success('Payment completed successfully');
                options?.onSuccess?.();
                resolve();
              } catch (err) {
                if (nestlancerPaymentId) {
                  const healed = await pollPaymentCompleted(nestlancerPaymentId);
                  if (healed) {
                    paymentsDebug('checkout:poll-healed', { paymentId: nestlancerPaymentId });
                    toast.success('Payment completed successfully');
                    options?.onSuccess?.();
                    resolve();
                    return;
                  }
                }
                paymentsDebugError('checkout:confirm-error', err, {
                  orderId: response.razorpay_order_id,
                });
                trackEvent(analyticsEvents.paymentCheckoutFailed, {
                  projectId: params.projectId,
                  milestoneId: params.milestoneId ?? null,
                  stage: 'confirm',
                  message: err instanceof Error ? err.message : 'unknown',
                });
                toast.error(getApiErrorMessage(err, 'Payment confirmation failed'));
                reject(err);
              }
            },
            onDismiss: () => {
              paymentsDebug('checkout:dismissed', {
                projectId: params.projectId,
                milestoneId: params.milestoneId ?? null,
              });
              toast.message('Checkout closed');
              reject(new Error('Payment cancelled'));
            },
          });

          const rzp = new window.Razorpay!(rzpOptions);
          rzp.on('payment.failed', (response) => {
            const reason = response?.error?.reason;
            const description = response?.error?.description?.trim();
            paymentsDebugError('checkout:razorpay-failed', new Error('payment.failed'), {
              projectId: params.projectId,
              milestoneId: params.milestoneId ?? null,
              reason: reason ?? null,
              description: description ?? null,
            });
            trackEvent(analyticsEvents.paymentCheckoutFailed, {
              projectId: params.projectId,
              milestoneId: params.milestoneId ?? null,
              stage: 'gateway',
              message: reason ?? description ?? 'payment.failed',
            });
            let message = description || 'Payment failed. Try again or use another method.';
            if (reason === 'international_transaction_not_allowed') {
              message =
                'This account accepts domestic (Indian) cards only. Clear browser autofill and try a domestic card, or pay with UPI.';
            }
            toast.error(message);
            reject(new Error(message));
          });
          rzp.open();
        });
      } catch (err) {
        paymentsDebugError('checkout:error', err, {
          projectId: params.projectId,
          milestoneId: params.milestoneId ?? null,
        });
        trackEvent(analyticsEvents.paymentCheckoutFailed, {
          projectId: params.projectId,
          milestoneId: params.milestoneId ?? null,
          stage: 'start',
          message: err instanceof Error ? err.message : 'unknown',
        });
        if (err instanceof Error && err.message === 'Payment cancelled') {
          throw err;
        }
        const code = getApiErrorCode(err);
        const apiMessage = getApiErrorMessage(err, 'Could not start checkout');
        const message = paymentGateToastMessage(code, apiMessage);
        toast.error(message, {
          title: code?.startsWith(PAYMENT_GATE_CODE_PREFIX)
            ? 'Checkout not available yet'
            : undefined,
          duration: code?.startsWith(PAYMENT_GATE_CODE_PREFIX) ? 10_000 : 6_000,
        });
        throw err;
      } finally {
        setIsOpeningCheckout(false);
      }
    },
    [confirmM, options, user]
  );

  return {
    checkout,
    isProcessing: isOpeningCheckout || confirmM.isPending,
  };
}
