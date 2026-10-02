'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useQueries, useQuery } from '@tanstack/react-query';

import { Button } from '@nestlancer/ui';

import {
  GeActivityList,
  GeCard,
  GeCardHeader,
  GePageHeader,
  GeRecentTable,
  GeStatusBadge,
  GeTaskList,
} from '@/components/admin/AdminGentelellaUI';
import { AdminMetricStrip, AdminTabBar } from '@/components/admin/AdminPageChrome';
import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { adminKeys } from '@/lib/admin-query-keys';
import {
  buildUserPipelineSnapshot,
  PIPELINE_CATEGORY_LABELS,
  tableRowsFromRecords,
  userPipelineFlaggedQuery,
  userPipelinePaymentsQuery,
  userPipelineProjectsQuery,
  userPipelineQuotesQuery,
  userPipelineRequestsQuery,
  userPipelineKpis,
  type PipelineCategoryId,
} from '@/lib/admin-pipeline-hub';
import { CLIENT_DELIVERY_PIPELINE } from '@/lib/admin-pipelines';
import { pickAdminPagination, pickAdminRows, rowId } from '@/lib/admin-response';
import { getStr } from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';

import { PipelineHubTabs } from './PipelineHubTabs';
import { PipelineUserStageStrip } from './PipelineUserStageStrip';

function userDisplayName(profile: Record<string, unknown> | null): string {
  if (!profile) return 'User';
  const name = [profile.firstName, profile.lastName].filter((x) => typeof x === 'string').join(' ');
  if (name) return name;
  return getStr(profile.email) || getStr(profile.id) || 'User';
}

export function UserPipelineHubClient({ userId }: { userId: string }) {
  const categoryIds = Object.keys(PIPELINE_CATEGORY_LABELS) as PipelineCategoryId[];
  const [activeTab, setActiveTab] = useState<PipelineCategoryId>('requests');

  const userQ = useQuery({
    queryKey: adminKeys.user(userId),
    queryFn: () => apiServices.admin.getUser(userId),
  });

  const bundleQ = useQueries({
    queries: [
      {
        queryKey: [...adminKeys.pipelineUser(userId), 'requests'],
        queryFn: () => apiServices.admin.listAdminRequests(userPipelineRequestsQuery(userId)),
        staleTime: 30_000,
      },
      {
        queryKey: [...adminKeys.pipelineUser(userId), 'quotes'],
        queryFn: () => apiServices.admin.listAdminQuotes(userPipelineQuotesQuery(userId)),
        staleTime: 30_000,
      },
      {
        queryKey: [...adminKeys.pipelineUser(userId), 'projects'],
        queryFn: () => apiServices.admin.listAdminProjects(userPipelineProjectsQuery(userId)),
        staleTime: 30_000,
      },
      {
        queryKey: [...adminKeys.pipelineUser(userId), 'payments'],
        queryFn: () => apiServices.admin.listAdminPayments(userPipelinePaymentsQuery(userId)),
        staleTime: 30_000,
      },
      {
        queryKey: [...adminKeys.pipelineUser(userId), 'flagged'],
        queryFn: () => apiServices.admin.getFlaggedMessages(userPipelineFlaggedQuery(userId)),
        staleTime: 30_000,
      },
      {
        queryKey: [...adminKeys.user(userId), 'sessions'],
        queryFn: () => apiServices.admin.getUserSessions(userId),
        staleTime: 30_000,
      },
      {
        queryKey: [...adminKeys.user(userId), 'activity'],
        queryFn: () => apiServices.admin.getUserActivity(userId),
        staleTime: 30_000,
      },
    ],
  });

  const profile = useMemo(() => {
    const raw = userQ.data;
    if (raw && typeof raw === 'object' && 'data' in (raw as object)) {
      return (raw as unknown as { data: Record<string, unknown> }).data;
    }
    return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  }, [userQ.data]);

  const snapshot = useMemo(() => {
    const requests = pickAdminRows(bundleQ[0].data);
    const quotes = pickAdminRows(bundleQ[1].data);
    const projects = pickAdminRows(bundleQ[2].data);
    const payments = pickAdminRows(bundleQ[3].data);
    const flaggedTotal =
      pickAdminPagination(bundleQ[4].data)?.total ?? pickAdminRows(bundleQ[4].data).length;
    return buildUserPipelineSnapshot(requests, quotes, projects, payments, flaggedTotal);
  }, [bundleQ]);

  const isLoading = userQ.isPending || bundleQ.some((q) => q.isPending && q.data === undefined);

  const stageMetrics = useMemo(
    () => ({
      contact: '—',
      requests: String(snapshot.requests.length),
      quotes: String(snapshot.quotes.length),
      projects: String(
        snapshot.projects.filter(
          (p) =>
            !String(p.status ?? '')
              .toUpperCase()
              .includes('COMPLET')
        ).length
      ),
      payments: String(snapshot.payments.length),
      messages: String(pickAdminPagination(bundleQ[4].data)?.total ?? 0),
    }),
    [snapshot, bundleQ]
  );

  const kpis = useMemo(
    () => userPipelineKpis(snapshot, pickAdminRows(bundleQ[5].data).length),
    [snapshot, bundleQ]
  );

  const activityItems = useMemo(() => {
    return pickAdminRows(bundleQ[6].data)
      .slice(0, 6)
      .map((row, i) => ({
        id: rowId(row) || `act-${i}`,
        title: getStr(row.action) || getStr(row.type) || 'Activity',
        description: getStr(row.details) || getStr(row.description),
        when: getStr(row.createdAt) || getStr(row.timestamp),
      }));
  }, [bundleQ]);

  const tabRows = useMemo(() => {
    const map: Record<PipelineCategoryId, Record<string, unknown>[]> = {
      requests: snapshot.requests,
      quotes: snapshot.quotes,
      projects: snapshot.projects,
      payments: snapshot.payments,
      messages: [],
      trust: pickAdminRows(bundleQ[5].data),
    };
    return map[activeTab] ?? [];
  }, [activeTab, snapshot, bundleQ]);

  const paramEntries = useMemo(() => {
    const countMap: Record<PipelineCategoryId, Record<string, number>> = {
      requests: snapshot.requestCounts,
      quotes: snapshot.quoteCounts,
      projects: snapshot.projectCounts,
      payments: snapshot.paymentCounts,
      messages: {},
      trust: { sessions: pickAdminRows(bundleQ[5].data).length },
    };
    return Object.entries(countMap[activeTab] ?? {}).sort((a, b) => b[1] - a[1]);
  }, [activeTab, snapshot, bundleQ]);

  const firstProjectId = snapshot.projects[0] ? rowId(snapshot.projects[0]) : undefined;

  return (
    <div className="space-y-6">
      <PipelineHubTabs />

      <GePageHeader
        pretitle="Operations · User pipeline"
        title="User hub"
        description="360° view of one client — requests, quotes, projects, payments, and trust signals scoped to this account."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/users/${userId}`}>User admin →</Link>
            </Button>
            {firstProjectId ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/pipeline/projects/${firstProjectId}`}>Project hub</Link>
              </Button>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <Link href="/pipeline">Stage pipeline</Link>
            </Button>
          </>
        }
      />

      <GeCard flush>
        <GeCardHeader
          title={userDisplayName(profile)}
          subtitle={profile ? getStr(profile.email) : userId}
          actions={
            profile ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {getStr(profile.role) || 'USER'}
                </span>
                <GeStatusBadge status={String(profile.status ?? '—')} />
              </div>
            ) : undefined
          }
        />
        <div className="ge-card-body border-t border-border py-2">
          <p className="font-mono text-xs text-muted-foreground">{userId}</p>
        </div>
      </GeCard>

      {snapshot.crossAlerts.length > 0 ? (
        <div className="flex flex-wrap gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          {snapshot.crossAlerts.map((a) => (
            <span
              key={a.id}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                a.severity === 'crit'
                  ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-200'
              }`}
            >
              {a.label}
            </span>
          ))}
        </div>
      ) : null}

      <AdminQueryState isLoading={isLoading} error={userQ.error}>
        <AdminMetricStrip items={kpis} max={6} />

        <GeCard flush>
          <GeCardHeader
            title={CLIENT_DELIVERY_PIPELINE.title}
            subtitle="Stages for this user only — counts from filtered lists"
          />
          <PipelineUserStageStrip
            pipeline={CLIENT_DELIVERY_PIPELINE}
            metrics={stageMetrics}
            projectHubHref={firstProjectId ? `/pipeline/projects/${firstProjectId}` : undefined}
          />
        </GeCard>

        <AdminTabBar
          tabs={categoryIds.map((id) => ({ label: PIPELINE_CATEGORY_LABELS[id] }))}
          activeIndex={Math.max(0, categoryIds.indexOf(activeTab))}
          onChange={(i) => setActiveTab(categoryIds[i] ?? 'requests')}
        />

        <div className="ge-row ge-col-8-4">
          <GeCard flush className="h-full">
            <GeCardHeader
              title={PIPELINE_CATEGORY_LABELS[activeTab]}
              subtitle="Status parameters and records"
            />
            <div className="ge-card-body border-t border-border">
              <div className="mb-4 flex flex-wrap gap-2">
                {paramEntries.length ? (
                  paramEntries.map(([key, n]) => (
                    <span
                      key={key}
                      className="rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px]"
                    >
                      <strong className="text-foreground">{n}</strong>{' '}
                      <span className="text-muted-foreground">{key}</span>
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No status breakdown for this category.
                  </p>
                )}
              </div>
              <div className="ge-card-body-flush overflow-x-auto border-t border-border">
                {(() => {
                  const rows =
                    activeTab === 'trust'
                      ? pickAdminRows(bundleQ[5].data)
                          .slice(0, 8)
                          .map((s, i) => ({
                            id: rowId(s) || `session-${i}`,
                            title: 'Active session',
                            status: 'ACTIVE',
                          }))
                      : tableRowsFromRecords(tabRows, 10);
                  if (!rows.length) {
                    return (
                      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No records for this user in this category.
                      </p>
                    );
                  }
                  return (
                    <table className="ge-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.id}>
                            <td>
                              <span className="ge-cell-mono">{r.id}</span>
                            </td>
                            <td>
                              <span className="ge-cell-strong">{r.title}</span>
                            </td>
                            <td>
                              <GeStatusBadge status={r.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          </GeCard>

          <div className="space-y-4">
            <GeCard flush>
              <GeCardHeader title="Operator tasks" subtitle="Cross-category signals" />
              <div className="ge-card-body !py-2">
                {snapshot.crossAlerts.length ? (
                  <GeTaskList
                    items={snapshot.crossAlerts.map((a) => ({
                      id: a.id,
                      title: a.label,
                      detail: a.action,
                      severity: a.severity === 'crit' ? 'critical' : 'warning',
                    }))}
                  />
                ) : (
                  <p className="py-2 text-sm text-muted-foreground">No cross-category alerts.</p>
                )}
              </div>
            </GeCard>

            <GeCard flush>
              <GeCardHeader title="Recent activity" subtitle="User activity log" />
              <div className="ge-card-body !py-2">
                <GeActivityList items={activityItems} />
              </div>
            </GeCard>
          </div>
        </div>

        <div className="ge-row ge-col-2">
          <GeRecentTable
            title="Requests"
            viewAllHref="/requests"
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'title', header: 'Subject' },
              { key: 'status', header: 'Status' },
            ]}
            rows={tableRowsFromRecords(snapshot.requests, 5)}
          />
          <GeRecentTable
            title="Quotes"
            viewAllHref="/quotes"
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'title', header: 'Title' },
              { key: 'status', header: 'Status' },
            ]}
            rows={tableRowsFromRecords(snapshot.quotes, 5)}
          />
        </div>

        <GeRecentTable
          title="Projects"
          subtitle="Use project hub for milestone loop and timeline"
          viewAllHref="/projects"
          columns={[
            { key: 'id', header: 'ID' },
            { key: 'title', header: 'Project' },
            { key: 'status', header: 'Status' },
          ]}
          rows={tableRowsFromRecords(snapshot.projects, 8)}
        />
      </AdminQueryState>
    </div>
  );
}
