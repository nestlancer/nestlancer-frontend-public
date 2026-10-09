'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Badge, Button, cn } from '@nestlancer/ui';
import { Activity, CreditCard, Inbox, MessageSquare, ShieldAlert } from '@nestlancer/ui/icons';

import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { DebugApiSection } from '@/components/admin/AdminDataViews';
import {
  RevenueAreaChart,
  RequestVolumeAreaChart,
  SliceFaultBanner,
} from '@/components/admin/AdminCharts';
import {
  GeCardHeader,
  GeChartTabs,
  GePageHeader,
  GeRecentTable,
  GeStorageWidget,
} from '@/components/admin/AdminGentelellaUI';
import { AdminMetricStrip } from '@/components/admin/AdminPageChrome';
import { adminKeys } from '@/lib/admin-query-keys';
import { formatAdminStatus, pickAdminRows, rowId } from '@/lib/admin-response';
import {
  extractDashboardOverview,
  extractPaymentPulse,
  extractQueueCount,
  extractRequestVolumeSeries,
  extractRevenueAreaSeries,
  type KpiItem,
  formatDate,
  formatINR,
  formatNumber,
  getNum,
  getStr,
  asRecord,
} from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';

const STORAGE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--status-info))',
  'hsl(var(--status-warning))',
  'hsl(var(--border))',
  'hsl(var(--status-danger))',
];

const PERIOD_OPTIONS = ['7 days', '30 days', '90 days', '1 year'] as const;
// Raise from 30 s to 60 s — the backend overview is cached for 300 s on Redis anyway,
// and the flagged / contact / contact stats handlers are expensive enough that every
// 30 s poll from both the header *and* the dashboard was doubling the load.
const LIVE_MS = 60_000;

function periodToApi(period: string): 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' {
  if (period === '7 days') return 'WEEK';
  if (period === '90 days') return 'QUARTER';
  if (period === '1 year') return 'YEAR';
  return 'MONTH';
}

function mapRecentRequests(data: unknown) {
  return pickAdminRows(data)
    .slice(0, 4)
    .map((row, i) => {
      const user =
        row.user && typeof row.user === 'object'
          ? (row.user as Record<string, unknown>)
          : row.client && typeof row.client === 'object'
            ? (row.client as Record<string, unknown>)
            : null;
      const customerFromUser = user
        ? [user.firstName, user.lastName]
            .filter((x) => typeof x === 'string' && x)
            .join(' ')
            .trim() || (typeof user.email === 'string' ? user.email : '')
        : '';
      const customer =
        customerFromUser ||
        getStr(row.clientName) ||
        getStr(row.clientEmail) ||
        getStr(row.email) ||
        '—';
      return {
        id: rowId(row) || String(row.id ?? i),
        customer,
        subject: getStr(row.title) || getStr(row.subject) || getStr(row.category) || '—',
        status: formatAdminStatus(getStr(row.status) || getStr(row.state) || '—'),
        date: formatDate(row.createdAt ?? row.updatedAt),
      };
    });
}

function AttentionChip({
  href,
  label,
  shortLabel,
  value,
  tone = 'default',
}: {
  href: string;
  label: string;
  /** Compact label for narrow viewports (full `label` stays on title). */
  shortLabel?: string;
  value: string;
  tone?: 'default' | 'warning' | 'critical' | 'success';
}) {
  const accent =
    tone === 'warning'
      ? 'border-l-amber-500 text-foreground'
      : tone === 'critical'
        ? 'border-l-rose-500 text-foreground'
        : tone === 'success'
          ? 'border-l-emerald-500/70 text-foreground'
          : 'border-l-transparent text-foreground';

  return (
    <Link
      href={href}
      title={label}
      className={cn(
        'group flex min-w-0 flex-1 items-baseline justify-between gap-2',
        'rounded-sm border border-border/50 border-l-2 bg-card/60 px-2 py-1.5 transition-colors',
        'hover:border-primary/40 hover:bg-card',
        accent
      )}
    >
      <span className="min-w-0 text-[11px] font-medium leading-tight text-muted-foreground">
        <span className="sm:hidden">{shortLabel ?? label}</span>
        <span className="hidden sm:inline">{label}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums tracking-tight">{value}</span>
    </Link>
  );
}

export function DashboardClient() {
  const [chartPeriod, setChartPeriod] = useState<string>('30 days');
  const revenuePeriod = periodToApi(chartPeriod);

  // Overview already includes the revenue series, alerts, and activity used on this
  // screen. Separate activity / alerts / revenue / user-metric calls repeated that
  // work and queued the payment and request reads behind them.
  const overviewResult = useQuery({
    queryKey: [...adminKeys.overview(), revenuePeriod],
    queryFn: () => apiServices.admin.getDashboardOverview({ period: revenuePeriod }),
    staleTime: LIVE_MS,
    refetchInterval: LIVE_MS,
  });

  const recentRequestsQ = useQuery({
    queryKey: [...adminKeys.root, 'dashboard', 'recent-requests'],
    queryFn: () =>
      apiServices.admin.listAdminRequests({ page: 1, limit: 4, sort: 'createdAt:desc' }),
    staleTime: LIVE_MS,
    refetchInterval: LIVE_MS,
  });

  const paymentsQ = useQuery({
    queryKey: [...adminKeys.root, 'dashboard', 'payment-stats'],
    queryFn: () => apiServices.admin.getAdminPaymentStats(),
    staleTime: LIVE_MS,
    refetchInterval: LIVE_MS,
  });

  const flaggedQ = useQuery({
    // Use the same query key as AdminModerationLink so they share a cache entry
    // and only one network request fires per poll window instead of two.
    queryKey: [...adminKeys.flaggedMessages(), 'header'],
    queryFn: () => apiServices.admin.getFlaggedMessages({ page: 1, limit: 8 }),
    staleTime: LIVE_MS,
    refetchInterval: LIVE_MS,
  });

  const contactQ = useQuery({
    queryKey: [...adminKeys.root, 'dashboard', 'contact-inbox'],
    queryFn: () => apiServices.admin.listContactMessages({ page: 1, limit: 5 }),
    staleTime: LIVE_MS * 2,
    refetchInterval: LIVE_MS * 2,
  });

  const requestStatsQ = useQuery({
    queryKey: adminKeys.requestStats(),
    queryFn: () => apiServices.admin.getAdminRequestStats(),
    staleTime: LIVE_MS * 2,
    refetchInterval: LIVE_MS * 2,
  });

  const isLoading = overviewResult.isPending && overviewResult.data === undefined;

  const sliceFaults: [string, unknown][] = [];
  if (overviewResult.error) sliceFaults.push(['Overview', overviewResult.error]);
  if (paymentsQ.error) sliceFaults.push(['Payments', paymentsQ.error]);
  if (flaggedQ.error) sliceFaults.push(['Moderation', flaggedQ.error]);
  if (contactQ.error) sliceFaults.push(['Contact', contactQ.error]);
  if (requestStatsQ.error) sliceFaults.push(['Request volume', requestStatsQ.error]);

  const overview = extractDashboardOverview(overviewResult?.data);

  const liveAlerts = overview.alerts;

  const revenueArea = extractRevenueAreaSeries(overview.revenueBars);
  const requestVolume = extractRequestVolumeSeries(requestStatsQ.data);
  const requestVolumeTotal = requestVolume.reduce((s, p) => s + (p.Requests || 0), 0);
  const paymentPulse = extractPaymentPulse(paymentsQ.data);
  const flaggedCount = extractQueueCount(flaggedQ.data);
  const contactNew = (() => {
    const summary = asRecord(asRecord(contactQ.data)?.summary);
    return getNum(summary?.newMessages) ?? extractQueueCount(contactQ.data);
  })();

  const summaryRec = asRecord(asRecord(overviewResult?.data)?.summary);
  const pendingRequests = getNum(summaryRec?.pendingRequests) ?? 0;
  const openQuotes = getNum(summaryRec?.openQuotes) ?? 0;

  const getKpiDeltaFromKey = (key: string): KpiItem['delta'] | undefined => {
    const delta = overview.trendDeltas?.[key];
    if (!delta || !Number.isFinite(delta.change)) return undefined;
    if (!delta.previous) {
      if (!delta.current) return { deltaType: 'unchanged', text: '—' };
      return { deltaType: 'increase', text: 'new' };
    }

    const pct = Math.round(delta.change * 10) / 10;
    const deltaType = pct > 0 ? 'increase' : pct < 0 ? 'decrease' : ('unchanged' as const);
    return { deltaType, text: `${pct >= 0 ? '+' : ''}${pct}%` };
  };

  const supportingKpis = useMemo(() => {
    const preferred = [
      'Total users',
      'New users',
      'Active projects',
      'Completed projects',
      'Pending requests',
      'Open quotes',
    ];
    const byLabel = new Map(overview.kpis.map((k) => [k.label, k]));
    const ordered = preferred
      .map((label) => byLabel.get(label))
      .filter((k): k is KpiItem => Boolean(k))
      .slice(0, 6);

    return ordered.map((k) => {
      const label = k.label.toLowerCase();
      if (label.includes('user')) return { ...k, delta: getKpiDeltaFromKey('users') };
      if (label.includes('project')) return { ...k, delta: getKpiDeltaFromKey('projects') };
      if (label.includes('request') || label.includes('quote')) {
        return { ...k, delta: getKpiDeltaFromKey('requests') };
      }
      return k;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deltas derived from overview snapshot
  }, [overview.kpis, overview.trendDeltas]);

  const revenueKpi = overview.kpis.find((k) => /revenue/i.test(k.label));

  const projectMixTotal = overview.projectStatusBars.reduce((s, b) => s + (b.value || 0), 0) || 1;
  const storageSegments = overview.projectStatusBars
    .filter((bar) => bar.value > 0)
    .slice(0, 5)
    .map((bar, i) => ({
      label: bar.label,
      value: bar.value,
      pct: (bar.value / projectMixTotal) * 100,
      color: STORAGE_COLORS[i % STORAGE_COLORS.length]!,
    }));

  const recentRows = mapRecentRequests(recentRequestsQ.data);
  const paymentRows = paymentPulse.recent.map((tx) => ({
    id: tx.id.slice(0, 8),
    client: tx.client,
    project: tx.project,
    amount: tx.amountLabel,
    date: tx.when,
  }));

  const healthTone =
    overview.health === 'healthy' ? 'emerald' : overview.health === 'degraded' ? 'amber' : 'slate';

  const debugPayloads = {
    overview: overviewResult.data,
    requestStats: requestStatsQ.data,
    recentRequests: recentRequestsQ.data,
    payments: paymentsQ.data,
    flagged: flaggedQ.data,
    contact: contactQ.data,
  };

  return (
    <div className="ge-dash-compact space-y-4">
      <GePageHeader
        pretitle="Operations"
        title="Command center"
        description="Live revenue, queues, and what needs action — refreshed every 30s."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
              <Link href="/pipeline">Pipelines</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
              <Link href="/analytics">Analytics</Link>
            </Button>
            <Button size="sm" asChild className="w-full sm:w-auto">
              <Link href="/requests?status=inbox">
                <Inbox className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Inbox
              </Link>
            </Button>
          </div>
        }
      />

      <SliceFaultBanner faults={sliceFaults} />

      <AdminQueryState isLoading={isLoading} error={null}>
        <div className="space-y-4">
          <section
            aria-label="Needs attention"
            className="animate-fade-in-up motion-reduce:animate-none opacity-0 [animation-delay:40ms]"
          >
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-primary" aria-hidden />
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Needs attention
                </h2>
                <span className="text-[11px] font-medium text-muted-foreground">Live</span>
              </div>
              {overview.health ? (
                <Badge color={healthTone} size="sm">
                  System {overview.health}
                </Badge>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-1.5 rounded-md border border-border/50 bg-muted/20 p-1.5 sm:flex sm:flex-wrap">
              <AttentionChip
                href="/requests?status=inbox"
                label="Pending requests"
                shortLabel="Requests"
                value={String(pendingRequests)}
                tone={pendingRequests > 0 ? 'warning' : 'success'}
              />
              <AttentionChip
                href="/quotes"
                label="Open quotes"
                shortLabel="Quotes"
                value={String(openQuotes)}
                tone={openQuotes > 0 ? 'default' : 'success'}
              />
              <AttentionChip
                href="/payments?status=pending"
                label="Pending pay"
                shortLabel="Payments"
                value={String(paymentPulse.pendingTransactions)}
                tone={paymentPulse.pendingTransactions > 0 ? 'warning' : 'success'}
              />
              <AttentionChip
                href="/moderation"
                label="Flagged msgs"
                shortLabel="Flagged"
                value={String(flaggedCount)}
                tone={flaggedCount > 0 ? 'critical' : 'success'}
              />
              <AttentionChip
                href="/contact"
                label="Contact new"
                shortLabel="Contact"
                value={String(contactNew)}
                tone={contactNew > 0 ? 'warning' : 'success'}
              />
              <AttentionChip
                href="/system"
                label="Alerts"
                shortLabel="Alerts"
                value={String(liveAlerts.length)}
                tone={liveAlerts.length > 0 ? 'critical' : 'success'}
              />
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-2 animate-fade-in-up motion-reduce:animate-none opacity-0 [animation-delay:70ms]">
            <p className="text-[11px] font-medium text-muted-foreground">
              Period metrics · {overview.periodLabel || 'selected window'}
            </p>
            <GeChartTabs
              value={chartPeriod}
              onChange={setChartPeriod}
              options={[...PERIOD_OPTIONS]}
            />
          </div>

          <AdminMetricStrip
            items={[
              {
                label: revenueKpi?.label || 'Revenue (period)',
                value: revenueKpi?.value || '—',
                hint:
                  (revenueKpi?.hint || 'Completed payments') +
                  (paymentPulse.pendingAmount > 0
                    ? ` · ${formatINR(paymentPulse.pendingAmount)} awaiting`
                    : ''),
                href: '/analytics',
                delta: getKpiDeltaFromKey('revenue'),
              },
              ...supportingKpis.slice(0, 5),
            ]}
            max={6}
            dense
          />

          <div className="ge-row ge-col-8-4 animate-fade-in-up motion-reduce:animate-none opacity-0 [animation-delay:120ms] [content-visibility:auto]">
            <div className="h-full overflow-hidden rounded-md border border-border/50 bg-card/80">
              <GeCardHeader
                title="Revenue trajectory"
                subtitle={overview.periodLabel || 'Completed payments'}
                actions={
                  <GeChartTabs
                    value={chartPeriod}
                    onChange={setChartPeriod}
                    options={[...PERIOD_OPTIONS]}
                  />
                }
              />
              <div className="px-3 pb-2 pt-0">
                <RevenueAreaChart
                  data={revenueArea}
                  compact
                  loading={overviewResult.isPending && !overviewResult.data}
                  error={overviewResult.error}
                  hideHeader
                  title="Revenue over time"
                  description="Completed payments for the selected window"
                />
              </div>
            </div>

            <GeStorageWidget
              title="Project mix"
              subtitle="Lifecycle share"
              segments={
                storageSegments.length
                  ? storageSegments
                  : [{ label: 'No data', pct: 100, color: 'hsl(var(--border))' }]
              }
            />
          </div>

          <div className="ge-row ge-col-2 animate-fade-in-up motion-reduce:animate-none opacity-0 [animation-delay:160ms] [content-visibility:auto]">
            <GeRecentTable
              title="Recent requests"
              subtitle="Newest inbound work"
              viewAllHref="/requests"
              columns={[
                { key: 'id', header: 'Request' },
                { key: 'customer', header: 'Customer' },
                { key: 'subject', header: 'Subject' },
                { key: 'status', header: 'Status' },
                { key: 'date', header: 'Date' },
              ]}
              rows={recentRows}
              emptyMessage="No recent requests."
            />

            <GeRecentTable
              title="Recent payments"
              subtitle={`${paymentPulse.pendingTransactions} pending · ${formatINR(paymentPulse.pendingAmount)}`}
              viewAllHref="/payments"
              columns={[
                { key: 'client', header: 'Client' },
                { key: 'project', header: 'Project' },
                { key: 'amount', header: 'Amount' },
                { key: 'date', header: 'Paid' },
              ]}
              rows={paymentRows}
              emptyMessage="No completed payments yet."
            />
          </div>

          <div className="ge-row ge-col-8-4 animate-fade-in-up motion-reduce:animate-none opacity-0 [animation-delay:200ms] [content-visibility:auto]">
            <div className="h-full overflow-hidden rounded-md border border-border/50 bg-card/80">
              <GeCardHeader
                title="Request volume over time"
                subtitle="Inbound briefs · last 30 days · live"
                actions={
                  <Badge color="cyan" size="sm">
                    {formatNumber(requestVolumeTotal)} total
                  </Badge>
                }
              />
              <div className="px-3 pb-2 pt-0">
                <RequestVolumeAreaChart
                  data={requestVolume}
                  compact
                  hideHeader
                  loading={requestStatsQ.isPending && !requestStatsQ.data}
                  error={requestStatsQ.error}
                />
              </div>
            </div>

            <div className="h-full overflow-hidden rounded-md border border-border/50 bg-card/80">
              <GeCardHeader title="Moderation queues" subtitle="Flagged + contact inbox" />
              <div className="divide-y divide-border/40">
                {[
                  {
                    href: '/moderation',
                    label: 'Flagged messages',
                    value: flaggedCount,
                    icon: ShieldAlert,
                    tone: flaggedCount > 0 ? 'text-rose-400' : 'text-primary',
                  },
                  {
                    href: '/contact',
                    label: 'New contact mail',
                    value: contactNew,
                    icon: Inbox,
                    tone: contactNew > 0 ? 'text-amber-400' : 'text-primary',
                  },
                  {
                    href: '/payments?status=pending',
                    label: 'Pending settlements',
                    value: paymentPulse.pendingTransactions,
                    icon: CreditCard,
                    tone: paymentPulse.pendingTransactions > 0 ? 'text-amber-400' : 'text-primary',
                  },
                  {
                    href: '/messages',
                    label: 'Message center',
                    value: '→',
                    icon: MessageSquare,
                    tone: 'text-primary',
                  },
                ].map(({ href, label, value, icon: Icon, tone }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
                  >
                    <span className={cn('flex h-5 w-5 items-center justify-center', tone)}>
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="flex-1">{label}</span>
                    <span className="tabular-nums text-muted-foreground">{value}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {process.env.NODE_ENV === 'development' && <DebugApiSection payloads={debugPayloads} />}
        </div>
      </AdminQueryState>
    </div>
  );
}
