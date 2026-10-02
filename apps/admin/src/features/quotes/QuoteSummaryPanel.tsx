'use client';

import { formatCurrency } from '@nestlancer/utils';
import { cn } from '@nestlancer/ui';

import type { QuoteFormTab } from '@/features/quotes/quote-builder-types';

type QuoteSummaryPanelProps = {
  currency: string;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  grandTotal: number;
  lineCount: number;
  phaseCount: number;
  budgetHint?: string | null;
  activeStep: QuoteFormTab;
  validUntil?: string;
  className?: string;
};

const STEPS: { id: QuoteFormTab; label: string }[] = [
  { id: 'items', label: 'Scope & line items' },
  { id: 'pricing', label: 'Pricing & schedule' },
  { id: 'terms', label: 'Terms & review' },
];

export function QuoteSummaryPanel({
  currency,
  subtotal,
  taxPercentage,
  taxAmount,
  grandTotal,
  lineCount,
  phaseCount,
  budgetHint,
  activeStep,
  validUntil,
  className,
}: QuoteSummaryPanelProps) {
  const stepIndex = STEPS.findIndex((s) => s.id === activeStep);

  return (
    <aside
      className={cn('rounded-xl border border-border/70 bg-muted/15 p-4 shadow-sm', className)}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Quote summary
      </p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {formatCurrency(grandTotal, currency)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {lineCount} priced line{lineCount === 1 ? '' : 's'} · {phaseCount} phase
        {phaseCount === 1 ? '' : 's'}
      </p>

      {budgetHint ? (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
          Client budget: {budgetHint}
        </p>
      ) : null}

      <dl className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium tabular-nums">{formatCurrency(subtotal, currency)}</dd>
        </div>
        {subtotal > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Tax ({taxPercentage}%)</dt>
            <dd className="font-medium tabular-nums">{formatCurrency(taxAmount, currency)}</dd>
          </div>
        ) : null}
        {validUntil ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Valid until</dt>
            <dd className="text-xs">{validUntil}</dd>
          </div>
        ) : null}
      </dl>

      <ol
        className="mt-4 space-y-2 border-t border-border/60 pt-4"
        aria-label="Quote builder steps"
      >
        {STEPS.map((step, i) => {
          const done = i < stepIndex;
          const current = step.id === activeStep;
          return (
            <li
              key={step.id}
              className={cn(
                'flex items-center gap-2 text-xs',
                current ? 'font-semibold text-foreground' : 'text-muted-foreground'
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  current
                    ? 'bg-primary text-primary-foreground'
                    : done
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {done ? '✓' : i + 1}
              </span>
              {step.label}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
