'use client';

import { formatIsoDate } from '@nestlancer/utils';
import { StatusBadge } from '@nestlancer/ui';

import { clientEmailFromRow, formatAdminStatus, projectStatusTone } from '@/lib/admin-response';

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="ge-kpi-tile px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1.5 text-sm font-semibold text-foreground">{value}</div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function AdminProjectSummaryStrip({
  record,
  milestoneCount,
  deliverableCount,
  deliverablesAwaitingReview,
}: {
  record: Record<string, unknown>;
  milestoneCount: number;
  deliverableCount: number;
  deliverablesAwaitingReview: number;
}) {
  const statusLabel = formatAdminStatus(record.status);
  const deadline = record.targetEndDate ?? record.deadline;
  const clientLabel = clientEmailFromRow(record);
  const operator =
    record.admin && typeof record.admin === 'object'
      ? String((record.admin as Record<string, unknown>).email ?? '—')
      : record.adminId
        ? String(record.adminId)
        : 'Unassigned';

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label="Status"
        value={<StatusBadge variant={projectStatusTone(record.status)}>{statusLabel}</StatusBadge>}
      />
      <StatCard label="Client" value={clientLabel || '—'} />
      <StatCard
        label="Target end"
        value={deadline ? formatIsoDate(String(deadline), 'PP') : 'Not set'}
      />
      <StatCard
        label="Milestones"
        value={milestoneCount}
        hint={milestoneCount === 0 ? 'None scheduled yet' : undefined}
      />
      <StatCard
        label="Deliverables"
        value={deliverableCount}
        hint={
          deliverablesAwaitingReview > 0
            ? `${deliverablesAwaitingReview} awaiting review`
            : undefined
        }
      />
      <StatCard label="Operator" value={operator} />
    </div>
  );
}
