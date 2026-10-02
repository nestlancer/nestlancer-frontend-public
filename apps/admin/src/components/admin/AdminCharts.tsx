'use client';

import {
  AreaChart,
  Badge,
  BadgeDelta,
  BarChart,
  Card,
  DonutChart,
  Metric,
  Text,
  Tracker,
  cn,
  type DeltaType,
} from '@nestlancer/ui';
import type { ReactNode } from 'react';
import { Spinner } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';

import type {
  ChartAreaPoint,
  ChartBarPoint,
  ChartDonutPoint,
  RequestVolumePoint,
  UptimeTrackerBlock,
} from '@/lib/admin-view-model';
import { formatINR, formatNumber } from '@/lib/admin-view-model';

import { adminCardClass } from '@/components/admin/AdminPageChrome';

export function SliceFaultBanner({ faults }: { faults: [string, unknown][] }) {
  if (!faults.length) return null;
  return (
    <Card
      className={`${adminCardClass} border-amber-300/60 bg-amber-50/80 dark:border-amber-800/50 dark:bg-amber-950/30`}
    >
      <Text className="font-medium text-amber-900 dark:text-amber-100">
        Some data slices did not load
      </Text>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {faults.map(([label, err]) => (
          <li key={label}>
            <Text className="text-sm text-amber-800/90 dark:text-amber-200/80">
              {label}: {getApiErrorMessage(err, 'failed')}
            </Text>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function StatusRow({ health, periodLabel }: { health?: string; periodLabel?: string }) {
  if (!health && !periodLabel) return null;
  const healthTone = health === 'healthy' ? 'emerald' : health === 'degraded' ? 'amber' : 'slate';
  return (
    <div className="flex flex-wrap items-center gap-2">
      {health ? (
        <Badge color={healthTone} size="sm">
          System {health}
        </Badge>
      ) : null}
      {periodLabel ? (
        <Badge color="slate" size="sm">
          {periodLabel}
        </Badge>
      ) : null}
    </div>
  );
}

export function TrendDeltasPanel({ items }: { items: { label: string; line: string }[] }) {
  if (!items.length) return null;
  return (
    <Card className={adminCardClass}>
      <Text className="text-sm font-semibold text-foreground">Period trends</Text>
      <div className="mt-4 flex flex-wrap gap-3">
        {items.map((t) => {
          const deltaType: DeltaType = t.line.includes('+')
            ? 'increase'
            : t.line.includes('-') && /-\d/.test(t.line)
              ? 'decrease'
              : 'unchanged';
          return (
            <div key={t.label} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <Text className="text-xs font-medium text-muted-foreground">{t.label}</Text>
              <div className="mt-1">
                <BadgeDelta deltaType={deltaType} size="sm">
                  {t.line.split('·')[0]?.trim() || t.line}
                </BadgeDelta>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ChartShell({
  embedded,
  title,
  description,
  children,
}: {
  embedded?: boolean;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  if (embedded) {
    return (
      <div className="p-4">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        {description ? <Text className="text-muted-foreground">{description}</Text> : null}
        {children}
      </div>
    );
  }
  return (
    <Card className={adminCardClass}>
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      {description ? <Text className="text-muted-foreground">{description}</Text> : null}
      {children}
    </Card>
  );
}

export function RequestVolumeAreaChart({
  data,
  loading,
  error,
  hideHeader,
  compact,
  totalLabel,
  title = 'Request volume over time',
  description = 'Inbound requests across the last 30 days',
}: {
  data: RequestVolumePoint[];
  loading?: boolean;
  error?: unknown;
  hideHeader?: boolean;
  compact?: boolean;
  totalLabel?: string;
  title?: string;
  description?: string;
}) {
  const body = error ? (
    <Text className="mt-4 text-sm text-destructive">
      {getApiErrorMessage(error, 'Request volume unavailable')}
    </Text>
  ) : loading ? (
    <ChartLoading compact={compact} />
  ) : (
    <AreaChart
      className={compact ? 'mt-1 h-48' : 'mt-4 h-72'}
      data={data}
      index="period"
      categories={['Requests']}
      colors={['cyan']}
      valueFormatter={(n) => formatNumber(n)}
      showAnimation
      yAxisWidth={40}
      noDataText="No request volume in this window"
    />
  );

  if (hideHeader) return <div className="px-2 pb-2">{body}</div>;

  return (
    <ChartShell embedded={false} title={title} description={description}>
      {totalLabel ? <Text className="mb-1 text-xs text-muted-foreground">{totalLabel}</Text> : null}
      {body}
    </ChartShell>
  );
}

export function RevenueAreaChart({
  data,
  loading,
  error,
  embedded,
  hideHeader,
  compact,
  title = 'Revenue over time',
  description = 'Completed payments for the selected period',
}: {
  data: ChartAreaPoint[];
  loading?: boolean;
  error?: unknown;
  embedded?: boolean;
  hideHeader?: boolean;
  compact?: boolean;
  title?: string;
  description?: string;
}) {
  const body = error ? (
    <Text className="mt-4 text-sm text-destructive">
      {getApiErrorMessage(error, 'Revenue chart unavailable')}
    </Text>
  ) : loading ? (
    <ChartLoading compact={compact} />
  ) : (
    <AreaChart
      className={compact ? 'mt-2 h-44' : 'mt-5 h-72'}
      data={data}
      index="period"
      categories={['Revenue']}
      colors={['emerald']}
      valueFormatter={(n) => formatINR(n)}
      showAnimation
      yAxisWidth={56}
      noDataText="No revenue time series in API response"
    />
  );

  if (hideHeader) return <div className="px-2 pb-2">{body}</div>;

  return (
    <ChartShell embedded={embedded} title={title} description={description}>
      {body}
    </ChartShell>
  );
}

export function UserActivityBarChart({
  data,
  loading,
  error,
  compact,
  title = 'User activity',
  description = 'New users over time (or role mix when time series is empty)',
}: {
  data: ChartBarPoint[];
  loading?: boolean;
  error?: unknown;
  compact?: boolean;
  title?: string;
  description?: string;
}) {
  return (
    <Card className={adminCardClass}>
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      {description ? <Text className="text-muted-foreground">{description}</Text> : null}
      {error ? (
        <Text className="mt-4 text-sm text-destructive">
          {getApiErrorMessage(error, 'User activity chart unavailable')}
        </Text>
      ) : loading ? (
        <ChartLoading compact={compact} />
      ) : (
        <BarChart
          className={compact ? 'mt-2 h-40' : 'mt-4 h-72'}
          data={data}
          index="name"
          categories={['Users']}
          colors={['emerald']}
          valueFormatter={(n) => formatNumber(n)}
          showAnimation
          yAxisWidth={48}
          noDataText="No user breakdown available"
        />
      )}
    </Card>
  );
}

export function ProjectDonutChart({
  data,
  loading,
  error,
}: {
  data: ChartDonutPoint[];
  loading?: boolean;
  error?: unknown;
}) {
  return (
    <Card className={adminCardClass}>
      <Text className="text-sm font-semibold text-foreground">Project statuses</Text>
      <Text className="text-muted-foreground">Distribution across lifecycle states</Text>
      {error ? (
        <Text className="mt-4 text-sm text-destructive">
          {getApiErrorMessage(error, 'Project chart unavailable')}
        </Text>
      ) : loading ? (
        <ChartLoading />
      ) : (
        <DonutChart
          className="mt-4 h-72"
          data={data}
          category="value"
          index="name"
          colors={['emerald', 'cyan', 'blue', 'violet', 'amber', 'rose']}
          valueFormatter={(n) => formatNumber(n)}
          showAnimation
          noDataText="No project status breakdown"
        />
      )}
    </Card>
  );
}

export function UptimeTrackerPanel({
  data,
  uptimeLabel,
  loading,
}: {
  data: UptimeTrackerBlock[];
  uptimeLabel?: string;
  loading?: boolean;
}) {
  return (
    <Card className={adminCardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Text className="text-sm font-semibold text-foreground">System uptime</Text>
          <Text className="text-muted-foreground">
            Rolling operational windows (from health / performance API)
          </Text>
        </div>
        {uptimeLabel ? <Metric className="text-[var(--ge-primary)]">{uptimeLabel}</Metric> : null}
      </div>
      {loading ? <ChartLoading /> : <Tracker className="mt-6" data={data} />}
    </Card>
  );
}

export function ChartSectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`${adminCardClass} ${className ?? ''}`}>
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      {description ? <Text className="mt-1 text-muted-foreground">{description}</Text> : null}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export function PageIntro({ description }: { description: string }) {
  return <Text className="max-w-3xl text-sm text-muted-foreground">{description}</Text>;
}

export function ChartQueryGate({
  isLoading,
  error,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  children: ReactNode;
}) {
  if (isLoading) {
    return (
      <Card className={adminCardClass}>
        <div className="flex items-center gap-3 py-10">
          <Spinner className="h-5 w-5 text-primary" />
          <Text className="text-muted-foreground">Loading dashboard…</Text>
        </div>
      </Card>
    );
  }
  if (error) {
    return (
      <Card className={`${adminCardClass} border-destructive/40`}>
        <Text className="text-destructive">{getApiErrorMessage(error, 'Request failed')}</Text>
      </Card>
    );
  }
  return <>{children}</>;
}

function ChartLoading({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 rounded-lg bg-muted/30 animate-pulse',
        compact ? 'h-44' : 'h-72'
      )}
    >
      <Spinner className="h-5 w-5 text-primary" />
      <Text className="text-muted-foreground">Loading chart…</Text>
    </div>
  );
}
