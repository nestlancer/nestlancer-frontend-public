'use client';

import { useState } from 'react';
import { CheckCircle2, FileText, Loader2, Receipt, Sparkles } from '@nestlancer/ui/icons';

import { cn } from '@nestlancer/ui';
import { formatMoneyFromPaise } from '@nestlancer/utils';

import { webPanelClass, webPrimaryButtonClass } from '@/lib/tailadmin-classes';

import { OfflineBankTransferPanel } from './OfflineBankTransferPanel';
import { PaymentButton } from './PaymentButton';
import { PaymentTrustStrip } from './PaymentTrustStrip';
import { UpiIdCheckoutSection } from './UpiIdCheckoutSection';

export interface PaymentCheckoutPanelProps {
  amount: number;
  currency?: string;
  status: string;
  /** Client-facing status label (e.g. Not due yet). Falls back to raw status. */
  statusLabel?: string;
  projectId?: string;
  milestoneId?: string;
  projectTitle?: string;
  milestoneName?: string;
  paymentId?: string;
  createdAt?: string;
  canPay: boolean;
  /** Shown when checkout is blocked by payment gate (e.g. PAYMENT_GATE_001). */
  gateMessage?: string | null;
  canCancel?: boolean;
  onCancel?: () => void;
  cancelPending?: boolean;
  onPaySuccess?: () => void;
  onOpenReceipt?: () => void;
  onOpenInvoice?: () => void;
  className?: string;
}

type PayRail = 'razorpay' | 'offline';

export function PaymentCheckoutPanel({
  amount,
  currency = 'INR',
  status,
  statusLabel,
  projectId,
  milestoneId,
  projectTitle,
  milestoneName,
  paymentId,
  createdAt,
  canPay,
  gateMessage,
  canCancel,
  onCancel,
  cancelPending,
  onPaySuccess,
  onOpenReceipt,
  onOpenInvoice,
  className,
}: PaymentCheckoutPanelProps) {
  const [rail, setRail] = useState<PayRail>('razorpay');
  const formatted = formatMoneyFromPaise(amount, currency, currency === 'INR' ? 'en-IN' : 'en-US');
  const statusLower = status.toLowerCase();
  const isComplete = ['completed', 'paid', 'success'].includes(statusLower);
  const isRefunded = statusLower.includes('refund');
  const isAwaitingVerification =
    statusLower === 'pending_verification' || statusLower.includes('pending_verification');

  return (
    <div className={cn('space-y-6', className)}>
      <div className={cn(webPanelClass, 'relative overflow-hidden')}>
        <div className="absolute inset-x-0 top-0 h-1 bg-ta-brand-500" />
        <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-5 dark:border-gray-800 dark:bg-white/[0.02] sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Order summary
              </p>
              {projectTitle ? (
                <h3 className="font-display mt-1 text-xl font-semibold tracking-tight text-foreground">
                  {projectTitle}
                </h3>
              ) : null}
              {milestoneName ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                  {milestoneName}
                </p>
              ) : null}
            </div>
            {isRefunded ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-900 ring-1 ring-sky-500/25 dark:text-sky-100">
                Refunded
              </span>
            ) : isComplete ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-500/25 dark:text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Paid
              </span>
            ) : isAwaitingVerification ? (
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-500/30 dark:text-amber-100">
                Awaiting verification
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold capitalize text-amber-900 ring-1 ring-amber-500/30 dark:text-amber-100">
                {statusLabel ?? status.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4 px-6 py-6 sm:px-8">
          <div className="flex items-end justify-between gap-4 border-b border-dashed border-border/80 pb-4">
            <span className="text-sm text-muted-foreground">Amount due</span>
            <span className="font-display text-3xl font-semibold tabular-nums tracking-tight text-foreground sm:text-4xl">
              {formatted}
            </span>
          </div>

          <ul className="space-y-2.5 text-sm">
            <LineItem label="Currency" value={currency} />
            {paymentId ? <LineItem label="Reference" value={paymentId} mono /> : null}
            {createdAt ? (
              <LineItem label="Created" value={new Date(createdAt).toLocaleString()} />
            ) : null}
          </ul>

          {isAwaitingVerification ? (
            <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-950 dark:text-amber-100">
              Your bank/UPI transfer was submitted and is waiting for Nestlancer to verify the
              receipt. You will be notified when it is approved or if more information is needed.
            </p>
          ) : canPay && projectId && milestoneId ? (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border p-1">
                <button
                  type="button"
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    rail === 'razorpay'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted/60'
                  )}
                  onClick={() => setRail('razorpay')}
                >
                  Pay online
                </button>
                <button
                  type="button"
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    rail === 'offline'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted/60'
                  )}
                  onClick={() => setRail('offline')}
                >
                  Bank / UPI transfer
                </button>
              </div>

              {rail === 'razorpay' ? (
                <>
                  <PaymentButton
                    projectId={projectId}
                    milestoneId={milestoneId}
                    amount={amount}
                    currency={currency}
                    description={
                      milestoneName
                        ? `${projectTitle ?? 'Project'} — ${milestoneName}`
                        : (projectTitle ?? 'Nestlancer project payment')
                    }
                    label="Proceed to secure checkout"
                    className={cn(
                      'h-12 w-full rounded-xl text-base font-semibold',
                      webPrimaryButtonClass
                    )}
                    onSuccess={onPaySuccess}
                  />
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Card, netbanking, wallets, or UPI (QR) in Razorpay&apos;s secure window
                  </p>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden>
                      <div className="w-full border-t border-border/80" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wider">
                      <span className="bg-card px-3 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <UpiIdCheckoutSection
                    projectId={projectId}
                    milestoneId={milestoneId}
                    amount={amount}
                    currency={currency}
                    description={
                      milestoneName
                        ? `${projectTitle ?? 'Project'} — ${milestoneName}`
                        : (projectTitle ?? 'Nestlancer project payment')
                    }
                    onSuccess={onPaySuccess}
                  />
                </>
              ) : (
                <OfflineBankTransferPanel
                  amount={amount}
                  currency={currency}
                  projectId={projectId}
                  milestoneId={milestoneId}
                  onSuccess={onPaySuccess}
                />
              )}
            </div>
          ) : canPay && projectId ? (
            <div className="pt-2">
              <PaymentButton
                projectId={projectId}
                milestoneId={milestoneId}
                amount={amount}
                currency={currency}
                description={
                  milestoneName
                    ? `${projectTitle ?? 'Project'} — ${milestoneName}`
                    : (projectTitle ?? 'Nestlancer project payment')
                }
                label="Proceed to secure checkout"
                className={cn(
                  'h-12 w-full rounded-xl text-base font-semibold',
                  webPrimaryButtonClass
                )}
                onSuccess={onPaySuccess}
              />
            </div>
          ) : isRefunded ? (
            <p className="rounded-xl bg-sky-500/10 px-4 py-3 text-center text-sm text-sky-900 dark:text-sky-100">
              This payment has been refunded. Funds will return to your original payment method per
              your bank or wallet timeline.
            </p>
          ) : isComplete ? (
            <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-900 dark:text-emerald-100">
              This payment has been recorded. Download your receipt or invoice below.
            </p>
          ) : gateMessage ? (
            <div
              role="status"
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
            >
              <p className="font-medium">Checkout not available yet</p>
              <p className="mt-1 leading-relaxed">{gateMessage}</p>
              <p className="mt-2 text-xs opacity-90">
                Approve the milestone delivery from your project hub, or wait until Nestlancer
                requests this installment.
              </p>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No further action is required for this payment.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {onOpenReceipt ? (
          <DocButton icon={Receipt} label="Receipt" onClick={onOpenReceipt} />
        ) : null}
        {onOpenInvoice ? (
          <DocButton icon={FileText} label="Invoice" onClick={onOpenInvoice} />
        ) : null}
        {canCancel && onCancel ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-destructive/40 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
            disabled={cancelPending}
            onClick={onCancel}
          >
            {cancelPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Cancel payment
          </button>
        ) : null}
      </div>

      {canPay ? <PaymentTrustStrip /> : null}
    </div>
  );
}

function LineItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <li className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium text-foreground', mono && 'font-mono text-xs')}>
        {value}
      </span>
    </li>
  );
}

function DocButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Receipt;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-4 py-2.5 text-sm font-medium transition-theme hover:border-primary/40 hover:bg-muted/50"
      onClick={onClick}
    >
      <Icon className="h-4 w-4 text-primary" aria-hidden />
      {label}
    </button>
  );
}
