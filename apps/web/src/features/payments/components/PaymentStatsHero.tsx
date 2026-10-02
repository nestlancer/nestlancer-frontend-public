'use client';

import { useQuery } from '@tanstack/react-query';
import { Check, Clock, AlertTriangle } from '@nestlancer/ui/icons';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import { cn, StatCard } from '@nestlancer/ui';
import { formatMoneyFromPaise } from '@nestlancer/utils';

import { apiServices } from '@/lib/axios';

export function PaymentStatsHero({ className }: { className?: string }) {
  const statsQ = useQuery({
    queryKey: queryKeys.payments.stats,
    queryFn: () => apiServices.payments.getStats(),
  });

  const stats = statsQ.data;
  // NL-BUG-UI-015: never coerce a failed fetch to ₹0.00 — that reads as "never paid".
  const showPlaceholders = statsQ.isPending || statsQ.isError;
  const placeholder = (
    <span className="inline-block h-8 w-24 animate-pulse rounded bg-muted" aria-hidden />
  );

  return (
    <section className={cn('space-y-3', className)}>
      {statsQ.isError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>{getApiErrorMessage(statsQ.error, 'Could not load payment stats')}</span>
          <button
            type="button"
            className="font-medium underline underline-offset-2 hover:no-underline"
            onClick={() => void statsQ.refetch()}
          >
            Retry
          </button>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total paid"
          value={
            showPlaceholders
              ? placeholder
              : formatMoneyFromPaise(Number(stats?.totalSpent ?? 0), 'INR', 'en-IN')
          }
          icon={<Check className="h-5 w-5" aria-hidden />}
          iconVariant="success"
          stagger={1}
        />
        <StatCard
          label="Pending"
          value={
            showPlaceholders
              ? placeholder
              : formatMoneyFromPaise(Number(stats?.pending ?? 0), 'INR', 'en-IN')
          }
          icon={<Clock className="h-5 w-5" aria-hidden />}
          iconVariant="warning"
          stagger={2}
        />
        <StatCard
          label="In dispute"
          value={
            showPlaceholders
              ? placeholder
              : formatMoneyFromPaise(Number(stats?.inDispute ?? 0), 'INR', 'en-IN')
          }
          icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
          iconVariant="info"
          stagger={3}
        />
      </div>
    </section>
  );
}
