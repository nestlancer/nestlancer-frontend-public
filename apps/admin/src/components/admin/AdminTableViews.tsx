'use client';

import {
  Badge,
  Card,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  TextInput,
} from '@nestlancer/ui';
import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';

import { FieldHelp } from '@nestlancer/field-help';
import { Button } from '@nestlancer/ui';

import { rowId, rowTitle } from '@/lib/admin-response';
import { cellPreview, inferColumns } from '@/lib/admin-view-model';

import { adminCardClass } from '@/components/admin/AdminPageChrome';

const STATUS_KEYS = new Set([
  'status',
  'state',
  'severity',
  'role',
  'type',
  'paymentstatus',
  'milestoneStatus',
]);

export function statusBadgeColor(
  value: string
): 'emerald' | 'amber' | 'red' | 'blue' | 'slate' | 'rose' | 'cyan' {
  const s = value.toUpperCase();
  if (
    ['ACTIVE', 'COMPLETED', 'PAID', 'VERIFIED', 'APPROVED', 'HEALTHY', 'SUCCESS', 'RESOLVED'].some(
      (x) => s.includes(x)
    )
  ) {
    return 'emerald';
  }
  if (
    [
      'SUSPENDED',
      'PENDING',
      'OPEN',
      'FLAGGED',
      'WARNING',
      'IN_PROGRESS',
      'PROCESSING',
      'REQUESTED',
    ].some((x) => s.includes(x))
  ) {
    return 'amber';
  }
  if (
    ['FAILED', 'REJECTED', 'CRITICAL', 'BANNED', 'DISPUTED', 'CANCELLED', 'CANCELED', 'ERROR'].some(
      (x) => s.includes(x)
    )
  ) {
    return s.includes('CANCEL') ? 'slate' : 'red';
  }
  if (['DRAFT', 'INACTIVE', 'ARCHIVED'].some((x) => s.includes(x))) {
    return 'slate';
  }
  if (['CLIENT', 'USER', 'ADMIN', 'OPERATOR'].some((x) => s.includes(x))) {
    return 'cyan';
  }
  return 'blue';
}

export function StatusBadge({ value }: { value: string }) {
  if (!value || value === '—') return <Text>—</Text>;
  return (
    <Badge color={statusBadgeColor(value)} size="sm">
      {value}
    </Badge>
  );
}

export function filterTableRows(
  rows: Record<string, unknown>[],
  search: string,
  statusFilter: string
): Record<string, unknown>[] {
  let out = rows;
  if (statusFilter && statusFilter !== 'all') {
    const want = statusFilter.toLowerCase();
    out = out.filter((row) => {
      for (const key of ['status', 'state', 'severity', 'type', 'role']) {
        const v = row[key];
        if (typeof v === 'string' && v.toLowerCase() === want) return true;
      }
      return false;
    });
  }
  const q = search.trim().toLowerCase();
  if (!q) return out;
  return out.filter((row) =>
    Object.entries(row).some(([k, v]) => {
      if (k.toLowerCase().includes('password') || k.toLowerCase().includes('secret')) return false;
      if (typeof v === 'string') return v.toLowerCase().includes(q);
      if (typeof v === 'number') return String(v).includes(q);
      if (typeof v === 'boolean') return String(v).includes(q);
      return false;
    })
  );
}

export function collectStatusFilterOptions(rows: Record<string, unknown>[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    for (const key of ['status', 'state', 'severity']) {
      const v = row[key];
      if (typeof v === 'string' && v.trim()) set.add(v);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function TableToolbar({
  search,
  onSearchChange,
  onSubmit,
  onClear,
  placeholder = 'Search records…',
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  resultCount,
  actions,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder?: string;
  statusFilter?: string;
  onStatusFilterChange?: (v: string) => void;
  statusOptions?: string[];
  resultCount?: number;
  actions?: ReactNode;
}) {
  return (
    <Card className={`${adminCardClass} mb-4`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-[1fr_auto] lg:grid-cols-[minmax(280px,1fr)_180px_auto]">
          <div>
            <Text className="mb-1.5 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Search
              <FieldHelp fieldKey="filter.search" label="Search" />
            </Text>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit?.();
              }}
            >
              <TextInput
                value={search}
                onValueChange={onSearchChange}
                placeholder={placeholder}
                className="max-w-none"
              />
              {onSubmit ? (
                <Button type="submit" size="sm" className="shrink-0">
                  Search
                </Button>
              ) : null}
            </form>
          </div>
          {statusOptions && statusOptions.length > 0 && onStatusFilterChange ? (
            <div>
              <Text className="mb-1.5 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
                <FieldHelp fieldKey="filter.status" label="Status filter" />
              </Text>
              <Select value={statusFilter ?? 'all'} onValueChange={onStatusFilterChange}>
                <SelectItem value="all">All statuses</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </Select>
            </div>
          ) : null}
          {onClear ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClear}
              className="self-end"
            >
              Clear
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {resultCount !== undefined ? (
            <Text className="text-sm tabular-nums text-muted-foreground">
              {resultCount} record{resultCount === 1 ? '' : 's'}
            </Text>
          ) : null}
          {actions}
        </div>
      </div>
    </Card>
  );
}

function renderTableCell(key: string, value: unknown): ReactNode {
  if (value === null || value === undefined)
    return <Text className="text-muted-foreground">—</Text>;
  if (STATUS_KEYS.has(key.toLowerCase()) && typeof value === 'string') {
    return <StatusBadge value={value} />;
  }
  if (typeof value === 'boolean') {
    return <StatusBadge value={value ? 'Yes' : 'No'} />;
  }
  return <Text className="text-foreground">{cellPreview(value)}</Text>;
}

export function ObjectTable({
  rows,
  maxColumns = 8,
  emptyMessage = 'No records.',
  userLinkColumn,
}: {
  rows: Record<string, unknown>[];
  maxColumns?: number;
  emptyMessage?: string;
  userLinkColumn?: boolean;
}) {
  const columns = useMemo(() => {
    if (!rows.length) return [];
    const keys = inferColumns(rows, maxColumns);
    if (userLinkColumn && !keys.includes('email') && rows.some((r) => r.email)) {
      return ['email', ...keys.filter((k) => k !== 'email')].slice(0, maxColumns);
    }
    return keys;
  }, [rows, maxColumns, userLinkColumn]);

  if (!rows.length) {
    return (
      <Card className={adminCardClass}>
        <Text className="text-muted-foreground">{emptyMessage}</Text>
      </Card>
    );
  }

  return (
    <Card className={`${adminCardClass} overflow-hidden p-0`}>
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((key) => (
                <TableHeaderCell key={key} className="text-xs uppercase tracking-wide">
                  {key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')}
                </TableHeaderCell>
              ))}
              {userLinkColumn ? <TableHeaderCell className="text-right"> </TableHeaderCell> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={rowId(row) || String(row.id ?? i)}>
                {columns.map((key) => (
                  <TableCell key={key}>
                    {userLinkColumn && key === 'email' ? (
                      <div className="space-y-0.5">
                        <Text className="font-medium text-foreground">{rowTitle(row)}</Text>
                        {typeof row.email === 'string' ? (
                          <Text className="text-xs text-muted-foreground">{row.email}</Text>
                        ) : null}
                      </div>
                    ) : (
                      renderTableCell(key, row[key])
                    )}
                  </TableCell>
                ))}
                {userLinkColumn ? (
                  <TableCell className="text-right">
                    {rowId(row) ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/users/${encodeURIComponent(rowId(row))}`}>View</Link>
                      </Button>
                    ) : null}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
