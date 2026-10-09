'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { DEFAULT_CURRENCY } from '@nestlancer/constants';
import { formatMoneyFromPaise } from '@nestlancer/utils';
import {
  Button,
  DataTable,
  type DataTableColumn,
  DomainStatusBadge,
  ErrorState,
  Pagination,
  SkeletonTable,
} from '@nestlancer/ui';

import { GePageHeader as PageHeader } from '@/components/admin/AdminGentelellaUI';

import { DebugApiSection } from '@/components/admin/AdminDataViews';
import {
  AdminDataShell,
  AdminFilterBar,
  AdminMetricStrip,
  adminDataTableClass,
} from '@/components/admin/AdminPageChrome';
import { filterTableRows } from '@/components/admin/AdminTableViews';
import { isQuoteEditable } from '@/features/quotes/admin-quote-utils';
import { adminKeys } from '@/lib/admin-query-keys';
import { ADMIN_QUOTE_QUEUE_OPTIONS } from '@/lib/admin-queue-filters';
import { pickAdminPagination, pickAdminRows, rowId } from '@/lib/admin-response';
import { extractMetricTiles } from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';

const PAGE_SIZE = 20;
type QuoteRow = Record<string, unknown>;

export function QuotesClient({
  initialStatus = 'inbox',
  title = 'Quotes',
}: {
  initialStatus?: string;
  title?: string;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: [...adminKeys.quotes(), page, statusFilter],
    queryFn: () =>
      apiServices.admin.listAdminQuotes({
        page,
        limit: PAGE_SIZE,
        status: statusFilter,
      }),
  });

  const statsQ = useQuery({
    queryKey: adminKeys.quoteStats(),
    queryFn: () => apiServices.admin.getAdminQuoteStats(),
  });

  const rows = useMemo(() => pickAdminRows(q.data), [q.data]);
  const pagination = useMemo(() => pickAdminPagination(q.data), [q.data]);
  const filtered = useMemo(() => filterTableRows(rows, search, 'all'), [rows, search]);
  const columns = useMemo<DataTableColumn<QuoteRow>[]>(
    () => [
      {
        id: 'title',
        header: 'Title',
        cell: (row) => (
          <span className="font-medium">{String(row.title ?? rowId(row)?.slice(0, 8) ?? '—')}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => (
          <DomainStatusBadge domain="quote" status={String(row.status ?? 'unknown')} />
        ),
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (row) => {
          const currency = typeof row.currency === 'string' ? row.currency : DEFAULT_CURRENCY;
          const amount =
            typeof row.totalAmount === 'number'
              ? formatMoneyFromPaise(Number(row.totalAmount), currency)
              : '—';
          return <span className="font-medium tabular-nums">{amount}</span>;
        },
      },
      {
        id: 'client',
        header: 'Client',
        cell: (row) => {
          const client = row.client as Record<string, unknown> | undefined;
          return (
            <span className="text-muted-foreground">
              {typeof client?.email === 'string'
                ? client.email
                : [client?.firstName, client?.lastName].filter(Boolean).join(' ') || '—'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        className: 'text-right',
        cell: (row) => {
          const id = rowId(row);
          const status = String(row.status ?? '—');
          const editable = isQuoteEditable(status);
          if (!id) return null;
          return (
            <Link
              href={`/quotes/${encodeURIComponent(id)}`}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {editable ? 'Edit' : 'View'}
            </Link>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="Operations"
        title={title}
        description="Active quotes in the pipeline — edit drafts before sending, follow up on sent quotes. Use quote detail for the line-item library."
      />

      <div className="space-y-6">
        <div className="space-y-2">
          <AdminMetricStrip items={extractMetricTiles(statsQ.data, 'Quotes')} max={4} dense />
          <p className="text-xs text-muted-foreground">
            KPI totals include every quote status. The table below is filtered to{' '}
            <span className="font-medium text-foreground">
              {ADMIN_QUOTE_QUEUE_OPTIONS.find((o) => o.value === statusFilter)?.label ??
                statusFilter}
            </span>
            {pagination?.total != null ? ` · ${pagination.total} matching` : null}.
          </p>
        </div>

        <AdminDataShell
          filter={
            <AdminFilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search quotes…"
              filters={[
                {
                  id: 'status',
                  label: 'Status',
                  value: statusFilter,
                  options: ADMIN_QUOTE_QUEUE_OPTIONS,
                  onChange: (value) => {
                    setStatusFilter(value);
                    setPage(1);
                  },
                },
              ]}
              actions={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('inbox');
                    setPage(1);
                  }}
                >
                  Clear
                </Button>
              }
            />
          }
          footer={
            pagination ? (
              <Pagination
                page={pagination.page}
                pageSize={pagination.limit}
                total={pagination.total}
                onPageChange={(nextPage) => setPage(nextPage)}
              />
            ) : undefined
          }
        >
          {q.isLoading ? <SkeletonTable rows={6} cols={5} /> : null}
          {!q.isLoading && q.error ? (
            <ErrorState
              message="Could not load quotes."
              onRetry={() => {
                void q.refetch();
              }}
            />
          ) : null}
          {!q.isLoading && !q.error ? (
            <DataTable
              className={adminDataTableClass}
              columns={columns}
              rows={filtered}
              getRowId={(row) =>
                rowId(row) || `${String(row.createdAt ?? '')}-${String(row.totalAmount ?? '')}`
              }
              emptyTitle={
                statusFilter === 'inbox'
                  ? 'No active quotes in the inbox'
                  : 'No quotes match your filters'
              }
              emptyDescription={
                statusFilter === 'inbox'
                  ? 'Inbox shows drafts and outstanding sent quotes only. Accepted and closed quotes appear under All statuses.'
                  : 'Try adjusting status or search.'
              }
              emptyAction={
                statusFilter === 'inbox' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setPage(1);
                    }}
                  >
                    View all statuses
                  </Button>
                ) : undefined
              }
            />
          ) : null}
        </AdminDataShell>

        <DebugApiSection payloads={{ quotes: q.data, stats: statsQ.data }} />
      </div>
    </div>
  );
}
