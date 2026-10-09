'use client';

import Link from 'next/link';
import { Skeleton, cn } from '@nestlancer/ui';
import { formatMoneyFromPaise } from '@nestlancer/utils';

import { webPanelClass, webPrimaryTextClass } from '@/lib/tailadmin-classes';

type DashboardWorkspaceChartProps = {
  projectsActive: number;
  projectsCompleted: number;
  openRequests: number;
  pendingQuotes: number;
  totalSpent: number;
  pendingPayments: number;
  className?: string;
  loading?: boolean;
  payHref?: string;
  /** Tighter layout for denser dashboards. */
  compact?: boolean;
};

type PipeRow = { label: string; value: number; tone: string };

/** Compile-time width steps so bar length does not need a style attribute. */
function pipeWidthClass(pct: number): string {
  if (pct <= 0) return 'w-0';
  if (pct < 15) return 'w-[8%]';
  if (pct < 25) return 'w-1/5';
  if (pct < 35) return 'w-1/3';
  if (pct < 45) return 'w-2/5';
  if (pct < 55) return 'w-1/2';
  if (pct < 65) return 'w-3/5';
  if (pct < 75) return 'w-[70%]';
  if (pct < 85) return 'w-4/5';
  if (pct < 95) return 'w-[90%]';
  return 'w-full';
}

export function DashboardWorkspaceChart({
  projectsActive,
  projectsCompleted,
  openRequests,
  pendingQuotes,
  totalSpent,
  pendingPayments,
  className,
  loading,
  payHref,
  compact = true,
}: DashboardWorkspaceChartProps) {
  if (loading) {
    return (
      <div className={cn(webPanelClass, compact ? 'p-4' : 'p-5 md:p-6', className)}>
        <Skeleton className="h-4 w-48" />
        <div className="mt-3 space-y-2.5">
          <Skeleton className="h-6 w-full rounded-lg" />
          <Skeleton className="h-6 w-full rounded-lg" />
          <Skeleton className="h-6 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const pipeline: PipeRow[] = [
    { label: 'Active', value: projectsActive, tone: 'bg-ta-brand-500' },
    { label: 'Done', value: projectsCompleted, tone: 'bg-sky-400' },
    { label: 'Requests', value: openRequests, tone: 'bg-amber-400' },
    { label: 'Quotes', value: pendingQuotes, tone: 'bg-slate-400' },
  ];
  const maxPipe = Math.max(1, ...pipeline.map((p) => p.value));

  return (
    <div
      className={cn(
        webPanelClass,
        'relative overflow-hidden',
        compact ? 'p-4' : 'p-5 md:p-6',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.1),transparent_70%)]"
        aria-hidden
      />
      <div className="relative mb-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ta-brand-600 dark:text-ta-brand-400">
            Workspace pulse
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-white/90">
            Pipeline & billing
          </h2>
        </div>
      </div>

      <div className={cn('relative', compact ? 'space-y-2' : 'space-y-3')}>
        {pipeline.map((row) => {
          const pct = Math.round((row.value / maxPipe) * 100);
          return (
            <div key={row.label} className="flex items-center gap-3">
              <p className="w-16 shrink-0 text-xs font-medium text-gray-700 dark:text-white/80">
                {row.label}
              </p>
              <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-sm bg-gray-100/70 dark:bg-gray-800/60">
                <div
                  className={cn(
                    'h-full rounded-sm transition-all duration-700',
                    row.tone,
                    pipeWidthClass(row.value > 0 ? Math.max(pct, 8) : 0)
                  )}
                />
              </div>
              <p className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-gray-800 dark:text-white/90">
                {row.value}
              </p>
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          'relative grid gap-0 divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0',
          compact ? 'mt-3 pt-3' : 'mt-5 pt-4'
        )}
      >
        <div className="pe-0 sm:pe-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Collected
          </p>
          <p
            className={cn(
              'mt-0.5 text-sm font-bold tabular-nums tracking-tight',
              webPrimaryTextClass
            )}
          >
            {formatMoneyFromPaise(totalSpent, 'INR', 'en-IN')}
          </p>
        </div>
        <div className="ps-0 pt-3 sm:ps-4 sm:pt-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-600 dark:text-amber-400">
            Pending
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums tracking-tight text-amber-700 dark:text-amber-300">
            {formatMoneyFromPaise(pendingPayments, 'INR', 'en-IN')}
          </p>
          {pendingPayments > 0 && payHref ? (
            <Link
              href={payHref}
              className="mt-0.5 inline-block text-[11px] font-medium text-amber-600 underline-offset-2 hover:underline dark:text-amber-400"
            >
              Complete checkout →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
