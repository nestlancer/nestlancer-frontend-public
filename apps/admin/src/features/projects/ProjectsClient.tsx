'use client';

import Link from 'next/link';

import { useMemo, useState } from 'react';

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
  Pagination,
  SkeletonTable,
} from '@nestlancer/ui';

import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { DebugApiSection, PageHeader } from '@/components/admin/AdminDataViews';
import {
  AdminDataShell,
  AdminFilterBar,
  adminDataTableClass,
} from '@/components/admin/AdminPageChrome';
import { collectStatusFilterOptions, filterTableRows } from '@/components/admin/AdminTableViews';
import { adminKeys } from '@/lib/admin-query-keys';
import {
  clientEmailFromRow,
  formatAdminStatus,
  pickAdminPagination,
  pickAdminRows,
  rowId,
  rowTitle,
} from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

import { AdminDuplicateProjectWizard } from './AdminDuplicateProjectWizard';
import { AdminProjectStatsSummary } from './AdminProjectStatsSummary';
import { AdminListPage } from '@/components/admin/AdminListPage';

const PAGE_SIZE = 20;
type ProjectRow = Record<string, unknown>;

export function ProjectsClient({
  initialStatus = 'all',
  title = 'Projects',
}: {
  initialStatus?: string;
  title?: string;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [templateProjectId, setTemplateProjectId] = useState<string | null>(null);

  const stats = useQuery({
    queryKey: adminKeys.projectsStats(),
    queryFn: () => apiServices.admin.getProjectStats(),
  });

  const listQ = useQuery({
    queryKey: [...adminKeys.root, 'projects', 'list', page, search, statusFilter],
    queryFn: () =>
      apiServices.admin.listAdminProjects({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  const data = stats.data;

  const projects = useMemo(() => pickAdminRows(listQ.data), [listQ.data]);
  const pagination = useMemo(() => pickAdminPagination(listQ.data), [listQ.data]);
  const statusOptions = useMemo(() => collectStatusFilterOptions(projects), [projects]);
  const filteredProjects = useMemo(
    () => filterTableRows(projects, search, statusFilter),
    [projects, search, statusFilter]
  );
  const archiveM = useMutation({
    mutationFn: (id: string) => apiServices.admin.archiveProject(id),
    onSuccess: () => {
      toast.success('Project archived.');
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'projects'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not archive')),
  });

  const unarchiveM = useMutation({
    mutationFn: (id: string) => apiServices.admin.unarchiveProject(id),
    onSuccess: () => {
      toast.success('Project unarchived.');
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'projects'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not unarchive')),
  });

  const columns = useMemo<DataTableColumn<ProjectRow>[]>(
    () => [
      {
        id: 'title',
        header: 'Title',
        cell: (row) => {
          const id = rowId(row);
          const title = rowTitle(row);
          return id ? (
            <Link
              href={`/projects/${encodeURIComponent(id)}`}
              className="font-medium hover:text-primary hover:underline"
            >
              {title}
            </Link>
          ) : (
            <span className="font-medium">{title}</span>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => (
          <DomainStatusBadge domain="project" status={formatAdminStatus(row.status)} />
        ),
      },
      {
        id: 'client',
        header: 'Client',
        cell: (row) => <span className="text-muted-foreground">{clientEmailFromRow(row)}</span>,
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
          const rawStatus = String(row.status ?? '');
          const isArchived = rawStatus.toLowerCase().includes('archiv');
          return (
            <div className="flex justify-end gap-2">
              <Link
                href={`/projects/${encodeURIComponent(id)}`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                View →
              </Link>
              {isArchived ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={unarchiveM.isPending}
                  onClick={() => unarchiveM.mutate(id)}
                >
                  Unarchive
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={archiveM.isPending}
                  onClick={() => archiveM.mutate(id)}
                >
                  Archive
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setTemplateProjectId(id)}>
                Use as template
              </Button>
            </div>
          );
        },
      },
    ],
    [archiveM, unarchiveM]
  );

  const listTotal = pagination?.total ?? filteredProjects.length;

  const debugPayloads = { projectStats: data, projects: listQ.data } as Record<string, unknown>;

  return (
    <AdminListPage>
      <PageHeader
        pretitle="Operations"
        title={title}
        description="Search and manage all client projects. Click a project to view its full detail."
      />

      <AdminQueryState isLoading={stats.isLoading} error={stats.error}>
        <>
          <AdminProjectStatsSummary data={data} />

          <AdminDataShell
            filter={
              <AdminFilterBar
                search={search}
                onSearchChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                searchPlaceholder="Search projects…"
                filters={[
                  {
                    id: 'status',
                    label: 'Status',
                    value: statusFilter,
                    options: [
                      { value: 'all', label: 'All statuses' },
                      ...statusOptions.map((opt) => ({
                        value: opt,
                        label: formatAdminStatus(opt),
                      })),
                    ],
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
                      setStatusFilter('all');
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
            {listQ.isPending ? <SkeletonTable rows={6} cols={5} /> : null}
            {!listQ.isPending && listQ.error ? (
              <ErrorState
                message={getApiErrorMessage(listQ.error, 'Could not load projects')}
                onRetry={() => {
                  void listQ.refetch();
                }}
              />
            ) : null}
            {!listQ.isPending && !listQ.error ? (
              <DataTable
                className={adminDataTableClass}
                columns={columns}
                rows={filteredProjects}
                getRowId={(row) =>
                  rowId(row) || `${String(row.title ?? 'project')}-${String(row.clientId ?? '')}`
                }
                emptyTitle="No projects match your filters"
                emptyDescription="Try adjusting search or status filters."
              />
            ) : null}
          </AdminDataShell>

          <p className="text-sm text-muted-foreground">{listTotal} project records</p>

          <DebugApiSection payloads={debugPayloads} />
        </>
      </AdminQueryState>

      {templateProjectId ? (
        <AdminDuplicateProjectWizard
          projectId={templateProjectId}
          open={Boolean(templateProjectId)}
          onOpenChange={(next) => {
            if (!next) setTemplateProjectId(null);
          }}
        />
      ) : null}
    </AdminListPage>
  );
}
