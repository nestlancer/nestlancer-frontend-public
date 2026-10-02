'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { formatIsoDate } from '@nestlancer/utils';
import { useQuery } from '@tanstack/react-query';

import {
  Button,
  DataTable,
  type DataTableColumn,
  DomainStatusBadge,
  ErrorState,
  Pagination,
  SkeletonTable,
  toast,
} from '@nestlancer/ui';

import { GePageHeader as PageHeader } from '@/components/admin/AdminGentelellaUI';

import {
  AdminDataShell,
  AdminFilterBar,
  AdminMetricStrip,
  adminDataTableClass,
} from '@/components/admin/AdminPageChrome';
import { DebugApiSection } from '@/components/admin/AdminDataViews';
import { filterTableRows } from '@/components/admin/AdminTableViews';
import { adminKeys } from '@/lib/admin-query-keys';
import { ADMIN_REQUEST_QUEUE_OPTIONS } from '@/lib/admin-queue-filters';
import { pickAdminPagination, pickAdminRows, rowId } from '@/lib/admin-response';
import { extractMetricTiles } from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';
import { CapacityDashboard } from '@/features/requests/CapacityDashboard';

const PAGE_SIZE = 20;
type RequestRow = Record<string, unknown>;

function CopyableId({ id }: { id: string }) {
  const short = id.length > 12 ? `${id.slice(0, 8)}…` : id;
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
      <span title={id}>{short}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 px-1.5 text-[10px] uppercase tracking-wide"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(id);
            toast.success('ID copied');
          } catch {
            toast.error('Could not copy ID');
          }
        }}
      >
        Copy
      </Button>
    </span>
  );
}

export function RequestsClient({ initialStatus }: { initialStatus?: string }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus ?? 'inbox');
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: [...adminKeys.requests(), page, statusFilter],
    queryFn: () =>
      apiServices.admin.listAdminRequests({
        page,
        limit: PAGE_SIZE,
        status: statusFilter,
      }),
  });

  const statsQ = useQuery({
    queryKey: adminKeys.requestStats(),
    queryFn: () => apiServices.admin.getAdminRequestStats(),
  });

  const rows = useMemo(() => pickAdminRows(q.data), [q.data]);
  const pagination = useMemo(() => pickAdminPagination(q.data), [q.data]);
  const filtered = useMemo(() => filterTableRows(rows, search, 'all'), [rows, search]);
  const columns = useMemo<DataTableColumn<RequestRow>[]>(
    () => [
      {
        id: 'id',
        header: 'ID',
        cell: (row) => {
          const id = rowId(row);
          if (!id) return <span className="text-muted-foreground">—</span>;
          return <CopyableId id={id} />;
        },
      },
      {
        id: 'title',
        header: 'Title',
        cell: (row) => <span className="font-medium">{String(row.title ?? '—')}</span>,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => (
          <DomainStatusBadge domain="request" status={String(row.status ?? 'unknown')} />
        ),
      },
      {
        id: 'category',
        header: 'Category',
        cell: (row) => {
          const category = row.category ?? row.serviceCategory;
          const label =
            typeof category === 'string'
              ? category
                  .replace(/_/g, ' ')
                  .replace(/([A-Z])/g, ' $1')
                  .trim()
              : '—';
          return <span className="text-muted-foreground capitalize">{label}</span>;
        },
      },
      {
        id: 'client',
        header: 'Client',
        cell: (row) => {
          const user = row.user as Record<string, unknown> | undefined;
          return (
            <span className="text-muted-foreground">
              {typeof user?.email === 'string' ? user.email : String(row.userId ?? '—')}
            </span>
          );
        },
      },
      {
        id: 'created',
        header: 'Created',
        cell: (row) => {
          const created =
            typeof row.createdAt === 'string'
              ? formatIsoDate(row.createdAt, 'PP')
              : typeof row.created_at === 'string'
                ? formatIsoDate(row.created_at, 'PP')
                : '—';
          return <span className="text-muted-foreground">{created}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        className: 'text-right',
        cell: (row) => {
          const id = rowId(row);
          if (!id) return null;
          return (
            <Link
              href={`/requests/${encodeURIComponent(id)}`}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Review →
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
        title="Requests"
        description="Review submitted client requests, update status, assign operators, and create quotes. Client drafts are hidden from the default inbox."
      />

      <CapacityDashboard />

      <div className="space-y-6">
        <AdminMetricStrip items={extractMetricTiles(statsQ.data, 'Requests')} max={4} />

        <AdminDataShell
          filter={
            <AdminFilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search requests…"
              filters={[
                {
                  id: 'status',
                  label: 'Status',
                  value: statusFilter,
                  options: ADMIN_REQUEST_QUEUE_OPTIONS,
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
          {q.isLoading ? <SkeletonTable rows={6} cols={6} /> : null}
          {!q.isLoading && q.error ? (
            <ErrorState
              message="Could not load requests."
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
                rowId(row) || `${String(row.title ?? 'request')}-${String(row.userId ?? '')}`
              }
              emptyTitle="No requests match your filters"
              emptyDescription="Try a different status or search query."
            />
          ) : null}
        </AdminDataShell>

        <DebugApiSection payloads={{ requests: q.data, stats: statsQ.data }} />
      </div>
    </div>
  );
}
