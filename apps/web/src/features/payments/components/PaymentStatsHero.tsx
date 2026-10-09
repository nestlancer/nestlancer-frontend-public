'use client';

import { useQuery } from '@tanstack/react-query';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import { cn } from '@nestlancer/ui';
import { formatMoneyFromPaise } from '@nestlancer/utils';

import { apiServices } from '@/lib/axios';
import { webMetricStripClass } from '@/lib/tailadmin-classes';

export function PaymentStatsHero({ className }: { className?: string }) {
  const statsQ = useQuery({
    queryKey: queryKeys.payments.stats,
    queryFn: () => apiServices.payments.getStats(),
  });

  const stats = statsQ.data;
  // NL-BUG-UI-015: never coerce a failed fetch to ₹0.00 — that reads as "never paid".
  const showPlaceholders = statsQ.isPending || statsQ.isError;
  const placeholder = (
    <span className="inline-block h-6 w-20 animate-pulse rounded bg-muted" aria-hidden />
  );

  const tiles = [
    {
      label: 'Total paid',
      value: showPlaceholders
        ? placeholder
        : formatMoneyFromPaise(Number(stats?.totalSpent ?? 0), 'INR', 'en-IN'),
    },
    {
      label: 'Pending',
      value: showPlaceholders
        ? placeholder
        : formatMoneyFromPaise(Number(stats?.pending ?? 0), 'INR', 'en-IN'),
    },
    {
      label: 'In dispute',
      value: showPlaceholders
        ? placeholder
        : formatMoneyFromPaise(Number(stats?.inDispute ?? 0), 'INR', 'en-IN'),
    },
  ];

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
      <div className={cn(webMetricStripClass, 'sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-3')}>
        {tiles.map((t) => (
          <div key={t.label} className="px-3.5 py-2.5">
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{t.label}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white/90">
              {t.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
