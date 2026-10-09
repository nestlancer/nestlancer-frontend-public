'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BadgeDelta, Button, cn, FilterBar, type FilterBarProps } from '@nestlancer/ui';

import type { KpiItem } from '@/lib/admin-view-model';
import {
  BarChart3,
  CreditCard,
  FolderKanban,
  MessageSquare,
  Receipt,
  Users,
} from '@nestlancer/ui/icons';

export const adminCardClass = 'ge-card rounded-lg border-border bg-card p-4 sm:p-6';

export const adminTableShellClass =
  'ge-card overflow-hidden rounded-lg border border-border bg-card p-0';

export const adminTableHeadRowClass = 'border-b border-border bg-muted/40';

export const adminTableThClass =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground';

export const adminTableRowClass = 'border-b border-border/60 transition-colors hover:bg-muted/30';

export const adminTableTdClass = 'px-4 py-3 text-foreground';

export const adminTableTdMutedClass = 'px-4 py-3 text-muted-foreground';

const METRIC_ICONS = [Users, FolderKanban, Receipt, BarChart3, CreditCard, MessageSquare] as const;

const METRIC_ICON_COLORS = [
  'bg-primary/10 text-primary',
  'bg-[hsl(var(--status-info-bg))] text-[hsl(var(--status-info))]',
  'bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning))]',
  'bg-[hsl(var(--status-purple-bg))] text-[hsl(var(--status-purple))]',
  'bg-[hsl(var(--status-success-bg))] text-[hsl(var(--status-success))]',
  'bg-[hsl(var(--status-info-bg))] text-[hsl(var(--status-info))]',
] as const;

/** Compact KPI strip matching stitch-audit dashboard tiles. */
export function AdminMetricStrip({
  items,
  max = 6,
  className,
  heroIndex,
  /**
   * Single bordered shell with divided cells (2026 default).
   * Pass `dense={false}` only for rare hero tile walls.
   */
  dense = true,
}: {
  items: KpiItem[];
  max?: number;
  className?: string;
  /** Index of the oversized “north star” KPI (Stripe / Mercury pattern). */
  heroIndex?: number;
  dense?: boolean;
}) {
  const tiles = items.slice(0, max);
  if (!tiles.length) return null;

  if (dense) {
    const cols =
      max <= 2
        ? 'sm:grid-cols-2'
        : max === 3
          ? 'sm:grid-cols-3'
          : max === 4
            ? 'grid-cols-2 xl:grid-cols-4'
            : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6';

    return (
      <div
        className={cn(
          'grid overflow-hidden rounded-md border border-border/60 bg-card/80',
          'divide-x divide-y divide-border/50',
          cols,
          className
        )}
      >
        {tiles.map((k, i) => {
          const cell = (
            <>
              <p className="truncate text-[11px] font-medium text-muted-foreground">{k.label}</p>
              <p className="mt-0.5 text-base font-semibold tabular-nums tracking-tight text-foreground">
                {k.value}
              </p>
              {k.hint ? (
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{k.hint}</p>
              ) : null}
              {k.delta ? (
                <div className="mt-1">
                  <BadgeDelta deltaType={k.delta.deltaType} size="sm">
                    {k.delta.deltaType === 'increase'
                      ? '↑'
                      : k.delta.deltaType === 'decrease'
                        ? '↓'
                        : '→'}{' '}
                    {k.delta.text}
                  </BadgeDelta>
                </div>
              ) : null}
            </>
          );
          const cellClass = 'px-3 py-2 transition-colors hover:bg-muted/30';
          if (k.href) {
            return (
              <Link key={`${k.label}-${i}`} href={k.href} className={cn(cellClass, 'block')}>
                {cell}
              </Link>
            );
          }
          return (
            <div key={`${k.label}-${i}`} className={cellClass}>
              {cell}
            </div>
          );
        })}
      </div>
    );
  }

  const gridCols =
    max <= 2
      ? 'sm:grid-cols-2'
      : max === 3
        ? 'sm:grid-cols-3'
        : max === 4
          ? 'sm:grid-cols-2 xl:grid-cols-4'
          : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6';

  return (
    <div className={cn('grid gap-2', gridCols, className)}>
      {tiles.map((k, i) => {
        const Icon = METRIC_ICONS[i % METRIC_ICONS.length]!;
        const iconColor = METRIC_ICON_COLORS[i % METRIC_ICON_COLORS.length]!;
        const isHero = heroIndex === i;

        const deltaArrow =
          k.delta?.deltaType === 'increase' ? '↑' : k.delta?.deltaType === 'decrease' ? '↓' : '→';

        const body = (
          <>
            <div className="ge-kpi-tile-header">
              <span className="ge-kpi-tile-label">{k.label}</span>
              <span className={cn('ge-kpi-tile-icon', iconColor)}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
            <div>
              <p className="ge-kpi-tile-value">{k.value}</p>
              {k.hint ? <p className="ge-kpi-tile-hint">{k.hint}</p> : null}
              {k.delta ? (
                <div className="mt-1.5">
                  <BadgeDelta deltaType={k.delta.deltaType} size="sm">
                    {deltaArrow} {k.delta.text}
                  </BadgeDelta>
                </div>
              ) : null}
            </div>
          </>
        );

        const tileClass = cn(
          'ge-kpi-tile animate-fade-in-up motion-reduce:animate-none opacity-0',
          isHero && 'ge-kpi-tile--hero sm:col-span-2 xl:col-span-2',
          k.href && 'ge-kpi-tile--link',
          ['delay-0', 'delay-75', 'delay-100', 'delay-150', 'delay-200', 'delay-300'][
            Math.min(i, 5)
          ]
        );

        if (k.href) {
          return (
            <Link key={`${k.label}-${i}`} href={k.href} className={tileClass}>
              {body}
            </Link>
          );
        }

        return (
          <div key={`${k.label}-${i}`} className={tileClass}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

/** Card shell for filter bar + table + pagination (shared blog/content table pattern). */
export function AdminDataShell({
  filter,
  children,
  footer,
  className,
}: {
  filter?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('ge-data-shell', className)}>
      {filter ? <div className="ge-data-shell-filter">{filter}</div> : null}
      <div className="ge-data-shell-body">{children}</div>
      {footer ? <div className="ge-data-shell-footer">{footer}</div> : null}
    </div>
  );
}

/** Filter bar styled for use inside AdminDataShell. */
export function AdminFilterBar(props: FilterBarProps) {
  return (
    <FilterBar
      {...props}
      className={cn(
        'border-0 bg-transparent p-0 shadow-none',
        '[&_input]:h-9 [&_input]:max-w-xs [&_input]:border-input [&_input]:bg-card',
        '[&_select]:h-9 [&_select]:min-w-[13rem] [&_select]:rounded-md [&_select]:border-input [&_select]:bg-card',
        props.className
      )}
    />
  );
}

/** Underline tab bar matching stitch-audit content pages. */
export function AdminTabBar({
  tabs,
  activeIndex,
  onChange,
  className,
}: {
  tabs: { label: string; badge?: number }[];
  activeIndex: number;
  onChange: (index: number) => void;
  className?: string;
}) {
  return (
    <nav
      className={cn('ge-tab-bar scrollbar-none', className)}
      aria-label="Page sections"
      role="tablist"
    >
      {tabs.map((tab, i) => (
        <button
          key={tab.label}
          type="button"
          role="tab"
          aria-selected={activeIndex === i}
          className={cn('ge-tab-bar-item whitespace-nowrap', activeIndex === i && 'active')}
          onClick={() => onChange(i)}
        >
          {tab.label}
          {tab.badge != null && tab.badge > 0 ? (
            <span className="ge-tab-badge">{tab.badge}</span>
          ) : null}
        </button>
      ))}
    </nav>
  );
}

export function AdminTablePagination({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  total?: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <>
      <span>
        Page <span className="font-semibold text-foreground">{page}</span> of{' '}
        <span className="font-semibold text-foreground">{totalPages}</span>
        {total != null ? ` (${total} total)` : null}
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={onPrev}>
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </>
  );
}

export function AdminTableEmpty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

/** Removes outer border from DataTable when nested in AdminDataShell. */
export const adminDataTableClass =
  '!space-y-0 [&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none';
