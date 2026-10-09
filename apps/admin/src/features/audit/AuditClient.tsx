'use client';

import { Text } from '@nestlancer/ui';
import { useMemo, useState } from 'react';

import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage, peelSuccessEnvelope } from '@nestlancer/api-client';
import {
  Button,
  DataTable,
  type DataTableColumn,
  ErrorState,
  SkeletonTable,
  cn,
} from '@nestlancer/ui';

import { GePageHeader as PageHeader } from '@/components/admin/AdminGentelellaUI';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { DebugApiSection } from '@/components/admin/AdminDataViews';
import {
  AdminDataShell,
  AdminFilterBar,
  AdminMetricStrip,
  adminDataTableClass,
} from '@/components/admin/AdminPageChrome';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRows } from '@/lib/admin-response';
import { extractMetricTiles, formatDate } from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';

function filterRows(
  rows: Record<string, unknown>[],
  search: string,
  actionFilter: string
): Record<string, unknown>[] {
  const q = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (actionFilter !== 'all') {
      const action = String(row.action ?? row.event ?? '').toLowerCase();
      if (action !== actionFilter.toLowerCase()) return false;
    }
    if (!q) return true;
    const haystack = [
      row.userId,
      row.actor,
      row.actorEmail,
      row.action,
      row.event,
      row.category,
      row.description,
      row.resourceType,
      row.resourceId,
      row.ip,
      row.userAgent,
      row.createdAt,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

function collectActionFilterOptions(rows: Record<string, unknown>[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    const action = row.action ?? row.event;
    if (typeof action === 'string' && action.trim()) set.add(action);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function AuditTableSection({
  title,
  description,
  data,
  isLoading,
  error,
  onRetry,
  search,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
  onClear,
  scrollBody = false,
}: {
  title: string;
  description?: string;
  data: unknown;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  actionFilter: string;
  onActionFilterChange: (v: string) => void;
  onClear: () => void;
  scrollBody?: boolean;
}) {
  const rows = useMemo(() => pickAdminRows(data), [data]);
  const actionOptions = useMemo(() => collectActionFilterOptions(rows), [rows]);
  const filtered = useMemo(
    () => filterRows(rows, search, actionFilter),
    [rows, search, actionFilter]
  );

  const cols = useMemo<DataTableColumn<Record<string, unknown>>[]>(
    () => [
      {
        id: 'actor',
        header: 'Actor',
        cell: (row) =>
          String(
            row.actorEmail ??
              row.actor ??
              (row.user && typeof row.user === 'object'
                ? (row.user as { email?: string }).email
                : null) ??
              row.userId ??
              '—'
          ),
      },
      { id: 'action', header: 'Action', cell: (row) => String(row.action ?? row.event ?? '—') },
      { id: 'category', header: 'Category', cell: (row) => String(row.category ?? '—') },
      {
        id: 'resource',
        header: 'Resource',
        cell: (row) => {
          const direct = row.resource ?? row.target;
          if (direct != null && String(direct) !== '') return String(direct);
          const type = row.resourceType;
          const id = row.resourceId;
          if (type || id) {
            return [type, id].filter(Boolean).join(': ');
          }
          return String(row.description ?? '—');
        },
      },
      { id: 'ip', header: 'IP', cell: (row) => String(row.ip ?? '—') },
      {
        id: 'userAgent',
        header: 'User-Agent',
        cell: (row) => {
          const ua = String(row.userAgent ?? '').trim();
          if (!ua) return '—';
          return (
            <span className="block max-w-[14rem] truncate" title={ua}>
              {ua}
            </span>
          );
        },
      },
      {
        id: 'at',
        header: 'Timestamp',
        cell: (row) => formatDate(row.createdAt ?? row.timestamp),
      },
    ],
    []
  );

  return (
    <section className="space-y-3">
      <div>
        <Text className="font-medium text-foreground">{title}</Text>
        {description ? <Text className="text-sm text-muted-foreground">{description}</Text> : null}
        {scrollBody && filtered.length > 0 ? (
          <Text className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} — scroll inside the
            table to view more
          </Text>
        ) : null}
      </div>
      <AdminDataShell
        className={cn(scrollBody && filtered.length > 0 && 'audit-log-panel-scroll')}
        filter={
          <AdminFilterBar
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder={`Search ${title.toLowerCase()}…`}
            filters={[
              {
                id: 'action',
                label: 'Action',
                value: actionFilter,
                options: [
                  { value: 'all', label: 'All actions' },
                  ...actionOptions.map((opt) => ({ value: opt, label: opt })),
                ],
                onChange: onActionFilterChange,
              },
            ]}
            actions={
              <Button type="button" variant="outline" size="sm" onClick={onClear}>
                Clear
              </Button>
            }
          />
        }
      >
        {isLoading ? (
          <SkeletonTable rows={5} cols={7} />
        ) : error ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={onRetry} />
        ) : (
          <DataTable
            className={adminDataTableClass}
            columns={cols}
            rows={filtered}
            getRowId={(row) =>
              String(row.id ?? row.sessionId ?? row.createdAt ?? JSON.stringify(row))
            }
            emptyTitle={`No ${title.toLowerCase()} yet`}
            emptyDescription={
              rows.length === 0
                ? 'Events will appear here as users sign in or admins take action.'
                : 'Try changing search text or the action filter.'
            }
          />
        )}
      </AdminDataShell>
    </section>
  );
}

function ImpersonationSessionsSection({
  data,
  isLoading,
  error,
  onRetry,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onClear,
}: {
  data: unknown;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  onClear: () => void;
}) {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const rows = useMemo(() => pickAdminRows(data), [data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const status = String(row.status ?? (row.endedAt ? 'ended' : 'active')).toLowerCase();
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [row.adminId, row.targetUserId, row.userId, row.reason, row.ticketId, status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search, statusFilter]);

  const endSession = useMutation({
    mutationFn: (sessionId: string) => apiServices.admin.endImpersonationAlias({ sessionId }),
    onSuccess: () => {
      toast.success('Impersonation ended');
      void qc.invalidateQueries({ queryKey: adminKeys.impersonationSessions() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <section className="space-y-3">
      <div>
        <Text className="font-medium text-foreground">Impersonation sessions</Text>
        <Text className="text-sm text-muted-foreground">
          Recent admin impersonation sessions (active and ended).
        </Text>
      </div>
      <AdminDataShell
        filter={
          <AdminFilterBar
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by admin, target user, reason, or ticket…"
            filters={[
              {
                id: 'status',
                label: 'Status',
                value: statusFilter,
                options: [
                  { value: 'all', label: 'All statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'ended', label: 'Ended' },
                ],
                onChange: onStatusFilterChange,
              },
            ]}
            actions={
              <Button type="button" variant="outline" size="sm" onClick={onClear}>
                Clear
              </Button>
            }
          />
        }
      >
        {isLoading ? (
          <SkeletonTable rows={4} cols={4} />
        ) : error ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={onRetry} />
        ) : filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {rows.length === 0
              ? 'No impersonation sessions recorded yet.'
              : 'No impersonation sessions match your filters.'}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((row, i) => {
              const sessionId = String(row.id ?? row.sessionId ?? i);
              const status = String(row.status ?? (row.endedAt ? 'ended' : 'active'));
              const isActive = status === 'active';
              return (
                <li
                  key={sessionId}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 space-y-1">
                    <Text className="text-sm font-medium text-foreground">
                      Admin {String(row.adminId ?? '—')} → User{' '}
                      {String(row.targetUserId ?? row.userId ?? '—')}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {formatDate(row.startedAt ?? row.createdAt)}
                      {row.endedAt ? ` · Ended ${formatDate(row.endedAt)}` : ''}
                      {row.reason ? ` · ${String(row.reason)}` : ''}
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        isActive
                          ? 'rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600'
                          : 'rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
                      }
                    >
                      {status}
                    </span>
                    {isActive ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={endSession.isPending}
                        onClick={async () => {
                          const { confirmed } = await confirm({
                            title: 'End impersonation session',
                            description: 'The admin will no longer act as this user.',
                          });
                          if (!confirmed) return;
                          endSession.mutate(sessionId);
                        }}
                      >
                        End session
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminDataShell>
    </section>
  );
}

export function AuditClient() {
  const [auditSearch, setAuditSearch] = useState('');
  const [auditAction, setAuditAction] = useState('all');
  const [systemAuditSearch, setSystemAuditSearch] = useState('');
  const [systemAuditAction, setSystemAuditAction] = useState('all');
  const [userLogsSearch, setUserLogsSearch] = useState('');
  const [userLogsAction, setUserLogsAction] = useState('all');
  const [impersonationSearch, setImpersonationSearch] = useState('');
  const [impersonationStatus, setImpersonationStatus] = useState('all');

  const [auditLogsQ, systemAuditQ, securityStatsQ, userLogsQ, impersonationQ] = useQueries({
    queries: [
      { queryKey: adminKeys.auditLogs(), queryFn: () => apiServices.admin.getAuditLogs() },
      {
        queryKey: adminKeys.systemAuditLogs(),
        queryFn: () => apiServices.admin.getSystemAuditLogs({ limit: 50 }),
      },
      { queryKey: adminKeys.securityStats(), queryFn: () => apiServices.admin.getSecurityStats() },
      { queryKey: adminKeys.usersLogs(), queryFn: () => apiServices.admin.getUsersLogs() },
      {
        queryKey: adminKeys.impersonationSessions(),
        queryFn: () => apiServices.admin.getImpersonationSessions(),
      },
    ],
  });

  const securityKpis = useMemo(
    () => extractMetricTiles(peelSuccessEnvelope(securityStatsQ.data), 'Security'),
    [securityStatsQ.data]
  );

  const debugPayloads = {
    auditLogs: auditLogsQ.data,
    systemAuditLogs: systemAuditQ.data,
    securityStats: securityStatsQ.data,
    userAdminLogs: userLogsQ.data,
    impersonationSessions: impersonationQ.data,
  } as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="System"
        title="Audit Logs"
        description="Authentication logs, system audit (including impersonation), security aggregates, and sessions."
      />

      <div className="space-y-8">
        <section className="space-y-4">
          <div>
            <Text className="font-medium text-foreground">Security overview</Text>
            <Text className="text-sm text-muted-foreground">
              Platform user and session security metrics.
            </Text>
          </div>
          {securityStatsQ.isPending && securityStatsQ.data === undefined ? (
            <SkeletonTable rows={1} cols={6} />
          ) : securityStatsQ.error ? (
            <ErrorState
              message={getApiErrorMessage(securityStatsQ.error)}
              onRetry={() => void securityStatsQ.refetch()}
            />
          ) : (
            <AdminMetricStrip items={securityKpis} max={6} />
          )}
        </section>

        <AuditTableSection
          title="System audit logs"
          description="GET /admin/audit — impersonation, admin mutations, and cross-service events"
          scrollBody
          data={systemAuditQ.data}
          isLoading={systemAuditQ.isPending && systemAuditQ.data === undefined}
          error={systemAuditQ.error}
          onRetry={() => void systemAuditQ.refetch()}
          search={systemAuditSearch}
          onSearchChange={setSystemAuditSearch}
          actionFilter={systemAuditAction}
          onActionFilterChange={setSystemAuditAction}
          onClear={() => {
            setSystemAuditSearch('');
            setSystemAuditAction('all');
          }}
        />

        <AuditTableSection
          title="Auth audit logs"
          description="GET /admin/logs — login, logout, and auth-category events"
          scrollBody
          data={auditLogsQ.data}
          isLoading={auditLogsQ.isPending && auditLogsQ.data === undefined}
          error={auditLogsQ.error}
          onRetry={() => void auditLogsQ.refetch()}
          search={auditSearch}
          onSearchChange={setAuditSearch}
          actionFilter={auditAction}
          onActionFilterChange={setAuditAction}
          onClear={() => {
            setAuditSearch('');
            setAuditAction('all');
          }}
        />

        <AuditTableSection
          title="User admin logs"
          description="Administrative actions on user accounts (role changes, suspensions, password resets)."
          data={userLogsQ.data}
          isLoading={userLogsQ.isPending && userLogsQ.data === undefined}
          error={userLogsQ.error}
          onRetry={() => void userLogsQ.refetch()}
          search={userLogsSearch}
          onSearchChange={setUserLogsSearch}
          actionFilter={userLogsAction}
          onActionFilterChange={setUserLogsAction}
          onClear={() => {
            setUserLogsSearch('');
            setUserLogsAction('all');
          }}
        />

        <ImpersonationSessionsSection
          data={impersonationQ.data}
          isLoading={impersonationQ.isPending && impersonationQ.data === undefined}
          error={impersonationQ.error}
          onRetry={() => void impersonationQ.refetch()}
          search={impersonationSearch}
          onSearchChange={setImpersonationSearch}
          statusFilter={impersonationStatus}
          onStatusFilterChange={setImpersonationStatus}
          onClear={() => {
            setImpersonationSearch('');
            setImpersonationStatus('all');
          }}
        />

        <DebugApiSection payloads={debugPayloads} />
      </div>
    </div>
  );
}
