'use client';

import Link from 'next/link';
import type { LucideIcon } from '@nestlancer/ui/icons';
import type { ReactNode } from 'react';

import { DEFAULT_CURRENCY } from '@nestlancer/constants';
import { StatusBadge, PctProgressFill, cn } from '@nestlancer/ui';
import { formatCurrency } from '@nestlancer/utils';

import { formatWorkStatusLabel, workStatusBadgeVariant } from './status-utils';
import { webListShellClass } from '@/lib/tailadmin-classes';

export type WorkListItemProps = {
  href: string;
  title: string;
  status: string;
  kind: 'request' | 'project';
  kindLabel: string;
  meta: string[];
  amount?: number;
  currency?: string;
  progressPercent?: number | null;
  icon: LucideIcon;
  iconVariant?: 'info' | 'success' | 'warning' | 'purple' | 'neutral';
};

const iconTone: Record<NonNullable<WorkListItemProps['iconVariant']>, string> = {
  info: 'bg-[hsl(var(--status-info-bg))] text-[hsl(var(--status-info))]',
  success: 'bg-[hsl(var(--status-success-bg))] text-[hsl(var(--status-success))]',
  warning: 'bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning))]',
  purple: 'bg-[hsl(var(--status-purple-bg))] text-[hsl(var(--status-purple))]',
  neutral: 'bg-muted text-muted-foreground',
};

export function WorkListItem({
  href,
  title,
  status,
  kindLabel,
  meta,
  amount,
  currency = DEFAULT_CURRENCY,
  progressPercent,
  icon: Icon,
  iconVariant = 'info',
}: WorkListItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-wrap items-center gap-3 border-b border-border/60 bg-card px-4 py-3 transition-theme last:border-b-0',
        'hover:bg-accent/40 first:rounded-t-[var(--radius-lg,0.875rem)] last:rounded-b-[var(--radius-lg,0.875rem)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-semibold',
          iconTone[iconVariant]
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{kindLabel}</span>
          {meta.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </p>
      </div>
      <StatusBadge variant={workStatusBadgeVariant(status)} dot className="shrink-0 capitalize">
        {formatWorkStatusLabel(status)}
      </StatusBadge>
      {progressPercent != null ? (
        <div className="hidden w-[7.5rem] shrink-0 sm:block">
          <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <PctProgressFill
              pct={Math.min(100, Math.max(0, progressPercent))}
              fillClassName="fill-ta-brand-500"
              className="h-full"
            />
          </div>
        </div>
      ) : null}
      {amount != null && amount > 0 ? (
        <p className="shrink-0 text-sm font-semibold tabular-nums">
          {formatCurrency(amount, currency)}
        </p>
      ) : null}
    </Link>
  );
}

export function WorkListShell({ children }: { children: ReactNode }) {
  return <div className={webListShellClass}>{children}</div>;
}
