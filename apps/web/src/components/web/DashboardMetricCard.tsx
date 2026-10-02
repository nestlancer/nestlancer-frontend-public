import Link from 'next/link';
import type { ReactNode } from 'react';

import { BadgeDelta, cn, type DeltaType } from '@nestlancer/ui';
import { ArrowRight } from '@nestlancer/ui/icons';

import { webPanelClass } from '@/lib/tailadmin-classes';

type DashboardMetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  delta?: { deltaType: DeltaType; text: string };
  icon: ReactNode;
  href: string;
  className?: string;
  /** Larger “north star” tile (Mercury / Stripe pattern). */
  featured?: boolean;
  /** Tighter padding for denser dashboards. */
  compact?: boolean;
};

export function DashboardMetricCard({
  label,
  value,
  hint,
  delta,
  icon,
  href,
  className,
  featured,
  compact,
}: DashboardMetricCardProps) {
  return (
    <Link href={href} className="group block h-full">
      <div
        className={cn(
          webPanelClass,
          'relative h-full overflow-hidden transition-theme',
          compact ? 'p-3.5 md:p-4' : 'p-5 md:p-6',
          'group-hover:-translate-y-0.5 group-hover:border-ta-brand-500/45 group-hover:shadow-md',
          featured &&
            'bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.14),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(45,212,191,0.16),transparent_55%)]',
          className
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              'flex items-center justify-center rounded-xl bg-ta-brand-50 text-ta-brand-600 ring-1 ring-ta-brand-500/15',
              'dark:bg-ta-brand-500/[0.12] dark:text-ta-brand-400',
              compact ? 'h-8 w-8' : featured ? 'h-12 w-12' : 'h-11 w-11'
            )}
          >
            {icon}
          </div>
          <ArrowRight
            className={cn(
              'text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-500',
              compact ? 'h-3.5 w-3.5' : 'h-4 w-4'
            )}
            aria-hidden
          />
        </div>
        <div className={compact ? 'mt-2.5' : 'mt-5'}>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
            {label}
          </span>
          <h3
            className={cn(
              'font-bold tabular-nums tracking-tight text-gray-800 dark:text-white/90',
              compact ? 'mt-1 text-xl' : 'mt-2',
              !compact && (featured ? 'text-[2rem] sm:text-[2.35rem]' : 'text-[1.75rem]'),
              value === '…' && 'animate-pulse'
            )}
          >
            {value}
          </h3>
          {hint ? (
            <p
              className={cn(
                'text-gray-500 dark:text-gray-400',
                compact ? 'mt-0.5 truncate text-[11px]' : 'mt-1 text-xs'
              )}
            >
              {hint}
            </p>
          ) : null}
          {delta && !compact ? (
            <div className="mt-2">
              <BadgeDelta deltaType={delta.deltaType} size="sm">
                {delta.deltaType === 'increase' ? '↑' : delta.deltaType === 'decrease' ? '↓' : '→'}{' '}
                {delta.text}
              </BadgeDelta>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
