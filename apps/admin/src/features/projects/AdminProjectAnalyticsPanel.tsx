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

import { AdminQueryState, AdminSection } from '@/components/admin/AdminConsolePrimitives';
import { GeCard, GeCardHeader } from '@/components/admin/AdminGentelellaUI';
import { AdminMetricStrip, adminCardClass } from '@/components/admin/AdminPageChrome';
import {
  asArray,
  asRecord,
  extractMetricTiles,
  formatINR,
  formatNumber,
  getNum,
  getStr,
  humanizeKey,
} from '@/lib/admin-view-model';

function progressAnalyticsRows(data: unknown): { label: string; value: string }[] {
  const root = asRecord(data);
  const analytics = asRecord(root?.analytics) ?? root;
  if (!analytics) return [];

  const rows: { label: string; value: string }[] = [];
  const total = getNum(analytics.totalCount);
  if (total !== undefined) rows.push({ label: 'Total updates', value: formatNumber(total) });

  const byType = asRecord(analytics.byType);
  if (byType) {
    for (const [k, v] of Object.entries(byType)) {
      rows.push({ label: `Type · ${humanizeKey(k)}`, value: formatNumber(v) });
    }
  }

  const byMilestone = asArray(analytics.byMilestone);
  for (const item of byMilestone.slice(0, 8)) {
    const row = asRecord(item);
    if (!row) continue;
    const count = getNum(row.count) ?? getNum(asRecord(row._count)?._all) ?? getNum(row.total) ?? 0;
    const milestoneId = getStr(row.milestoneId);
    const looksLikeUuid = milestoneId
      ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(milestoneId)
      : false;
    // Prefer resolved title; avoid showing raw UUIDs (NL-UI-006).
    const name =
      getStr(row.milestoneName) ||
      getStr(row.name) ||
      (!looksLikeUuid ? milestoneId : null) ||
      'Milestone';
    rows.push({ label: name, value: formatNumber(count) });
  }

  return rows;
}

export function AdminProjectAnalyticsPanel({
  analytics,
  progressAnalytics,
  isLoading,
  error,
}: {
  analytics: unknown;
  progressAnalytics: unknown;
  isLoading: boolean;
  error: unknown;
}) {
  const projectKpis = extractMetricTiles(analytics, 'Project');
  const progressRows = progressAnalyticsRows(progressAnalytics);
  const projectRec = asRecord(analytics);
  const progressPct = getNum(projectRec?.progress);
  const budgetSpent = getNum(asRecord(projectRec?.budget)?.spent);

  const heroKpis = [
    ...(progressPct !== undefined
      ? [{ label: 'Progress', value: `${formatNumber(progressPct)}%` }]
      : []),
    ...(budgetSpent !== undefined
      ? [{ label: 'Budget spent', value: formatINR(budgetSpent) }]
      : []),
    ...projectKpis.filter((k) => !/progress|budget/i.test(k.label)).slice(0, 2),
  ];

  return (
    <AdminQueryState isLoading={isLoading} error={error}>
      <div className="space-y-6">
        <AdminMetricStrip
          items={heroKpis.length ? heroKpis : [{ label: 'Project analytics', value: '—' }]}
          max={4}
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <AdminSection
            title="Project metrics"
            description="Milestones, progress, and spend for this project."
          >
            <GeCard flush>
              <div className={`${adminCardClass} !shadow-none !border-0 overflow-hidden p-0`}>
                {projectKpis.length ? (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Metric</TableHeaderCell>
                        <TableHeaderCell className="text-right">Value</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projectKpis.map((k) => (
                        <TableRow key={k.label}>
                          <TableCell className="font-medium">{k.label}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {k.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-4">
                    <Text className="text-sm text-muted-foreground">
                      No project analytics available yet.
                    </Text>
                  </div>
                )}
              </div>
            </GeCard>
          </AdminSection>

          <AdminSection
            title="Progress analytics"
            description="Update frequency by type and milestone."
          >
            <GeCard flush>
              <GeCardHeader title="Activity breakdown" />
              <div className="ge-card-body space-y-3">
                {progressRows.length ? (
                  progressRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-2 border-b border-border/50 pb-2 last:border-0"
                    >
                      <span className="text-xs text-muted-foreground">{row.label}</span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {row.value}
                      </span>
                    </div>
                  ))
                ) : (
                  <Text className="text-sm text-muted-foreground">
                    No progress analytics available yet.
                  </Text>
                )}
              </div>
            </GeCard>
          </AdminSection>
        </div>
      </div>
    </AdminQueryState>
  );
}
