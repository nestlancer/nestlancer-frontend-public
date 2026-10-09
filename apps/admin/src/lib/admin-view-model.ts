import { fromPaise } from '@nestlancer/utils';

/** Defensive helpers for unknown admin API payloads (OpenAPI often omits schemas). */

export function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

export function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

export function getStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return '';
}

export function getNum(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return undefined;
}

/** Format API money amounts stored in paise. */
export function formatINR(paise: unknown): string {
  const n = getNum(paise);
  if (n === undefined) return '—';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(fromPaise(n));
  } catch {
    return String(n);
  }
}

export function formatNumber(amount: unknown): string {
  const n = getNum(amount);
  if (n === undefined) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
}

export function formatDate(iso: unknown): string {
  const s = getStr(iso);
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export type DeltaType = 'increase' | 'decrease' | 'unchanged';

export type KpiItem = {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  /**
   * Optional KPI delta (for dashboards only).
   * Example: "+12.3%" with increase/decrease coloring.
   */
  delta?: { deltaType: DeltaType; text: string };
};

export function humanizeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatScalar(v: unknown, maxLen = 200): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return formatNumber(v);
  if (typeof v === 'string') return v.length > maxLen ? `${v.slice(0, maxLen - 1)}…` : v;
  if (Array.isArray(v)) return v.length ? `${v.length} items` : 'Empty';
  const rec = asRecord(v);
  if (rec) {
    const parts: string[] = [];
    for (const [ik, iv] of Object.entries(rec)) {
      if (parts.length >= 6) {
        parts.push('…');
        break;
      }
      parts.push(`${humanizeKey(ik)}: ${formatScalar(iv, 80)}`);
    }
    return parts.join(' · ') || '—';
  }
  try {
    const s = JSON.stringify(v);
    return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s;
  } catch {
    return String(v);
  }
}

function formatLooseTrendValue(val: unknown): string {
  const r = asRecord(val);
  if (!r) return formatScalar(val);
  const parts: string[] = [];
  for (const [k, v] of Object.entries(r)) {
    if (parts.length >= 4) break;
    const n = getNum(v);
    parts.push(
      n !== undefined
        ? `${humanizeKey(k)} ${formatNumber(n)}`
        : `${humanizeKey(k)} ${formatScalar(v, 60)}`
    );
  }
  return parts.join(' · ') || formatScalar(val);
}

export function alertSeverityFromType(type: string): 'info' | 'warning' | 'critical' | undefined {
  if (type === 'critical' || type === 'warning' || type === 'info') return type;
  return undefined;
}

export function extractDashboardOverview(data: unknown): {
  kpis: KpiItem[];
  trends: { label: string; line: string }[];
  trendDeltas: Record<
    string,
    { change: number; trend: 'up' | 'down' | 'flat'; current?: number; previous?: number }
  >;
  activities: { id: string; title: string; description?: string; when?: string; tag?: string }[];
  alerts: {
    id: string;
    title: string;
    detail?: string;
    severity?: 'info' | 'warning' | 'critical';
  }[];
  health?: string;
  quickStats: KpiItem[];
  revenueBars: { label: string; value: number; pct: number }[];
  projectStatusBars: { label: string; value: number; pct: number }[];
  periodLabel?: string;
} {
  const o = asRecord(data);
  const periodRec = o ? asRecord(o.period) : null;
  let periodLabel: string | undefined;
  if (periodRec) {
    const start = getStr(periodRec.start);
    const end = getStr(periodRec.end);
    const days = getNum(periodRec.days);
    if (start && end) {
      periodLabel = `${formatDate(start)} — ${formatDate(end)}${days !== undefined ? ` · ${days}d window` : ''}`;
    }
  }
  const summary = o ? asRecord(o.summary) : null;
  const trendsObj = o ? asRecord(o.trends) : null;
  const trendDeltas: Record<
    string,
    { change: number; trend: 'up' | 'down' | 'flat'; current?: number; previous?: number }
  > = {};
  const currency = summary ? getStr(summary.currency) || 'INR' : 'INR';

  const fmtMoney = (v: unknown) => {
    const n = getNum(v);
    if (n === undefined) return '—';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(fromPaise(n));
    } catch {
      return String(n);
    }
  };

  const kpis: KpiItem[] = [];
  if (summary) {
    kpis.push(
      { label: 'Total users', value: formatNumber(summary.totalUsers) },
      { label: 'New users', value: formatNumber(summary.newUsers), hint: 'This window' },
      { label: 'Active projects', value: formatNumber(summary.activeProjects) },
      { label: 'Completed projects', value: formatNumber(summary.completedProjects) },
      { label: 'Revenue (month)', value: fmtMoney(summary.revenueThisMonth), hint: currency },
      {
        label: 'Pending requests',
        value: formatNumber(summary.pendingRequests),
        href: '/requests?status=inbox',
      },
      { label: 'Open quotes', value: formatNumber(summary.openQuotes), href: '/quotes' }
    );
  }

  const trends: { label: string; line: string }[] = [];
  if (trendsObj) {
    for (const [key, val] of Object.entries(trendsObj)) {
      const r = asRecord(val);
      if (!r) continue;
      const cur = getNum(r.current);
      const ch = getNum(r.change);
      const trend = getStr(r.trend);
      if (ch !== undefined) {
        const normalizedTrend =
          trend === 'up' || trend === 'down' || trend === 'flat' ? trend : 'flat';
        trendDeltas[key] = {
          change: ch,
          trend: normalizedTrend,
          current: cur,
          previous: getNum(r.previous),
        };
      }
      const moneyKey = /revenue|amount|paid|spent|value/i.test(key);
      const line =
        cur !== undefined
          ? `${moneyKey ? fmtMoney(cur) : formatNumber(cur)}${ch !== undefined ? ` · ${ch >= 0 ? '+' : ''}${formatNumber(ch)}` : ''}${trend ? ` · ${trend}` : ''}`
          : formatLooseTrendValue(val);
      trends.push({ label: humanizeKey(key), line });
    }
  }

  const rawActivity = asArray(o?.recentActivity);
  const activities = rawActivity.map((item, i) => {
    const r = asRecord(item);
    if (!r) return { id: String(i), title: String(item) };
    const user = asRecord(r.user);
    const who = user ? getStr(user.name) || getStr(user.id) : undefined;
    const action = getStr(r.title) || getStr(r.type) || 'Event';
    const detail = getStr(r.description);
    return {
      id: getStr(r.id) || String(i),
      title: who || action,
      description: who ? (detail ? `${action} — ${detail}` : action) : detail || undefined,
      when: formatDate(r.timestamp),
      tag: getStr(r.type) || undefined,
    };
  });

  const alertsRaw = asRecord(o?.alerts)?.data ?? o?.alerts;
  const alertList = Array.isArray(alertsRaw) ? alertsRaw : asArray(asRecord(alertsRaw)?.items);
  const alerts = alertList.map((item, i) => {
    const r = asRecord(item);
    if (!r) return { id: String(i), title: String(item) };
    const sev = getStr(r.type);
    const severity = alertSeverityFromType(sev);
    return {
      id: getStr(r.id) || String(i),
      title: getStr(r.title) || getStr(r.severity) || 'Alert',
      detail: getStr(r.message) || getStr(r.description),
      severity,
    };
  });

  const health = o ? getStr(o.systemHealth) : undefined;

  const quickStatsRaw = o ? asRecord(o.quickStats) : null;
  const quickStats: KpiItem[] = [];
  if (quickStatsRaw) {
    for (const [key, val] of Object.entries(quickStatsRaw)) {
      if (quickStats.length >= 6) break;
      const kl = key.toLowerCase();
      const n = getNum(val);
      const s = getStr(val);
      let value: string;
      if (typeof val === 'string' && val && (kl.includes('duration') || kl.includes('time'))) {
        value = val;
      } else if (n !== undefined) {
        if (kl.includes('value') || kl.includes('amount') || kl.includes('revenue')) {
          value = fmtMoney(n);
        } else if (kl.includes('satisfaction')) {
          value = `${formatNumber(n)} / 5`;
        } else if (kl.includes('rate')) {
          value = `${formatNumber(n)}%`;
        } else {
          value = formatNumber(n);
        }
      } else {
        value = s || formatScalar(val);
      }
      quickStats.push({ label: humanizeKey(key), value });
    }
  }

  const charts = o ? asRecord(o.charts) : null;
  const revenueByMonth = charts ? asArray(charts.revenueByMonth) : [];
  const revNums = revenueByMonth.map((row) => {
    const rr = asRecord(row);
    return getNum(rr?.amount) ?? getNum(rr?.revenue) ?? getNum(rr?.total) ?? 0;
  });
  const revMax = Math.max(1, ...revNums);
  const revenueBars = revenueByMonth.map((row, i) => {
    const rr = asRecord(row);
    const label = rr
      ? getStr(rr.date) || getStr(rr.month) || getStr(rr.period) || `M${i + 1}`
      : `M${i + 1}`;
    const value = getNum(rr?.amount) ?? getNum(rr?.revenue) ?? getNum(rr?.total) ?? 0;
    return { label, value, pct: Math.round((value / revMax) * 100) };
  });

  const projectsByStatus = charts ? asRecord(charts.projectsByStatus) : null;
  const statusEntries = projectsByStatus ? Object.entries(projectsByStatus) : [];
  const statusNums = statusEntries.map(([, v]) => getNum(v) ?? 0);
  const statusMax = Math.max(1, ...statusNums);
  const projectStatusBars = statusEntries.map(([k, v]) => {
    const value = getNum(v) ?? 0;
    return { label: humanizeKey(k), value, pct: Math.round((value / statusMax) * 100) };
  });

  return {
    kpis,
    trends,
    trendDeltas,
    activities,
    alerts,
    health,
    quickStats,
    revenueBars,
    projectStatusBars,
    periodLabel,
  };
}

/** Flatten top-level API object into readable rows (nested objects expanded one level). */
export function flattenShallow(obj: unknown, maxKeys = 24): { key: string; value: string }[] {
  const r = asRecord(obj);
  if (!r) return [];
  const out: { key: string; value: string }[] = [];
  let n = 0;
  for (const [k, v] of Object.entries(r)) {
    if (n >= maxKeys) break;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      const inner = asRecord(v);
      if (inner) {
        for (const [ik, iv] of Object.entries(inner)) {
          if (n++ >= maxKeys) break;
          out.push({ key: `${humanizeKey(k)} · ${humanizeKey(ik)}`, value: formatScalar(iv) });
        }
        continue;
      }
    }
    if (n++ >= maxKeys) break;
    out.push({ key: humanizeKey(k.replace(/_/g, ' ')), value: formatScalar(v) });
  }
  return out;
}

export type ChartAreaPoint = { period: string; Revenue: number };
export type RequestVolumePoint = { period: string; Requests: number };
export type ChartBarPoint = { name: string; Users: number };
export type ChartDonutPoint = { name: string; value: number };

/** @deprecated Use ChartAreaPoint */
export type TremorAreaPoint = ChartAreaPoint;
/** @deprecated Use ChartBarPoint */
export type TremorBarPoint = ChartBarPoint;
/** @deprecated Use ChartDonutPoint */
export type TremorDonutPoint = ChartDonutPoint;

export function extractRequestVolumeSeries(data: unknown): RequestVolumePoint[] {
  const r = asRecord(data);
  const chartData = r ? asArray(r.chartData) : [];
  if (!chartData.length) return [];
  return chartData
    .map((item, i) => {
      const row = asRecord(item);
      const period = getStr(row?.date) || getStr(row?.period) || getStr(row?.day) || `D${i + 1}`;
      const count =
        getNum(row?.count) ??
        getNum(row?.requests) ??
        getNum(row?.value) ??
        getNum(row?.total) ??
        0;
      return { period, Requests: count };
    })
    .filter((p) => p.period);
}

export function extractRevenueAreaSeries(
  overviewBars: { label: string; value: number }[],
  revenueData?: unknown
): ChartAreaPoint[] {
  const r = asRecord(revenueData);
  const chartData = r ? asArray(r.chartData) : [];
  if (chartData.length) {
    return chartData.map((item, i) => {
      const row = asRecord(item);
      const period = getStr(row?.month) || getStr(row?.date) || getStr(row?.period) || `P${i + 1}`;
      const revenuePaise = getNum(row?.revenue) ?? getNum(row?.amount) ?? getNum(row?.total) ?? 0;
      // Keep paise — AdminCharts valueFormatter (formatINR) converts once.
      return { period, Revenue: revenuePaise };
    });
  }
  if (overviewBars.length) {
    return overviewBars.map((b) => ({ period: b.label, Revenue: b.value }));
  }
  return [];
}

export type PaymentPulse = {
  pendingAmount: number;
  pendingTransactions: number;
  completedTransactions: number;
  recent: {
    id: string;
    client: string;
    project: string;
    amountLabel: string;
    when: string;
  }[];
};

export function extractPaymentPulse(data: unknown): PaymentPulse {
  const r = asRecord(data);
  const recent = asArray(r?.recentTransactions)
    .slice(0, 5)
    .map((item, i) => {
      const row = asRecord(item);
      return {
        id: getStr(row?.id) || String(i),
        client: getStr(row?.clientName) || 'Client',
        project: getStr(row?.projectTitle) || '—',
        amountLabel: formatINR(row?.amount),
        when: formatDate(row?.paidAt),
      };
    });
  return {
    pendingAmount: getNum(r?.pendingAmount) ?? 0,
    pendingTransactions: getNum(r?.pendingTransactions) ?? 0,
    completedTransactions: getNum(r?.completedTransactions) ?? 0,
    recent,
  };
}

export function extractRevenueByCategory(
  revenueData: unknown
): { label: string; value: number; pct: number }[] {
  const r = asRecord(revenueData);
  const rows = asArray(r?.byCategory);
  if (!rows.length) return [];
  const nums = rows.map((item) => {
    const row = asRecord(item);
    return getNum(row?.amount) ?? getNum(row?.total) ?? getNum(row?.value) ?? 0;
  });
  const total = nums.reduce((s, n) => s + n, 0) || 1;
  return rows.slice(0, 5).map((item, i) => {
    const row = asRecord(item);
    const value = nums[i] ?? 0;
    return {
      label: getStr(row?.category) || getStr(row?.name) || getStr(row?.label) || `Cat ${i + 1}`,
      value,
      pct: (value / total) * 100,
    };
  });
}

export function extractQueueCount(data: unknown): number {
  const r = asRecord(data);
  const pagination = asRecord(r?.pagination);
  const fromPagination = getNum(pagination?.total) ?? getNum(pagination?.totalItems);
  if (fromPagination !== undefined) return fromPagination;
  const summary = asRecord(r?.summary);
  const fromSummary =
    getNum(summary?.newMessages) ?? getNum(summary?.total) ?? getNum(summary?.pending);
  if (fromSummary !== undefined) return fromSummary;
  const list = asArray(r?.data).length || asArray(r?.items).length || asArray(data).length;
  return list;
}

export function extractUserActivityBars(
  userData: unknown,
  trends: { label: string; line: string }[]
): ChartBarPoint[] {
  const r = asRecord(userData);
  const byRole = r ? asRecord(r.byRole) : null;
  const roleBars =
    byRole && Object.keys(byRole).length
      ? Object.entries(byRole).map(([k, v]) => ({
          name: humanizeKey(k),
          Users: getNum(v) ?? 0,
        }))
      : [];

  const chartData = r ? asArray(r.chartData) : [];
  if (chartData.length) {
    const series = chartData
      .map((item) => {
        const row = asRecord(item);
        const name = getStr(row?.date) || getStr(row?.period) || '';
        const users =
          getNum(row?.count) ?? getNum(row?.new) ?? getNum(row?.users) ?? getNum(row?.value) ?? 0;
        return { name, Users: users };
      })
      .filter((p) => p.name);
    const nonzero = series.filter((p) => p.Users > 0);
    // Only use daily series when it has real signal; otherwise role mix reads better.
    if (nonzero.length >= 2) {
      // Bucket to weekly when too dense for the lightweight bar chart.
      if (series.length > 14) {
        const buckets = new Map<string, number>();
        for (const p of series) {
          const d = new Date(p.name);
          if (Number.isNaN(d.getTime())) {
            buckets.set(p.name, (buckets.get(p.name) ?? 0) + p.Users);
            continue;
          }
          const week = new Date(d);
          week.setUTCDate(week.getUTCDate() - week.getUTCDay());
          const key = week.toISOString().slice(0, 10);
          buckets.set(key, (buckets.get(key) ?? 0) + p.Users);
        }
        return Array.from(buckets.entries()).map(([name, Users]) => ({ name, Users }));
      }
      return series;
    }
  }

  if (roleBars.length) return roleBars;

  if (trends.length) {
    return trends.map((t) => {
      const match = t.line.match(/([\d,.]+)/);
      const parsed = match?.[1] ? getNum(match[1].replace(/,/g, '')) : undefined;
      return { name: t.label, Users: parsed ?? 0 };
    });
  }
  const total = getNum(r?.total);
  const active = getNum(r?.active);
  const neu = getNum(r?.newThisMonth);
  const pts: ChartBarPoint[] = [];
  if (total !== undefined) pts.push({ name: 'Total', Users: total });
  if (active !== undefined) pts.push({ name: 'Active', Users: active });
  if (neu !== undefined) pts.push({ name: 'New (month)', Users: neu });
  return pts;
}

export function barsToDonutSeries(bars: { label: string; value: number }[]): ChartDonutPoint[] {
  return bars.filter((b) => b.value > 0).map((b) => ({ name: b.label, value: b.value }));
}

export function projectMetricsToDonut(data: unknown): ChartDonutPoint[] {
  const r = asRecord(data);
  const byStatus = r ? asRecord(r.byStatus) : null;
  if (byStatus) {
    return Object.entries(byStatus)
      .map(([k, v]) => ({ name: humanizeKey(k), value: getNum(v) ?? 0 }))
      .filter((p) => p.value > 0);
  }
  return [];
}

export type UptimeTrackerBlock = { color: string; tooltip: string };

export function buildUptimeTracker(
  performanceData: unknown,
  health?: string
): UptimeTrackerBlock[] {
  const r = asRecord(performanceData);
  const uptime = getNum(r?.uptime);
  const healthStr = health ?? getStr(r?.health);
  let pct = uptime;
  if (pct === undefined) {
    if (healthStr === 'healthy') pct = 99.95;
    else if (healthStr === 'degraded' || healthStr === 'warn') pct = 97.5;
    else pct = 99.5;
  }
  const blocks = 40;
  const good = Math.min(blocks, Math.max(0, Math.round((pct / 100) * blocks)));
  return Array.from({ length: blocks }, (_, i) => ({
    color: i < good ? 'cyan' : 'rose',
    tooltip: i < good ? 'Operational' : 'Incident window',
  }));
}

export function extractRevenueDashboardView(data: unknown): {
  kpis: KpiItem[];
  trendLine?: string;
  categories: { name: string; amount: string }[];
  seriesNote?: string;
} {
  const r = asRecord(data);
  if (!r) return { kpis: [], categories: [] };
  const currency = getStr(r.currency) || 'INR';
  const fmtMoney = (v: unknown) => {
    const num = getNum(v);
    if (num === undefined) return '—';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(fromPaise(num));
    } catch {
      return String(num);
    }
  };
  const kpis: KpiItem[] = [
    { label: 'Completed payments (total)', value: fmtMoney(r.total), hint: currency },
  ];
  const trends = asRecord(r.trends);
  let trendLine: string | undefined;
  if (trends) {
    const cur = getNum(trends.current);
    const ch = getNum(trends.change);
    const tr = getStr(trends.trend);
    // trends.current is paise (same as summary totals) — convert before display.
    trendLine =
      cur !== undefined
        ? `${fmtMoney(cur)}${ch !== undefined ? ` · ${ch >= 0 ? '+' : ''}${formatNumber(ch)}` : ''}${tr ? ` · ${tr}` : ''}`
        : formatLooseTrendValue(trends);
  }
  const byCat = asArray(r.byCategory);
  const categories = byCat.map((item, i) => {
    const row = asRecord(item);
    return {
      name: row ? getStr(row.category) || `Category ${i + 1}` : `Category ${i + 1}`,
      amount: row ? fmtMoney(row.amount) : '—',
    };
  });
  const chartData = asArray(r.chartData);
  let seriesNote: string | undefined;
  if (!categories.length && chartData.length) {
    seriesNote = `${chartData.length} time series points (see overview charts for aggregates)`;
  }
  return { kpis, trendLine, categories, seriesNote };
}

/** KPI strip for the users directory (stitch screen 14). */
export function extractUsersDirectoryKpis(
  securityStats: unknown,
  userMetrics?: unknown
): KpiItem[] {
  const sec = asRecord(securityStats);
  const metrics = asRecord(userMetrics);
  const total = getNum(sec?.totalUsers) ?? getNum(metrics?.total);
  const active = getNum(sec?.activeUsers) ?? getNum(metrics?.active);
  const suspended = getNum(sec?.suspendedUsers);
  const pending =
    getNum(sec?.pendingUsers) ?? getNum(sec?.pendingDeletion) ?? getNum(metrics?.pendingDeletion);

  const kpis: KpiItem[] = [];
  if (total !== undefined) kpis.push({ label: 'Total users', value: formatNumber(total) });
  if (active !== undefined) kpis.push({ label: 'Active', value: formatNumber(active) });
  if (pending !== undefined) {
    kpis.push({ label: 'Pending', value: formatNumber(pending), hint: 'Awaiting approval' });
  } else if (metrics?.newThisMonth != null) {
    kpis.push({
      label: 'New this month',
      value: formatNumber(metrics.newThisMonth),
    });
  }
  if (suspended !== undefined) kpis.push({ label: 'Suspended', value: formatNumber(suspended) });
  return kpis.length ? kpis : extractUserDashboardMetrics(userMetrics ?? securityStats);
}

/** KPI strip for user detail sidebar (stitch screen 15). */
export function extractUserDetailKpis(input: {
  requestCount: number;
  projectCount: number;
  totalPaidPaise: number;
  lastActiveLabel: string;
  currency?: string;
}): KpiItem[] {
  const currency = input.currency ?? 'INR';
  let paidLabel = '—';
  try {
    paidLabel = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(fromPaise(input.totalPaidPaise));
  } catch {
    paidLabel = formatNumber(input.totalPaidPaise);
  }

  return [
    { label: 'Requests', value: String(input.requestCount) },
    { label: 'Projects', value: String(input.projectCount) },
    { label: 'Total paid', value: paidLabel },
    { label: 'Last active', value: input.lastActiveLabel },
  ];
}

/** KPI strip for payments hub — prefer platform COMPLETED revenue when provided. */
export function extractPaymentsHubKpis(
  projectSummaries: {
    paidAmountPaise: number;
    pendingAmountPaise: number;
    milestoneCount: number;
    paidCount: number;
    pendingCount: number;
  }[],
  opts?: { totalCollectedPaise?: number }
): KpiItem[] {
  let collected = 0;
  let outstanding = 0;
  let pendingMilestones = 0;

  for (const row of projectSummaries) {
    collected += row.paidAmountPaise;
    outstanding += row.pendingAmountPaise;
    pendingMilestones += row.pendingCount;
  }

  const totalCollected =
    typeof opts?.totalCollectedPaise === 'number' ? opts.totalCollectedPaise : collected;

  return [
    { label: 'Total collected', value: formatINR(totalCollected) },
    { label: 'Outstanding', value: formatINR(outstanding) },
    {
      label: 'Pending milestones',
      value: String(pendingMilestones),
      hint: `${projectSummaries.length} projects`,
    },
  ];
}

export function extractUserDashboardMetrics(data: unknown): KpiItem[] {
  const r = asRecord(data);
  if (!r) return [];
  const kpis: KpiItem[] = [
    { label: 'Total users', value: formatNumber(r.total) },
    { label: 'Active', value: formatNumber(r.active) },
    { label: 'New this month', value: formatNumber(r.newThisMonth) },
  ];
  const byRole = asRecord(r.byRole);
  if (byRole) {
    const parts = Object.entries(byRole).map(([k, v]) => `${humanizeKey(k)}: ${formatNumber(v)}`);
    kpis.push({ label: 'By role', value: parts.join(' · ') });
  }
  return kpis;
}

export function extractProjectDashboardMetrics(data: unknown): KpiItem[] {
  const r = asRecord(data);
  if (!r) return [];
  const kpis: KpiItem[] = [{ label: 'Total projects', value: formatNumber(r.total) }];
  const byStatus = asRecord(r.byStatus);
  if (byStatus) {
    for (const [k, v] of Object.entries(byStatus)) {
      if (kpis.length >= 12) break;
      kpis.push({ label: humanizeKey(k), value: formatNumber(v) });
    }
  }
  if (r.avgCompletionTimeDays != null) {
    kpis.push({ label: 'Avg. completion (days)', value: formatNumber(r.avgCompletionTimeDays) });
  }
  if (r.onTimeRate != null) {
    kpis.push({ label: 'On-time rate', value: `${formatNumber(r.onTimeRate)}%` });
  }
  return kpis.length ? kpis : [{ label: 'Projects', value: '—' }];
}

export function extractPerformanceDashboardMetrics(data: unknown): KpiItem[] {
  const r = asRecord(data);
  if (!r) return [];
  const kpis: KpiItem[] = [];
  const rt = asRecord(r.responseTime);
  if (rt) {
    if (rt.p50 !== undefined)
      kpis.push({ label: 'Latency p50', value: `${formatNumber(rt.p50)} ms` });
    if (rt.p95 !== undefined)
      kpis.push({ label: 'Latency p95', value: `${formatNumber(rt.p95)} ms` });
    if (rt.p99 !== undefined)
      kpis.push({ label: 'Latency p99', value: `${formatNumber(rt.p99)} ms` });
  }
  if (r.p50 !== undefined && !rt?.p50)
    kpis.push({ label: 'Latency p50', value: `${formatNumber(r.p50)} ms` });
  if (r.p99 !== undefined) kpis.push({ label: 'Latency p99', value: `${formatNumber(r.p99)} ms` });
  if (r.errorRate !== undefined)
    kpis.push({ label: 'Error rate', value: `${formatNumber(r.errorRate)}%` });
  if (r.uptime !== undefined) kpis.push({ label: 'Uptime', value: `${formatNumber(r.uptime)}%` });
  if (r.memoryUsage !== undefined)
    kpis.push({ label: 'Memory', value: `${formatNumber(r.memoryUsage)} MB` });
  if (r.cpuUsage !== undefined) kpis.push({ label: 'CPU', value: `${formatNumber(r.cpuUsage)}%` });
  if (r.health) kpis.push({ label: 'Health', value: getStr(r.health) });
  return kpis.length ? kpis : [{ label: 'Performance', value: '—' }];
}

/** Turn a numeric record (e.g. status counts) into horizontal bar rows. */
export function recordToDistributionBars(
  data: unknown
): { label: string; value: number; pct: number }[] {
  const r = asRecord(data);
  if (!r) return [];
  const entries = Object.entries(r).map(([k, v]) => ({
    label: humanizeKey(k),
    value: getNum(v) ?? 0,
  }));
  const max = Math.max(1, ...entries.map((e) => e.value));
  return entries.map((e) => ({ ...e, pct: Math.round((e.value / max) * 100) }));
}

export function extractProjectStats(data: unknown): KpiItem[] {
  const r = asRecord(data);
  if (!r) return [];
  /** GET /admin/projects/stats (projects service) — total, active, completed, byStatus, monthlyTrends */
  if ('monthlyTrends' in r || ('active' in r && 'completed' in r)) {
    const kpis: KpiItem[] = [
      { label: 'Total projects', value: formatNumber(r.total) },
      { label: 'Active', value: formatNumber(r.active) },
      { label: 'Completed', value: formatNumber(r.completed) },
    ];
    const byStatus = asRecord(r.byStatus);
    if (byStatus) {
      for (const [k, v] of Object.entries(byStatus)) {
        if (kpis.length >= 14) break;
        kpis.push({ label: humanizeKey(k), value: formatNumber(v) });
      }
    }
    return kpis.length ? kpis : [{ label: 'Stats', value: '—' }];
  }
  /** GET /admin/dashboard/projects */
  return extractProjectDashboardMetrics(data);
}

export type ProjectStatsSummary = {
  total: string;
  active: string;
  completed: string;
  statuses: { label: string; value: string; count: number }[];
};

/** Compact headline stats for the projects list (no duplicate KPI + chart). */
export function extractProjectStatsSummary(data: unknown): ProjectStatsSummary | null {
  const r = asRecord(data);
  if (!r) return null;
  const byStatus = asRecord(r.byStatus);
  const statuses = byStatus
    ? Object.entries(byStatus)
        .map(([k, v]) => ({
          label: humanizeKey(k),
          value: formatNumber(v),
          count: getNum(v) ?? 0,
        }))
        .sort((a, b) => b.count - a.count)
    : [];
  return {
    total: formatNumber(r.total),
    active: formatNumber(r.active),
    completed: formatNumber(r.completed),
    statuses,
  };
}

/** API envelope / series keys that must not surface as KPI tile labels. */
const METRIC_TILE_SKIP = new Set([
  'chartData',
  'chart',
  'series',
  'data',
  'items',
  'rows',
  'meta',
  'pagination',
  'status',
  'success',
  'message',
  'error',
  'errors',
  'links',
  'categories',
  'breakdown',
  'timeline',
]);

export function extractMetricTiles(data: unknown, title = 'Metrics'): KpiItem[] {
  if (Array.isArray(data)) {
    return [{ label: title, value: formatNumber(data.length) }];
  }
  const r = asRecord(data);
  if (!r) return [{ label: title, value: 'No data' }];
  const kpis: KpiItem[] = [];
  // Prefer explicit list pagination totals over raw envelope keys (status/data).
  const pagination = asRecord(r.pagination) ?? asRecord(r.meta);
  const pageTotal = getNum(pagination?.total) ?? getNum(pagination?.totalItems);
  if (pageTotal !== undefined && (Array.isArray(r.data) || Array.isArray(r.items))) {
    return [{ label: title, value: formatNumber(pageTotal) }];
  }
  for (const [k, v] of Object.entries(r)) {
    if (kpis.length >= 8) break;
    if (METRIC_TILE_SKIP.has(k)) continue;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      const inner = asRecord(v);
      if (inner && ('current' in inner || 'count' in inner || 'total' in inner)) {
        const num = getNum(inner.current) ?? getNum(inner.count) ?? getNum(inner.total);
        kpis.push({
          label: humanizeKey(k),
          value: num !== undefined ? formatNumber(num) : '…',
          hint: getStr(inner.trend) || undefined,
        });
        continue;
      }
    }
    if (typeof v === 'number') {
      const kl = k.toLowerCase();
      let value: string;
      if (kl.includes('rate') && v >= 0 && v <= 1) {
        value = `${formatNumber(v * 100)}%`;
      } else if (kl.includes('rate')) {
        value = `${formatNumber(v)}%`;
      } else if (
        kl.includes('value') ||
        kl.includes('amount') ||
        kl.includes('revenue') ||
        kl.includes('spent') ||
        kl.includes('paid')
      ) {
        value = formatINR(v);
      } else {
        value = formatNumber(v);
      }
      kpis.push({ label: humanizeKey(k), value });
    } else if (typeof v === 'string') {
      kpis.push({ label: humanizeKey(k), value: v });
    } else if (Array.isArray(v)) {
      kpis.push({ label: humanizeKey(k), value: formatNumber(v.length) });
    }
  }
  return kpis.length ? kpis : [{ label: title, value: '—' }];
}

/** Pick column keys from first object in a list (limited). */
export function inferColumns(rows: Record<string, unknown>[], max = 6): string[] {
  const first = rows[0];
  if (!first) return [];
  const keys = Object.keys(first).filter(
    (k) => k !== 'passwordHash' && !k.toLowerCase().includes('secret')
  );
  return keys.slice(0, max);
}

export function cellPreview(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return formatNumber(v);
  if (typeof v === 'string') return v.length > 80 ? `${v.slice(0, 77)}…` : v;
  try {
    const s = JSON.stringify(v);
    return s.length > 80 ? `${s.slice(0, 77)}…` : s;
  } catch {
    return String(v);
  }
}

/** Request analytics KPIs + chart + category breakdown for Analytics hub. */
export function extractRequestAnalyticsView(data: unknown): {
  kpis: KpiItem[];
  bars: ChartBarPoint[];
  categories: { name: string; count: string }[];
  statusRows: { name: string; count: string }[];
} {
  const r = asRecord(data);
  if (!r) return { kpis: [], bars: [], categories: [], statusRows: [] };

  const kpis: KpiItem[] = [
    { label: 'Total requests', value: formatNumber(r.total) },
    {
      label: 'Conversion rate',
      value: r.conversionRate != null ? `${formatNumber(r.conversionRate)}%` : '—',
    },
    {
      label: 'Avg. response time',
      value: getStr(r.averageResponseTime) || '—',
    },
  ];

  const byStatus = asRecord(r.byStatus);
  if (byStatus) {
    const open =
      (getNum(byStatus.submitted) ?? 0) +
      (getNum(byStatus.underReview) ?? 0) +
      (getNum(byStatus.changesRequested) ?? 0);
    kpis.push({ label: 'Open pipeline', value: formatNumber(open) });
  }

  const chartData = asArray(r.chartData);
  let bars: ChartBarPoint[] = chartData.map((item) => {
    const row = asRecord(item);
    return {
      name: getStr(row?.date) || getStr(row?.period) || '—',
      Users: getNum(row?.count) ?? 0,
    };
  });
  if (!bars.length && byStatus) {
    bars = Object.entries(byStatus).map(([k, v]) => ({
      name: humanizeKey(k),
      Users: getNum(v) ?? 0,
    }));
  }

  const byCategory = asArray(r.byCategory);
  const categories = byCategory.map((item, i) => {
    const row = asRecord(item);
    return {
      name: getStr(row?.category) || `Category ${i + 1}`,
      count: formatNumber(row?.count),
    };
  });

  const statusRows = byStatus
    ? Object.entries(byStatus).map(([k, v]) => ({
        name: humanizeKey(k),
        count: formatNumber(v),
      }))
    : [];

  return { kpis, bars, categories, statusRows };
}

/** Quote stats strip for Requests analytics tab. */
export function extractQuoteAnalyticsKpis(data: unknown): KpiItem[] {
  const r = asRecord(data);
  if (!r) return [];
  const kpis: KpiItem[] = [{ label: 'Total quotes', value: formatNumber(r.total) }];
  if (r.totalAcceptedValue != null) {
    kpis.push({ label: 'Accepted value', value: formatINR(r.totalAcceptedValue) });
  }
  if (r.acceptanceRate != null) {
    const rate = getNum(r.acceptanceRate) ?? 0;
    const pct = rate <= 1 ? rate * 100 : rate;
    kpis.push({ label: 'Acceptance rate', value: `${formatNumber(Math.round(pct * 10) / 10)}%` });
  }
  return kpis;
}

/** Download helper for revenue CSV built from analytics payload. */
export function buildRevenueCsv(data: unknown): string {
  const r = asRecord(data);
  const lines = ['section,key,value'];
  if (!r) return lines.join('\n');
  lines.push(`summary,total,${getNum(r.total) ?? 0}`);
  lines.push(`summary,currency,${getStr(r.currency) || 'INR'}`);
  const trends = asRecord(r.trends);
  if (trends) {
    lines.push(`trend,current,${getNum(trends.current) ?? ''}`);
    lines.push(`trend,previous,${getNum(trends.previous) ?? ''}`);
    lines.push(`trend,change,${getNum(trends.change) ?? ''}`);
    lines.push(`trend,direction,${getStr(trends.trend)}`);
  }
  for (const item of asArray(r.chartData)) {
    const row = asRecord(item);
    if (!row) continue;
    const key = getStr(row.date) || getStr(row.period) || getStr(row.month);
    const val = getNum(row.amount) ?? getNum(row.revenue) ?? getNum(row.total) ?? 0;
    lines.push(`chart,${csvEscape(key)},${val}`);
  }
  for (const item of asArray(r.byCategory)) {
    const row = asRecord(item);
    if (!row) continue;
    lines.push(`category,${csvEscape(getStr(row.category))},${getNum(row.amount) ?? 0}`);
  }
  return lines.join('\n');
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
