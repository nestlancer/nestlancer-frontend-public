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
  GeCard,
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
  value,
  tone = 'default',
}: {
  href: string;
  label: string;
  value: string;
  tone?: 'default' | 'warning' | 'critical' | 'success';
}) {
  const toneClass =
    tone === 'warning'
      ? 'border-amber-500/35 bg-amber-500/10 text-amber-200'
      : tone === 'critical'
        ? 'border-rose-500/35 bg-rose-500/10 text-rose-200'
        : tone === 'success'
          ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
          : 'border-border/70 bg-card/80 text-foreground';

  return (
    <Link
      href={href}
      className={cn(
        'group flex min-w-[8.5rem] flex-1 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition-all',
        'hover:-translate-y-0.5 hover:border-primary/40',
        toneClass
      )}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-base font-semibold tabular-nums tracking-tight">{value}</p>
      </div>
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
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/pipeline">Pipelines</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/analytics">Analytics</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/requests?status=inbox">
                <Inbox className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Inbox
              </Link>
            </Button>
          </>
        }
      />

      <SliceFaultBanner faults={sliceFaults} />

      <AdminQueryState isLoading={isLoading} error={null}>
        <div className="space-y-4">
          <section
            aria-label="Needs attention"
            className="animate-fade-in-up motion-reduce:animate-none opacity-0 [animation-delay:40ms]"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" aria-hidden />
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Needs attention
                </h2>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Live
                </span>
              </div>
              {overview.health ? (
                <Badge color={healthTone} size="sm">
                  System {overview.health}
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <AttentionChip
                href="/requests?status=inbox"
                label="Pending requests"
                value={String(pendingRequests)}
                tone={pendingRequests > 0 ? 'warning' : 'success'}
              />
              <AttentionChip
                href="/quotes"
                label="Open quotes"
                value={String(openQuotes)}
                tone={openQuotes > 0 ? 'default' : 'success'}
              />
              <AttentionChip
                href="/payments?status=pending"
                label="Pending pay"
                value={String(paymentPulse.pendingTransactions)}
                tone={paymentPulse.pendingTransactions > 0 ? 'warning' : 'success'}
              />
              <AttentionChip
                href="/moderation"
                label="Flagged msgs"
                value={String(flaggedCount)}
                tone={flaggedCount > 0 ? 'critical' : 'success'}
              />
              <AttentionChip
                href="/contact"
                label="Contact new"
                value={String(contactNew)}
                tone={contactNew > 0 ? 'warning' : 'success'}
              />
              <AttentionChip
                href="/system"
                label="Alerts"
                value={String(liveAlerts.length)}
                tone={liveAlerts.length > 0 ? 'critical' : 'success'}
              />
            </div>
          </section>

          <section className="animate-fade-in-up motion-reduce:animate-none opacity-0 [animation-delay:70ms]">
            <div className="ge-kpi-tile ge-kpi-tile--hero">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link href="/analytics" className="min-w-0 flex-1 no-underline text-inherit">
                  <p className="ge-kpi-tile-label">{revenueKpi?.label || 'Revenue (period)'}</p>
                  <p className="ge-kpi-tile-value mt-1">{revenueKpi?.value || '—'}</p>
                  <p className="ge-kpi-tile-hint mt-1">
                    {overview.periodLabel || revenueKpi?.hint || 'Completed payments'}
                    {paymentPulse.pendingAmount > 0
                      ? ` · ${formatINR(paymentPulse.pendingAmount)} awaiting settlement`
                      : ''}
                  </p>
                </Link>
                <div className="flex flex-col items-end gap-2">
                  <GeChartTabs
                    value={chartPeriod}
                    onChange={setChartPeriod}
                    options={[...PERIOD_OPTIONS]}
                  />
                  {getKpiDeltaFromKey('revenue') ? (
                    <Badge
                      color={
                        getKpiDeltaFromKey('revenue')!.deltaType === 'increase'
                          ? 'emerald'
                          : getKpiDeltaFromKey('revenue')!.deltaType === 'decrease'
                            ? 'rose'
                            : 'slate'
                      }
                      size="sm"
                    >
                      {getKpiDeltaFromKey('revenue')!.text} vs prior
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <AdminMetricStrip items={supportingKpis} max={6} className="gap-3" />

          {overview.quickStats.length ? (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 animate-fade-in-up motion-reduce:animate-none opacity-0 [animation-delay:90ms]">
              {overview.quickStats.slice(0, 4).map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border/70 bg-card/70 px-3.5 py-2.5"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="ge-row ge-col-8-4 animate-fade-in-up motion-reduce:animate-none opacity-0 [animation-delay:120ms] [content-visibility:auto]">
            <GeCard flush className="h-full overflow-hidden">
              <div className="relative">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_70%)]"
                  aria-hidden
                />
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
                <div className="relative px-3 pb-2 pt-0">
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
            </GeCard>

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
            <GeCard flush className="h-full overflow-hidden">
              <div className="relative">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_top,hsl(186_94%_43%/0.16),transparent_72%)]"
                  aria-hidden
                />
                <GeCardHeader
                  title="Request volume over time"
                  subtitle="Inbound briefs · last 30 days · live"
                  actions={
                    <Badge color="cyan" size="sm">
                      {formatNumber(requestVolumeTotal)} total
                    </Badge>
                  }
                />
                <div className="relative px-3 pb-2 pt-0">
                  <RequestVolumeAreaChart
                    data={requestVolume}
                    compact
                    hideHeader
                    loading={requestStatsQ.isPending && !requestStatsQ.data}
                    error={requestStatsQ.error}
                  />
                </div>
              </div>
            </GeCard>

            <GeCard flush className="h-full">
              <GeCardHeader title="Moderation queues" subtitle="Flagged + contact inbox" />
              <div className="ge-card-body space-y-1 !py-1">
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
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md bg-primary/10',
                        tone
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="flex-1">{label}</span>
                    <span className="tabular-nums text-muted-foreground">{value}</span>
                  </Link>
                ))}
              </div>
            </GeCard>
          </div>

          {process.env.NODE_ENV === 'development' && <DebugApiSection payloads={debugPayloads} />}
        </div>
      </AdminQueryState>
    </div>
  );
}
