'use client';

import { cn } from '@nestlancer/ui';

import { extractProjectStatsSummary } from '@/lib/admin-view-model';

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

export function AdminProjectStatsSummary({
  data,
  className,
}: {
  data: unknown;
  className?: string;
}) {
  const summary = extractProjectStatsSummary(data);
  if (!summary) return null;

  const visibleStatuses = summary.statuses.filter((s) => s.count > 0);

  return (
    <div className={cn('ge-card overflow-hidden shadow-sm', className)}>
      <div className="grid divide-y divide-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <KpiTile label="Total projects" value={summary.total} />
        <KpiTile label="Active" value={summary.active} />
        <KpiTile label="Completed" value={summary.completed} />
      </div>

      {visibleStatuses.length > 0 ? (
        <div className="border-t border-border/60 bg-muted/15 px-4 py-3.5 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status breakdown
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {visibleStatuses.map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-sm"
              >
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-semibold tabular-nums text-foreground">{s.value}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
