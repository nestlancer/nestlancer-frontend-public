'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { formatIsoDate } from '@nestlancer/utils';
import {
  Button,
  DataTable,
  type DataTableColumn,
  DomainStatusBadge,
  ErrorState,
  Input,
  Pagination,
  SkeletonTable,
} from '@nestlancer/ui';

import { AdminUserAvatar, GePageHeader as PageHeader } from '@/components/admin/AdminGentelellaUI';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { DebugApiSection } from '@/components/admin/AdminDataViews';
import {
  AdminDataShell,
  AdminFilterBar,
  AdminMetricStrip,
  adminDataTableClass,
} from '@/components/admin/AdminPageChrome';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminPagination, pickAdminRows, rowId } from '@/lib/admin-response';
import { extractUsersDirectoryKpis } from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';

const PAGE_SIZE = 20;

type UserRow = Record<string, unknown>;

function userDisplayName(row: UserRow): string {
  const name = [row.firstName, row.lastName].filter((x) => typeof x === 'string' && x).join(' ');
  return name || String(row.email ?? '—');
}

function avatarStatus(row: UserRow): 'active' | 'suspended' | 'neutral' {
  const status = String(row.status ?? '').toUpperCase();
  if (status === 'ACTIVE') return 'active';
  if (status === 'SUSPENDED') return 'suspended';
  return 'neutral';
}

export function UsersListClient() {
  const router = useRouter();
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkReason, setBulkReason] = useState('');

  // NL-BUG-USER-1: typing alone never submitted — debounce into the search query.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = q.trim();
      setSubmitted((prev) => (prev === next ? prev : next));
      if (q.trim()) setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [q]);

  const activeSearch = submitted.trim().length > 0;

  const listQuery = useQuery({
    queryKey: [...adminKeys.users(), 'list', page, statusFilter, roleFilter],
    queryFn: () =>
      apiServices.admin.listUsers({
        page,
        limit: PAGE_SIZE,
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(roleFilter !== 'all' ? { role: roleFilter } : {}),
      }),
    enabled: !activeSearch,
  });

  const searchQuery = useQuery({
    queryKey: [...adminKeys.users(), 'search', submitted, page],
    queryFn: () =>
      apiServices.admin.searchUsers({
        q: submitted,
        page,
        limit: PAGE_SIZE,
      }),
    enabled: activeSearch,
  });

  const statsQuery = useQuery({
    queryKey: [...adminKeys.users(), 'directory-stats'],
    queryFn: async () => {
      const [securityStats, userMetrics] = await Promise.all([
        apiServices.admin.getUsersSecurityStats(),
        apiServices.admin.getUserMetrics(),
      ]);
      return { securityStats, userMetrics };
    },
  });

  const pendingQuery = useQuery({
    queryKey: [...adminKeys.users(), 'count', 'PENDING_DELETION'],
    queryFn: () => apiServices.admin.listUsers({ status: 'PENDING_DELETION', page: 1, limit: 1 }),
  });

  const { data, isLoading, error, refetch } = activeSearch ? searchQuery : listQuery;
  const rows = useMemo(() => pickAdminRows(data), [data]);
  const pagination = useMemo(() => pickAdminPagination(data), [data]);
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      const status = row.status;
      if (typeof status === 'string' && status.trim()) set.add(status);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const kpiItems = useMemo(() => {
    const base = extractUsersDirectoryKpis(
      statsQuery.data?.securityStats,
      statsQuery.data?.userMetrics
    );
    const pendingTotal = pickAdminPagination(pendingQuery.data)?.total;
    if (pendingTotal != null && pendingTotal > 0) {
      const withoutPending = base.filter((k) => k.label !== 'New this month');
      const hasPending = withoutPending.some((k) => k.label === 'Pending');
      if (!hasPending) {
        withoutPending.splice(2, 0, {
          label: 'Pending',
          value: String(pendingTotal),
          hint: 'Awaiting deletion',
        });
      }
      return withoutPending.slice(0, 4);
    }
    return base.slice(0, 4);
  }, [statsQuery.data, pendingQuery.data]);

  const toggleRow = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const columns = useMemo<DataTableColumn<UserRow>[]>(
    () => [
      {
        id: 'select',
        header: (
          <input
            type="checkbox"
            aria-label="Select all users"
            checked={rows.length > 0 && rows.every((r) => selected.has(rowId(r)))}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              if (e.target.checked) {
                setSelected(new Set(rows.map((r) => rowId(r)).filter(Boolean)));
              } else {
                setSelected(new Set());
              }
            }}
          />
        ),
        cell: (row) => {
          const id = rowId(row);
          if (!id) return null;
          return (
            <input
              type="checkbox"
              checked={selected.has(id)}
              onClick={(e) => e.stopPropagation()}
              onChange={() => toggleRow(id)}
              aria-label={`Select ${String(row.email ?? id)}`}
            />
          );
        },
        className: 'w-10',
      },
      {
        id: 'user',
        header: 'User',
        cell: (row) => {
          const name = userDisplayName(row);
          const email = String(row.email ?? '—');
          return (
            <div className="flex items-center gap-3">
              <AdminUserAvatar
                name={name !== email ? name : undefined}
                email={email}
                size="sm"
                status={avatarStatus(row)}
              />
              <div className="min-w-0">
                <div className="truncate font-medium">{email}</div>
                {name !== email ? (
                  <div className="truncate text-xs text-muted-foreground">{name}</div>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        id: 'role',
        header: 'Role',
        cell: (row) => <DomainStatusBadge domain="user" status={String(row.role ?? 'unknown')} />,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => <DomainStatusBadge domain="user" status={String(row.status ?? 'unknown')} />,
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
              href={`/users/${encodeURIComponent(id)}`}
              className="text-sm font-semibold text-primary hover:underline"
            >
              View →
            </Link>
          );
        },
      },
    ],
    [rows, selected, toggleRow]
  );

  const bulkMutation = useMutation({
    mutationFn: (action: 'suspend' | 'activate') =>
      apiServices.admin.bulkUserOperations({
        action,
        userIds: Array.from(selected),
        reason: bulkReason.trim() || 'Bulk action from admin console',
      }),
    onSuccess: (result) => {
      toast.success(`Bulk action done (${result.success} ok, ${result.failed} failed)`);
      setSelected(new Set());
      setBulkReason('');
      void qc.invalidateQueries({ queryKey: adminKeys.users() });
      void refetch();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const debugPayloads = {
    users: data,
    stats: statsQuery.data,
    pendingCount: pendingQuery.data,
  } as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="User management"
        title="Users directory"
        description="Manage system access, roles, and security status for all internal and client accounts."
        actions={
          <div className="flex max-w-xs flex-col items-end gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled
              aria-disabled="true"
              title="User creation is via client registration"
            >
              Add new user
            </Button>
            <p className="text-right text-[11px] leading-snug text-muted-foreground">
              New accounts come from client registration — operators cannot create users here.
            </p>
          </div>
        }
      />

      <AdminMetricStrip items={kpiItems} max={4} dense />

      <AdminDataShell
        filter={
          <AdminFilterBar
            search={q}
            onSearchChange={setQ}
            onSearchSubmit={() => {
              setSubmitted(q.trim());
              setPage(1);
            }}
            searchPlaceholder="Search email, name…"
            filters={[
              {
                id: 'status',
                label: 'Status',
                value: statusFilter,
                options: [
                  { value: 'all', label: 'All statuses' },
                  ...statusOptions.map((opt) => ({ value: opt, label: opt })),
                ],
                onChange: (v) => {
                  setStatusFilter(v);
                  setPage(1);
                },
              },
              {
                id: 'role',
                label: 'Role',
                value: roleFilter,
                options: [
                  { value: 'all', label: 'All roles' },
                  { value: 'USER', label: 'USER' },
                  { value: 'ADMIN', label: 'ADMIN' },
                ],
                onChange: (v) => {
                  setRoleFilter(v);
                  setPage(1);
                },
              },
            ]}
            actions={
              <>
                {selected.size > 0 ? (
                  <>
                    <Input
                      type="text"
                      className="h-9 min-w-[160px] max-w-xs"
                      placeholder="Bulk action reason"
                      value={bulkReason}
                      onChange={(e) => setBulkReason(e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={bulkMutation.isPending}
                      onClick={() => bulkMutation.mutate('activate')}
                    >
                      Activate ({selected.size})
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={bulkMutation.isPending}
                      onClick={async () => {
                        const { confirmed } = await confirm({
                          title: 'Suspend users',
                          description: `Suspend ${selected.size} user(s)? All sessions will end.`,
                          destructive: true,
                          confirmLabel: 'Suspend',
                        });
                        if (!confirmed) return;
                        bulkMutation.mutate('suspend');
                      }}
                    >
                      Bulk suspend
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelected(new Set())}
                    >
                      Clear
                    </Button>
                  </>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setSubmitted(q.trim());
                    setPage(1);
                  }}
                >
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQ('');
                    setSubmitted('');
                    setPage(1);
                    setStatusFilter('all');
                    setRoleFilter('all');
                    setSelected(new Set());
                    void refetch();
                  }}
                >
                  Clear
                </Button>
              </>
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
        {isLoading ? <SkeletonTable rows={6} cols={6} /> : null}
        {!isLoading && error ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
        ) : null}
        {!isLoading && !error ? (
          <DataTable
            className={adminDataTableClass}
            columns={columns}
            rows={rows}
            getRowId={(row) =>
              rowId(row) ||
              `${String(row.email ?? 'unknown')}-${String(row.firstName ?? '')}-${String(
                row.lastName ?? ''
              )}`
            }
            onRowClick={(row) => {
              const id = rowId(row);
              if (id) router.push(`/users/${encodeURIComponent(id)}`);
            }}
            emptyTitle="No users match your filters"
            emptyDescription="Try adjusting filters or clearing search terms."
          />
        ) : null}
      </AdminDataShell>

      <DebugApiSection payloads={debugPayloads} />
    </div>
  );
}
