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
    { label: 'Quotes', value: pendingQuotes, tone: 'bg-violet-400' },
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
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(45,212,191,0.14),transparent_70%)]"
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

      <div className={cn('relative', compact ? 'space-y-2' : 'space-y-4')}>
        {pipeline.map((row) => {
          const pct = Math.round((row.value / maxPipe) * 100);
          return (
            <div key={row.label} className="flex items-center gap-3">
              <p className="w-16 shrink-0 text-xs font-medium text-gray-700 dark:text-white/80">
                {row.label}
              </p>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
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

      <div className={cn('relative grid gap-2 sm:grid-cols-2', compact ? 'mt-3' : 'mt-6')}>
        <div className="rounded-lg border border-gray-200/80 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700 dark:bg-white/[0.03]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            Collected
          </p>
          <p
            className={cn(
              'mt-0.5 text-base font-bold tabular-nums tracking-tight',
              webPrimaryTextClass
            )}
          >
            {formatMoneyFromPaise(totalSpent, 'INR', 'en-IN')}
          </p>
        </div>
        <div className="rounded-lg border border-amber-200/70 bg-amber-50/70 px-3 py-2.5 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800/80 dark:text-amber-200/80">
            Pending
          </p>
          <p className="mt-0.5 text-base font-bold tabular-nums tracking-tight text-amber-900 dark:text-amber-100">
            {formatMoneyFromPaise(pendingPayments, 'INR', 'en-IN')}
          </p>
          {pendingPayments > 0 && payHref ? (
            <Link
              href={payHref}
              className="mt-1 inline-block text-[11px] font-semibold text-amber-800 underline-offset-2 hover:underline dark:text-amber-200"
            >
              Complete checkout →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
