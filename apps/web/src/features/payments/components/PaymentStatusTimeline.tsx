'use client';

import { AlertTriangle, CheckCircle2, Circle, Clock } from '@nestlancer/ui/icons';

import { cn } from '@nestlancer/ui';

import { formatPaymentStatusLabel } from '../payment-status-utils';

const STEPS = [
  { key: 'created', label: 'Created' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'completed', label: 'Completed' },
  { key: 'refunded', label: 'Refunded' },
] as const;

function stepIndex(status: string): number {
  const s = status.toLowerCase();
  if (s.includes('fail') || s.includes('cancel')) return -1;
  if (s.includes('refund')) return 4;
  if (s.includes('complete') || s.includes('paid')) return 3;
  if (s.includes('process')) return 2;
  if (s.includes('pending')) return 1;
  return 0;
}

export function PaymentStatusTimeline({ status, canPay }: { status: string; canPay?: boolean }) {
  const current = stepIndex(status);
  const failed = status.toLowerCase().includes('fail') || status.toLowerCase().includes('cancel');

  return (
    <ol className="space-y-0" aria-label="Payment status">
      {STEPS.map((step, i) => {
        const done = !failed && current >= i;
        const active = !failed && current === i;
        const Icon =
          failed && i === Math.max(0, current)
            ? AlertTriangle
            : done
              ? CheckCircle2
              : active
                ? Clock
                : Circle;

        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  failed && i === Math.max(0, current) && 'text-destructive',
                  done && 'text-primary',
                  active && !done && 'text-primary',
                  !done && !active && 'text-muted-foreground/50'
                )}
                aria-hidden
              />
              {i < STEPS.length - 1 ? (
                <span
                  className={cn(
                    'my-1 w-px flex-1 min-h-[1.25rem]',
                    done ? 'bg-primary/40' : 'bg-border'
                  )}
                  aria-hidden
                />
              ) : null}
            </div>
            <div className={cn('pb-4', i === STEPS.length - 1 && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium',
                  (done || active) && 'text-foreground',
                  !done && !active && 'text-muted-foreground'
                )}
              >
                {canPay === false && step.key === 'created' ? 'Not due yet' : step.label}
              </p>
              {active ? (
                <p className="text-xs text-muted-foreground">
                  Current: {formatPaymentStatusLabel(status, { canPay })}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
