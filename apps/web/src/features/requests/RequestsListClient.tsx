'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FolderKanban, Plus, Send } from '@nestlancer/ui/icons';

import { analyticsEvents, formatRequestCategory, queryKeys, routes } from '@nestlancer/constants';
import type { ProjectRequestSummary, ProjectSummary, UserRequestStats } from '@nestlancer/types';
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  SkeletonTable,
  StatCard,
} from '@nestlancer/ui';

import { useDebouncedUrlParam } from '@/hooks/useDebouncedUrlParam';
import { apiServices } from '@/lib/axios';
import {
  useRequestsListQuery,
  useRequestsStatsQuery,
} from '@/features/requests/hooks/useRequestsApi';
import { WorkFilterBar } from '@/features/work/WorkFilterBar';
import { WorkHubTabBar } from '@/features/work/WorkHubTabBar';
import { WorkListItem, WorkListShell } from '@/features/work/WorkListItem';
import { formatWorkStatusLabel } from '@/features/work/status-utils';
import { parseWorkHubView, type WorkHubView } from '@/features/work/work-hub-tabs';
import { trackEvent } from '@/lib/telemetry';
import { webPrimaryButtonClass } from '@/lib/tailadmin-classes';
import { ClientListPage } from '@/components/web/ClientListPage';

const PAGE_SIZE = 12;

/** Client-side filter for projects / merged views (requests use API `q`). */
function matchesSearch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

export function RequestsListClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = parseWorkHubView(searchParams.get('view'));
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const { value: search, setValue: setSearch, debounced: searchQ } = useDebouncedUrlParam('q');
  const statusFilter = searchParams.get('status') ?? '';

  const setStatusFilter = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set('status', next);
      else params.delete('status');
      params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (!searchQ.trim()) return;
    trackEvent(analyticsEvents.requestSearchSubmitted, {
      query: searchQ.trim(),
      page,
      statusFilter: statusFilter || 'all',
      view,
    });
  }, [page, searchQ, statusFilter, view]);

  const setPage = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete('page');
    else params.set('page', String(next));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const setView = (next: WorkHubView) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'requests') {
      params.delete('view');
    } else {
      params.set('view', next);
    }
    setPage(1);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const requestsQ = useRequestsListQuery({
    page,
    limit: PAGE_SIZE,
    status: statusFilter || undefined,
    q: searchQ,
    enabled: view === 'requests' || view === 'all',
  });

  // Load projects for project/all views; requests tab uses stats for the Projects KPI.
  const projectsQ = useQuery({
    queryKey: queryKeys.projects.list({}),
    queryFn: () => apiServices.projects.list(),
    enabled: view === 'projects' || view === 'all',
  });

  const statsQ = useRequestsStatsQuery();

  const requestItems = useMemo(
    () => (requestsQ.data?.items ?? []) as ProjectRequestSummary[],
    [requestsQ.data?.items]
  );
  const projectItems = useMemo(() => (projectsQ.data ?? []) as ProjectSummary[], [projectsQ.data]);

  const filteredRequests = useMemo(() => {
    if (view === 'requests') return requestItems;
    const needle = searchQ.trim() || search;
    return requestItems.filter((r) =>
      matchesSearch(`${r.title} ${r.category ?? ''} ${r.status}`, needle)
    );
  }, [requestItems, search, searchQ, view]);

  const filteredProjects = useMemo(() => {
    const needle = searchQ.trim() || search;
    return projectItems.filter((p) => matchesSearch(`${p.title} ${p.status}`, needle));
  }, [projectItems, search, searchQ]);

  const mergedAll = useMemo(() => {
    const rows = [
      ...filteredRequests.map((r) => ({
        kind: 'request' as const,
        id: r.id,
        date: r.createdAt,
        data: r,
      })),
      ...filteredProjects.map((p) => ({
        kind: 'project' as const,
        id: p.id,
        date: p.createdAt ?? '',
        data: p,
      })),
    ];
    return rows.sort((a, b) => (b.date > a.date ? 1 : -1));
  }, [filteredRequests, filteredProjects]);

  const stats = statsQ.data as UserRequestStats | undefined;
  const byStatus = stats?.byStatus ?? {};
  const underReview = Number(byStatus.underReview ?? byStatus.UNDER_REVIEW ?? 0);
  const quoted = Number(byStatus.quoted ?? byStatus.QUOTED ?? 0);
  const convertedProjects = Number(
    byStatus.convertedToProject ?? byStatus.CONVERTED_TO_PROJECT ?? 0
  );
  const projectsCount = projectItems.length || convertedProjects;

  const total = view === 'projects' ? filteredProjects.length : (requestsQ.data?.total ?? 0);
  const isLoading =
    (view === 'requests' && requestsQ.isPending) ||
    (view === 'projects' && projectsQ.isPending) ||
    (view === 'all' && (requestsQ.isPending || projectsQ.isPending));

  const isError =
    (view === 'requests' && requestsQ.isError) ||
    (view === 'projects' && projectsQ.isError) ||
    (view === 'all' && requestsQ.isError && projectsQ.isError);

  const showEmpty =
    !isLoading &&
    !isError &&
    ((view === 'requests' && filteredRequests.length === 0) ||
      (view === 'projects' && filteredProjects.length === 0) ||
      (view === 'all' && mergedAll.length === 0));

  return (
    <ClientListPage>
      <PageHeader
        title="Work Hub"
        description="All your service requests and active projects in one place."
        actions={
          <Button className={webPrimaryButtonClass} asChild>
            <Link href={routes.requestNew}>
              <Plus className="h-4 w-4" aria-hidden />
              New request
            </Link>
          </Button>
        }
      />

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total requests"
            value={Number(stats.total ?? 0)}
            icon={<Send className="h-5 w-5" aria-hidden />}
            iconVariant="info"
            stagger={1}
          />
          <StatCard
            label="Under review"
            value={underReview}
            icon={<Send className="h-5 w-5" aria-hidden />}
            iconVariant="warning"
            stagger={2}
          />
          <StatCard
            label="Quoted"
            value={quoted}
            icon={<Send className="h-5 w-5" aria-hidden />}
            iconVariant="purple"
            stagger={3}
          />
          <StatCard
            label="Projects"
            value={projectsCount}
            icon={<FolderKanban className="h-5 w-5" aria-hidden />}
            iconVariant="success"
            stagger={4}
          />
        </div>
      ) : null}

      <WorkHubTabBar
        active={view}
        onChange={setView}
        counts={{
          requests: requestItems.length || undefined,
          projects: projectItems.length || undefined,
        }}
      />

      <WorkFilterBar
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        showStatusFilter={view === 'requests' || view === 'all'}
      />

      {isError ? (
        <ErrorState
          message="Could not load work items."
          onRetry={() => {
            void requestsQ.refetch();
            void projectsQ.refetch();
          }}
        />
      ) : null}

      {isLoading ? <SkeletonTable rows={6} cols={1} className="py-4" /> : null}

      {showEmpty ? (
        <EmptyState
          title={view === 'projects' ? 'No projects yet' : 'No work items yet'}
          description={
            view === 'projects'
              ? 'Accept a quote to start a project, or browse your requests.'
              : 'Create a request to describe the work you need from the Nestlancer team.'
          }
          action={
            <Button className={webPrimaryButtonClass} asChild>
              <Link href={view === 'projects' ? routes.quotes : routes.requestNew}>
                {view === 'projects' ? 'View quotes' : 'New request'}
              </Link>
            </Button>
          }
        />
      ) : null}

      {!isLoading && !showEmpty ? (
        <WorkListShell>
          {view === 'all'
            ? mergedAll.slice(0, 20).map((row) =>
                row.kind === 'request' ? (
                  <WorkListItem
                    key={`req-${row.id}`}
                    href={routes.request(row.id)}
                    title={row.data.title}
                    status={String(row.data.status)}
                    kind="request"
                    kindLabel={
                      String(row.data.status).toLowerCase() === 'draft' ? 'Draft' : 'Request'
                    }
                    meta={[
                      row.data.category
                        ? formatRequestCategory(String(row.data.category))
                        : 'Service request',
                      row.data.createdAt
                        ? new Date(row.data.createdAt).toLocaleDateString(undefined, {
                            dateStyle: 'medium',
                          })
                        : '—',
                    ]}
                    icon={Send}
                    iconVariant="warning"
                  />
                ) : (
                  <WorkListItem
                    key={`proj-${row.id}`}
                    href={routes.project(row.id)}
                    title={row.data.title}
                    status={String(row.data.status)}
                    kind="project"
                    kindLabel="Project"
                    meta={[
                      formatWorkStatusLabel(String(row.data.status)),
                      row.data.createdAt
                        ? new Date(row.data.createdAt).toLocaleDateString(undefined, {
                            dateStyle: 'medium',
                          })
                        : '—',
                    ]}
                    icon={FolderKanban}
                    iconVariant="success"
                  />
                )
              )
            : null}
          {view === 'requests'
            ? filteredRequests.map((r) => (
                <WorkListItem
                  key={r.id}
                  href={routes.request(r.id)}
                  title={r.title}
                  status={String(r.status)}
                  kind="request"
                  kindLabel={String(r.status).toLowerCase() === 'draft' ? 'Draft' : 'Request'}
                  meta={[
                    r.category ? formatRequestCategory(String(r.category)) : 'Service request',
                    r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
                      : '—',
                  ]}
                  icon={Send}
                  iconVariant="warning"
                />
              ))
            : null}
          {view === 'projects'
            ? filteredProjects.map((p) => (
                <WorkListItem
                  key={p.id}
                  href={routes.project(p.id)}
                  title={p.title}
                  status={String(p.status)}
                  kind="project"
                  kindLabel="Project"
                  meta={[
                    formatWorkStatusLabel(String(p.status)),
                    p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
                      : '—',
                  ]}
                  icon={FolderKanban}
                  iconVariant="success"
                />
              ))
            : null}
        </WorkListShell>
      ) : null}

      {view === 'requests' && !isLoading && !isError && total > 0 ? (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      ) : null}
    </ClientListPage>
  );
}
