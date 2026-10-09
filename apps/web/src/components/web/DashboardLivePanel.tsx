'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button, EmptyState, Skeleton, cn } from '@nestlancer/ui';
import { ArrowRight } from '@nestlancer/ui/icons';

import { WebPanel } from '@/components/web/WebPanel';

export type DashboardLiveRow = {
  id: string;
  title: string;
  detail?: string;
  meta?: string;
  href: string;
  tone?: 'default' | 'amber' | 'emerald';
};

type DashboardLivePanelProps = {
  title: string;
  href: string;
  linkLabel?: string;
  icon?: ReactNode;
  rows: DashboardLiveRow[];
  loading?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  className?: string;
  maxRows?: number;
};

export function DashboardLivePanel({
  title,
  href,
  linkLabel = 'View all',
  icon,
  rows,
  loading,
  emptyTitle,
  emptyDescription,
  className,
  maxRows = 3,
}: DashboardLivePanelProps) {
  const shown = rows.slice(0, maxRows);

  return (
    <WebPanel padding="none" className={cn('flex h-full flex-col overflow-hidden', className)}>
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <div className="flex min-w-0 items-center gap-1.5">
          {icon ? (
            <span className="shrink-0 text-gray-400 dark:text-gray-500 [&_svg]:h-3.5 [&_svg]:w-3.5">
              {icon}
            </span>
          ) : null}
          <h2 className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-7 shrink-0 px-2 text-xs text-ta-brand-500 hover:text-ta-brand-600"
        >
          <Link href={href}>{linkLabel}</Link>
        </Button>
      </div>

      {loading ? (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {Array.from({ length: maxRows }).map((_, i) => (
            <li key={`live-skel-${i}`} className="px-3 py-2">
              <Skeleton className="h-7 w-full rounded-md" />
            </li>
          ))}
        </ul>
      ) : shown.length === 0 ? (
        <EmptyState
          variant="no-data"
          title={emptyTitle}
          description={emptyDescription}
          className="py-4"
        />
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-gray-100 dark:divide-gray-800">
          {shown.map((row) => (
            <li key={row.id}>
              <Link
                href={row.href}
                className={cn(
                  'group flex items-center gap-2 px-3 py-1.5 transition-colors',
                  'hover:bg-ta-brand-50/40 dark:hover:bg-ta-brand-500/[0.06]',
                  row.tone === 'amber' && 'bg-amber-50/30 dark:bg-amber-500/[0.06]',
                  row.tone === 'emerald' && 'bg-emerald-50/30 dark:bg-emerald-500/[0.06]'
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                    {row.title}
                  </span>
                  {row.detail ? (
                    <span className="block truncate text-[11px] text-gray-500 dark:text-gray-400">
                      {row.detail}
                    </span>
                  ) : null}
                </span>
                {row.meta ? (
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-gray-500">
                    {row.meta}
                  </span>
                ) : null}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WebPanel>
  );
}
