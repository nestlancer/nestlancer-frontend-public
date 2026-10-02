'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';

import { Button, PctProgressFill, StatusBadge, cn } from '@nestlancer/ui';

import { AdminSection, JsonBlock } from '@/components/admin/AdminConsolePrimitives';
import { GePageHeader as PageHeader } from '@/components/admin/AdminGentelellaUI';
import { AdminMetricStrip } from '@/components/admin/AdminPageChrome';
import { statusToneToVariant } from '@/lib/admin-status';
import { pickAdminRows, rowId, rowTitle } from '@/lib/admin-response';
import { inferColumns } from '@/lib/admin-view-model';

export { PageHeader };

export function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'good' | 'warn' | 'bad' | 'neutral';
}) {
  return (
    <StatusBadge variant={statusToneToVariant(tone)} dot>
      {children}
    </StatusBadge>
  );
}

export function KpiGrid({
  items,
  max,
}: {
  items: { label: string; value: string; hint?: string }[];
  variant?: 'default' | 'bento';
  max?: number;
}) {
  if (!items.length) return <EmptyState message="No metrics available." />;
  return <AdminMetricStrip items={items} max={max ?? items.length} />;
}

export function TrendStrip({ items }: { items: { label: string; line: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => (
        <div key={t.label} className="ge-card px-3 py-2.5 text-xs shadow-sm">
          <span className="font-semibold text-foreground">{t.label}</span>
          <span className="mt-0.5 block text-muted-foreground">{t.line}</span>
        </div>
      ))}
    </div>
  );
}

export function HorizBarList({
  heading,
  rows,
  formatValue,
}: {
  heading: string;
  rows: { label: string; value: number; pct: number }[];
  formatValue: (n: number) => string;
}) {
  if (!rows.length) return null;
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {heading}
      </p>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-foreground">{r.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatValue(r.value)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/70">
              <PctProgressFill
                pct={Math.min(100, Math.max(6, r.pct))}
                fillClassName="fill-primary/70"
                className="h-full"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RevenuePanel({
  kpis,
  trendLine,
  categories,
  seriesNote,
}: {
  kpis: { label: string; value: string; hint?: string }[];
  trendLine?: string;
  categories: { name: string; amount: string }[];
  seriesNote?: string;
}) {
  return (
    <div className="space-y-5">
      <KpiGrid items={kpis} />
      {trendLine ? (
        <div className="ge-card px-4 py-3 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Trend
          </span>
          <p className="mt-1 text-foreground">{trendLine}</p>
        </div>
      ) : null}
      {categories.length > 0 ? (
        <div className="ge-data-shell overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/35 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-semibold">Category</th>
                <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.name} className="border-b border-border/35 last:border-0">
                  <td className="px-4 py-2.5 text-foreground">{c.name}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums text-foreground">
                    {c.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {seriesNote ? <p className="text-xs text-muted-foreground">{seriesNote}</p> : null}
    </div>
  );
}

export function ActivityFeed({
  items,
}: {
  items: { id: string; title: string; description?: string; when?: string; tag?: string }[];
}) {
  if (!items.length) return <EmptyState message="No recent activity." />;
  return (
    <ul className="ge-activity-list">
      {items.map((a) => (
        <li key={a.id} className="ge-activity-item">
          <div className="ge-activity-avatar ge-avatar-gradient-0" aria-hidden>
            {(a.title[0] ?? '?').toUpperCase()}
          </div>
          <div className="ge-activity-body">
            <div className="flex flex-wrap items-center gap-2">
              <p className="ge-activity-title">{a.title}</p>
              {a.tag ? <StatusPill tone="neutral">{a.tag}</StatusPill> : null}
            </div>
            {a.description ? <p className="ge-activity-desc">{a.description}</p> : null}
            {a.when ? <p className="ge-activity-time">{a.when}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AlertCards({
  items,
}: {
  items: {
    id: string;
    title: string;
    detail?: string;
    severity?: 'info' | 'warning' | 'critical';
  }[];
}) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No active alerts.</p>;
  const tone = (s?: string) => {
    if (s === 'critical')
      return 'border-destructive/40 bg-destructive/5 ring-destructive/20 text-destructive';
    if (s === 'warning') return 'border-amber-500/35 bg-amber-500/5 ring-amber-500/15';
    if (s === 'info') return 'border-sky-500/30 bg-sky-500/5 ring-sky-500/10';
    return 'border-amber-500/30 bg-amber-500/5 ring-amber-500/15';
  };
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((a) => (
        <li
          key={a.id}
          className={cn(
            'rounded-lg border px-4 py-3 shadow-sm',
            tone(a.severity),
            a.severity === 'critical' ? '' : 'text-foreground'
          )}
        >
          <p className="font-medium">{a.title}</p>
          {a.detail ? <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export function KeyValueTable({ rows }: { rows: { key: string; value: string }[] }) {
  if (!rows.length) return <EmptyState message="Nothing to display." />;
  return (
    <div className="ge-data-shell overflow-hidden">
      <table className="ge-table">
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-border/50 last:border-0">
              <th className="w-[40%] bg-muted/20 px-4 py-2.5 text-left font-medium text-muted-foreground">
                {r.key}
              </th>
              <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  getRowKey,
}: {
  columns: { key: string; header: string; className?: string }[];
  rows: Record<string, unknown>[];
  getRowKey: (row: Record<string, unknown>, index: number) => string;
}) {
  if (!rows.length) return <EmptyState message="No records." />;
  return (
    <div className="ge-data-shell overflow-x-auto">
      <table className="ge-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.className}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={getRowKey(row, i)}>
              {columns.map((c) => (
                <td key={c.key} className={c.className}>
                  {renderCell(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DynamicObjectTable({
  data,
  emptyMessage,
}: {
  data: unknown;
  emptyMessage: string;
}) {
  const rows = pickAdminRows(data);
  if (!rows.length) return <EmptyState message={emptyMessage} />;
  const keys = inferColumns(rows, 9);
  const columns = keys.map((k) => ({
    key: k,
    header: k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' '),
  }));
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(row, i) => String(row.id ?? row.key ?? row.slug ?? row.name ?? row.ticketId ?? i)}
    />
  );
}

function renderCell(v: unknown): ReactNode {
  if (v === null || v === undefined) return <span className="text-muted-foreground">—</span>;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return <span className="tabular-nums">{v}</span>;
  if (typeof v === 'string') {
    const short = v.length > 120 ? `${v.slice(0, 117)}…` : v;
    return <span title={v.length > 120 ? v : undefined}>{short}</span>;
  }
  try {
    const s = JSON.stringify(v);
    return (
      <span className="font-mono text-xs text-muted-foreground">
        {s.length > 100 ? `${s.slice(0, 97)}…` : s}
      </span>
    );
  } catch {
    return String(v);
  }
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="ge-card border-dashed px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function CollapsibleRaw({
  title = 'Raw API response',
  value,
  className,
}: {
  title?: string;
  value: unknown;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn('rounded-lg border border-border/50 bg-muted/10', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-muted-foreground transition hover:bg-muted/30"
      >
        <span>{title}</span>
        <span className="text-[10px] uppercase tracking-wide">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open ? (
        <div className="border-t border-border/50 p-2">
          <JsonBlock value={value} className="max-h-72 border-0 bg-transparent" />
        </div>
      ) : null}
    </div>
  );
}

/** Single collapsed JSON block for a page — use instead of many `CollapsibleRaw` instances. */
export function DebugApiSection({ payloads }: { payloads: Record<string, unknown> }) {
  if (process.env.NODE_ENV === 'production') return null;
  if (process.env.NEXT_PUBLIC_DEBUG_API !== 'true') {
    return null;
  }
  return (
    <AdminSection
      title="API payloads"
      description="Optional raw JSON for debugging — collapsed by default"
      className="border-dashed border-border/80 bg-muted/[0.12]"
    >
      <CollapsibleRaw value={payloads} title="Show raw API responses" />
    </AdminSection>
  );
}

export function SectionStack({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 lg:gap-8">{children}</div>;
}

export function UserDirectoryTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <EmptyState message="No users match this query." />;
  return (
    <div className="ge-data-shell overflow-x-auto">
      <table className="ge-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Id</th>
            <th className="text-right"> </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = rowId(row);
            const role = typeof row.role === 'string' ? row.role : '—';
            const status = typeof row.status === 'string' ? row.status : '—';
            return (
              <tr key={id || JSON.stringify(row)}>
                <td className="font-medium">{rowTitle(row)}</td>
                <td>
                  <StatusPill tone="neutral">{role}</StatusPill>
                </td>
                <td>
                  <StatusPill
                    tone={
                      status === 'ACTIVE' ? 'good' : status === 'SUSPENDED' ? 'warn' : 'neutral'
                    }
                  >
                    {status}
                  </StatusPill>
                </td>
                <td className="font-mono text-xs text-muted-foreground">{id || '—'}</td>
                <td className="text-right">
                  {id ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/users/${encodeURIComponent(id)}`}>View</Link>
                    </Button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
