'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from '@nestlancer/ui';
import { Button } from '@nestlancer/ui';
import { Download } from '@nestlancer/ui/icons';
import { useQueries } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';
import { useMemo, useState } from 'react';

import { getApiErrorMessage } from '@nestlancer/api-client';

import { DebugApiSection } from '@/components/admin/AdminDataViews';
import {
  ProjectDonutChart,
  ChartQueryGate,
  RevenueAreaChart,
  SliceFaultBanner,
  UserActivityBarChart,
} from '@/components/admin/AdminCharts';
import {
  GeCard,
  GeCardHeader,
  GeChartTabs,
  GePageHeader,
} from '@/components/admin/AdminGentelellaUI';
import { AdminMetricStrip, AdminTabBar, adminCardClass } from '@/components/admin/AdminPageChrome';
import { adminKeys } from '@/lib/admin-query-keys';
import {
  buildRevenueCsv,
  extractProjectDashboardMetrics,
  extractQuoteAnalyticsKpis,
  extractRequestAnalyticsView,
  extractRevenueAreaSeries,
  extractRevenueDashboardView,
  extractUserActivityBars,
  extractUserDashboardMetrics,
  formatNumber,
  projectMetricsToDonut,
} from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';

const TABS = ['Revenue', 'Users', 'Projects', 'Requests'] as const;
const PERIOD_OPTIONS = ['7d', '30d', '90d', '1y'] as const;

function periodToApi(period: string): 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' {
  if (period === '7d') return 'WEEK';
  if (period === '90d') return 'QUARTER';
  if (period === '1y') return 'YEAR';
  return 'MONTH';
}

export function AnalyticsClient() {
  const [tab, setTab] = useState(0);
  const [chartPeriod, setChartPeriod] = useState<string>('30d');
  const apiPeriod = periodToApi(chartPeriod);

  const results = useQueries({
    queries: [
      {
        queryKey: [...adminKeys.revenue(), apiPeriod],
        queryFn: () => apiServices.admin.getRevenueAnalytics({ period: apiPeriod }),
        enabled: tab === 0,
      },
      {
        queryKey: [...adminKeys.root, 'analytics', 'users', apiPeriod],
        queryFn: () => apiServices.admin.getUserMetrics({ period: apiPeriod }),
        enabled: tab === 1,
      },
      {
        queryKey: [...adminKeys.root, 'analytics', 'projects', apiPeriod],
        queryFn: () => apiServices.admin.getProjectMetrics({ period: apiPeriod }),
        enabled: tab === 2,
      },
      {
        queryKey: adminKeys.requestStats(),
        queryFn: () => apiServices.admin.getAdminRequestStats(),
        enabled: tab === 3,
      },
      {
        queryKey: adminKeys.quoteStats(),
        queryFn: () => apiServices.admin.getAdminQuoteStats(),
        enabled: tab === 3,
      },
    ],
  });

  const activeQueryIndexes = tab === 3 ? [3, 4] : [tab];
  const loading = activeQueryIndexes.some(
    (i) => results[i]?.isPending && results[i]?.data === undefined
  );
  const sliceFaults: [string, unknown][] = [];
  const labels = ['Revenue', 'Users', 'Projects', 'Requests', 'Quotes'] as const;
  results.forEach((r, i) => {
    if (r.error) sliceFaults.push([labels[i]!, r.error]);
  });

  const revenueView = extractRevenueDashboardView(results[0].data);
  const revenueArea = extractRevenueAreaSeries([], results[0].data);
  const userBars = extractUserActivityBars(results[1].data, []);
  const userKpis = extractUserDashboardMetrics(results[1].data);
  const projectDonut = projectMetricsToDonut(results[2].data);
  const projectKpis = extractProjectDashboardMetrics(results[2].data);
  const requestView = extractRequestAnalyticsView(results[3].data);
  const quoteKpis = extractQuoteAnalyticsKpis(results[4].data);

  const revenueKpis = useMemo(() => {
    if (revenueView.kpis.length) {
      const items = [...revenueView.kpis];
      if (revenueView.trendLine) {
        items.push({ label: 'Period trend', value: revenueView.trendLine });
      }
      return items;
    }
    return [{ label: 'Completed payments', value: '—' }];
  }, [revenueView]);

  const downloadCsv = () => {
    try {
      const csv = buildRevenueCsv(results[0].data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-analytics-${chartPeriod}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Revenue CSV downloaded.');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not export revenue'));
    }
  };

  const debugPayloads = {
    revenue: results[0].data,
    users: results[1].data,
    projects: results[2].data,
    requests: results[3].data,
    quotes: results[4].data,
  } as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <GePageHeader
        pretitle="Analytics"
        title="Analytics hub"
        description="Revenue, users, projects, and requests — KPI strips, charts, and breakdowns."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminTabBar tabs={TABS.map((label) => ({ label }))} activeIndex={tab} onChange={setTab} />
        <div className="flex flex-wrap items-center gap-2">
          <GeChartTabs
            value={chartPeriod}
            onChange={setChartPeriod}
            options={[...PERIOD_OPTIONS]}
          />
          {tab === 0 ? (
            <Button
              size="sm"
              variant="outline"
              className="transition-transform hover:scale-[1.02]"
              onClick={downloadCsv}
              disabled={!results[0].data}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Download CSV
            </Button>
          ) : null}
        </div>
      </div>

      <ChartQueryGate isLoading={loading} error={null}>
        <div className="space-y-6">
          <SliceFaultBanner faults={sliceFaults} />

          {tab === 0 ? (
            <section className="space-y-4">
              <GeCardHeader title="Revenue" subtitle="Completed payments for the selected period" />
              <AdminMetricStrip items={revenueKpis} max={4} />
              <RevenueAreaChart
                data={revenueArea}
                loading={results[0].isPending && !results[0].data}
                error={results[0].error}
              />
              <GeCard flush>
                <GeCardHeader title="Revenue by category" />
                <div className={`${adminCardClass} !shadow-none !border-0 overflow-hidden p-0`}>
                  {revenueView.categories.length ? (
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Category</TableHeaderCell>
                          <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {revenueView.categories.map((c) => (
                          <TableRow key={c.name}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {c.amount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-4">
                      <Text className="text-sm text-muted-foreground">
                        No category breakdown for this period.
                      </Text>
                    </div>
                  )}
                </div>
              </GeCard>
            </section>
          ) : null}

          {tab === 1 ? (
            <section className="space-y-4">
              <GeCardHeader title="Users" subtitle="Acquisition and role mix" />
              <AdminMetricStrip items={userKpis} max={4} />
              <UserActivityBarChart
                data={userBars}
                loading={results[1].isPending && !results[1].data}
                error={results[1].error}
              />
              <GeCard flush>
                <GeCardHeader title="Role breakdown" />
                <div className={`${adminCardClass} !shadow-none !border-0 overflow-hidden p-0`}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Metric</TableHeaderCell>
                        <TableHeaderCell className="text-right">Value</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userKpis.map((k) => (
                        <TableRow key={k.label}>
                          <TableCell className="font-medium">{k.label}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {k.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </GeCard>
            </section>
          ) : null}

          {tab === 2 ? (
            <section className="space-y-4">
              <GeCardHeader
                title="Projects"
                subtitle="Lifecycle distribution and delivery health"
              />
              <AdminMetricStrip items={projectKpis.slice(0, 4)} max={4} />
              <div className="ge-row ge-col-2">
                <ProjectDonutChart
                  data={projectDonut}
                  loading={results[2].isPending && !results[2].data}
                  error={results[2].error}
                />
                <GeCard flush>
                  <GeCardHeader title="Status breakdown" />
                  <div className="ge-card-body space-y-3">
                    {projectKpis.slice(1).map((k) => (
                      <div
                        key={k.label}
                        className="flex items-baseline justify-between gap-2 border-b border-border/50 pb-2 last:border-0"
                      >
                        <span className="text-xs text-muted-foreground">{k.label}</span>
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {k.value}
                        </span>
                      </div>
                    ))}
                    {!projectKpis.length ? (
                      <Text className="text-sm text-muted-foreground">No project metrics.</Text>
                    ) : null}
                  </div>
                </GeCard>
              </div>
            </section>
          ) : null}

          {tab === 3 ? (
            <section className="space-y-4">
              <GeCardHeader title="Requests" subtitle="Inbound demand and quote conversion" />
              <AdminMetricStrip items={[...requestView.kpis, ...quoteKpis].slice(0, 4)} max={4} />
              <UserActivityBarChart
                data={requestView.bars}
                loading={results[3].isPending && !results[3].data}
                error={results[3].error}
                title="Request volume"
                description="New requests over the last 30 days"
              />
              <div className="grid gap-4 lg:grid-cols-2">
                <GeCard flush>
                  <GeCardHeader title="By status" />
                  <div className={`${adminCardClass} !shadow-none !border-0 overflow-hidden p-0`}>
                    {requestView.statusRows.length ? (
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeaderCell>Status</TableHeaderCell>
                            <TableHeaderCell className="text-right">Count</TableHeaderCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {requestView.statusRows.map((row) => (
                            <TableRow key={row.name}>
                              <TableCell className="font-medium">{row.name}</TableCell>
                              <TableCell className="text-right font-semibold tabular-nums">
                                {row.count}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-4">
                        <Text className="text-sm text-muted-foreground">No status data.</Text>
                      </div>
                    )}
                  </div>
                </GeCard>
                <GeCard flush>
                  <GeCardHeader title="By category" />
                  <div className={`${adminCardClass} !shadow-none !border-0 overflow-hidden p-0`}>
                    {requestView.categories.length ? (
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeaderCell>Category</TableHeaderCell>
                            <TableHeaderCell className="text-right">Count</TableHeaderCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {requestView.categories.map((row) => (
                            <TableRow key={row.name}>
                              <TableCell className="font-medium">{row.name}</TableCell>
                              <TableCell className="text-right font-semibold tabular-nums">
                                {row.count}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-4">
                        <Text className="text-sm text-muted-foreground">No category data.</Text>
                      </div>
                    )}
                  </div>
                </GeCard>
              </div>
              {quoteKpis.length ? (
                <GeCard flush>
                  <GeCardHeader title="Quote conversion" />
                  <div className="ge-card-body grid gap-3 sm:grid-cols-3">
                    {quoteKpis.map((k) => (
                      <div key={k.label}>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          {k.label}
                        </div>
                        <div className="mt-1 text-lg font-semibold tabular-nums">{k.value}</div>
                      </div>
                    ))}
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Request conversion
                      </div>
                      <div className="mt-1 text-lg font-semibold tabular-nums">
                        {requestView.kpis.find((k) => /conversion/i.test(k.label))?.value ||
                          formatNumber(0)}
                      </div>
                    </div>
                  </div>
                </GeCard>
              ) : null}
            </section>
          ) : null}

          <DebugApiSection payloads={debugPayloads} />
        </div>
      </ChartQueryGate>
    </div>
  );
}
