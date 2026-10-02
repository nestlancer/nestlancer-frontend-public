'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { useQueries, useQuery } from '@tanstack/react-query';

import { Button, PctProgressFill } from '@nestlancer/ui';

import {
  GeActivityList,
  GeCard,
  GeCardHeader,
  GePageHeader,
  GeRecentTable,
  GeStatusBadge,
  GeTaskList,
} from '@/components/admin/AdminGentelellaUI';
import { AdminMetricStrip } from '@/components/admin/AdminPageChrome';
import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { adminKeys } from '@/lib/admin-query-keys';
import {
  MILESTONE_LOOP_STEPS,
  projectPipelinePaymentsQuery,
  projectProgressPercent,
  rowUserId,
} from '@/lib/admin-pipeline-hub';
import {
  clientEmailFromRow,
  formatAdminStatus,
  pickAdminRecord,
  pickAdminRows,
  rowId,
  rowTitle,
} from '@/lib/admin-response';
import { getStr, type KpiItem } from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';

import { PipelineHubTabs } from './PipelineHubTabs';

type MilestoneRow = Record<string, unknown>;

export function ProjectPipelineHubClient({ projectId }: { projectId: string }) {
  const projectQ = useQuery({
    queryKey: [...adminKeys.root, 'project', projectId],
    queryFn: () => apiServices.admin.getAdminProject(projectId),
  });

  const relatedQ = useQueries({
    queries: [
      {
        queryKey: [...adminKeys.pipelineProject(projectId), 'deliverables'],
        queryFn: () => apiServices.admin.listProjectDeliverables(projectId),
        staleTime: 30_000,
      },
      {
        queryKey: [...adminKeys.pipelineProject(projectId), 'timeline'],
        queryFn: () => apiServices.admin.getAdminProgressTimeline(projectId),
        staleTime: 30_000,
      },
      {
        queryKey: [...adminKeys.pipelineProject(projectId), 'payments'],
        queryFn: () => apiServices.admin.listAdminPayments(projectPipelinePaymentsQuery(projectId)),
        staleTime: 30_000,
      },
    ],
  });

  const record = useMemo(() => pickAdminRecord(projectQ.data) ?? {}, [projectQ.data]);
  const deliverables = useMemo(() => pickAdminRows(relatedQ[0].data) as MilestoneRow[], [relatedQ]);
  const timelineRaw = useMemo(() => pickAdminRows(relatedQ[1].data), [relatedQ]);
  const payments = useMemo(() => pickAdminRows(relatedQ[2].data), [relatedQ]);

  const milestones = useMemo(() => {
    const ms = record.milestones;
    return Array.isArray(ms) ? (ms as MilestoneRow[]) : [];
  }, [record]);

  const progress = projectProgressPercent(record);
  const statusLabel = formatAdminStatus(record.status);
  const clientUserId = rowUserId(record) || getStr(record.clientId) || getStr(record.userId);
  const requestId = getStr(record.requestId);
  const quoteId = getStr(record.quoteId);

  const kpis: KpiItem[] = useMemo(() => {
    const openMs = milestones.filter(
      (m) =>
        !String(m.status ?? '')
          .toUpperCase()
          .includes('COMPLET')
    ).length;
    const pendingPay = payments.filter((p) =>
      String(p.status ?? '')
        .toUpperCase()
        .includes('PENDING')
    ).length;
    return [
      { label: 'Progress', value: `${progress}%` },
      { label: 'Milestones', value: String(milestones.length), hint: `${openMs} open` },
      { label: 'Deliverables', value: String(deliverables.length) },
      {
        label: 'Payments',
        value: String(payments.length),
        hint: pendingPay ? `${pendingPay} pending` : undefined,
      },
      { label: 'Timeline events', value: String(timelineRaw.length) },
      { label: 'Status', value: statusLabel },
    ];
  }, [progress, milestones, deliverables, payments, timelineRaw, statusLabel]);

  const timelineItems = useMemo(() => {
    return timelineRaw.slice(0, 8).map((row, i) => ({
      id: rowId(row) || `tl-${i}`,
      title: getStr(row.title) || getStr(row.type) || 'Event',
      description: getStr(row.description) || getStr(row.summary),
      when: getStr(row.createdAt) || getStr(row.timestamp),
    }));
  }, [timelineRaw]);

  const milestoneTableRows = useMemo(
    () =>
      milestones.slice(0, 10).map((m, i) => ({
        id: getStr(m.id) || `m-${i}`,
        title: getStr(m.name) || getStr(m.title) || 'Milestone',
        status: String(m.status ?? '—'),
        payment: getStr(m.paymentStatus) || '—',
      })),
    [milestones]
  );

  const paymentTableRows = useMemo(
    () =>
      payments.slice(0, 8).map((p, i) => ({
        id: rowId(p) || `pay-${i}`,
        title: getStr(p.milestoneId) || rowTitle(p),
        status: String(p.status ?? '—'),
        amount: getStr(p.amount) || '—',
      })),
    [payments]
  );

  const loopStepGuess = milestones.some((m) => String(m.status).toUpperCase().includes('PENDING'))
    ? 15
    : deliverables.some((d) => String(d.status).toUpperCase().includes('UPLOAD'))
      ? 12
      : 11;

  const isLoading = projectQ.isPending && !projectQ.data;

  return (
    <div className="space-y-6">
      <PipelineHubTabs />

      <GePageHeader
        pretitle="Operations · Project pipeline"
        title="Project hub"
        description="Delivery 360° — origin chain, milestone loop, payments, deliverables, and progress timeline for one engagement."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${projectId}`}>Project detail →</Link>
            </Button>
            {clientUserId ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/pipeline/users/${clientUserId}`}>User hub</Link>
              </Button>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <Link href="/pipeline">Stage pipeline</Link>
            </Button>
          </>
        }
      />

      <AdminQueryState isLoading={isLoading} error={projectQ.error}>
        <GeCard flush>
          <div className="ge-card-body">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-foreground">{rowTitle(record)}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-mono">{projectId}</span>
                  {clientUserId ? (
                    <>
                      {' '}
                      · Client:{' '}
                      <Link
                        href={`/pipeline/users/${clientUserId}`}
                        className="text-[var(--ge-primary)]"
                      >
                        {clientEmailFromRow(record)}
                      </Link>
                    </>
                  ) : (
                    <> · {clientEmailFromRow(record)}</>
                  )}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="origin-box rounded-md border border-border bg-muted/30 px-2 py-1">
                    {requestId ? `Request ${requestId}` : 'Request —'}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="origin-box rounded-md border border-border bg-muted/30 px-2 py-1">
                    {quoteId ? `Quote ${quoteId}` : 'Quote —'}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="rounded-md border border-[var(--ge-primary)]/40 bg-[var(--ge-primary)]/5 px-2 py-1 font-medium">
                    Project {projectId}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <GeStatusBadge status={statusLabel} />
                <div className="mt-2 h-2 w-40 overflow-hidden rounded-full bg-muted">
                  <PctProgressFill
                    pct={progress}
                    fillClassName="fill-[var(--ge-primary)]"
                    className="h-full"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{progress}% complete</p>
              </div>
            </div>
          </div>
        </GeCard>

        <AdminMetricStrip items={kpis} max={6} />

        <GeCard flush>
          <GeCardHeader
            title="Milestone loop (E2E steps 11–17)"
            subtitle="Repeat 11→16 until all milestones paid; then mark project COMPLETED"
          />
          <div className="flex flex-col gap-0 overflow-x-auto border-t border-border p-4 sm:flex-row">
            {MILESTONE_LOOP_STEPS.map((stepN) => {
              const step = [
                { n: 11, label: 'Add milestones' },
                { n: 12, label: 'Upload deliverable' },
                { n: 13, label: 'Approve deliverable' },
                { n: 14, label: 'Approve milestone' },
                { n: 15, label: 'Payment intent' },
                { n: 16, label: 'Confirm payment' },
              ].find((s) => s.n === stepN);
              const isCurrent = stepN === loopStepGuess;
              const isDone = stepN < loopStepGuess;
              return (
                <div
                  key={stepN}
                  className={`min-w-[120px] flex-1 border border-border bg-card p-3 first:rounded-l-lg last:rounded-r-lg ${
                    isCurrent ? 'z-[1] border-[var(--ge-primary)] shadow-sm' : ''
                  } ${isDone ? 'opacity-90' : ''}`}
                >
                  <span className="text-lg font-semibold text-[var(--ge-primary)]">
                    {isDone ? '✓' : stepN}
                  </span>
                  <p className="mt-1 text-xs font-medium">{step?.label}</p>
                </div>
              );
            })}
            <div className="min-w-[100px] flex-1 rounded-r-lg border border-green-500/40 bg-green-500/5 p-3">
              <span className="text-lg font-semibold text-green-600">17</span>
              <p className="mt-1 text-xs font-medium">Complete project</p>
            </div>
          </div>
        </GeCard>

        <div className="ge-row ge-col-8-4">
          <div className="space-y-4">
            <GeRecentTable
              title="Milestones"
              subtitle="From project record"
              viewAllHref={`/projects/${projectId}`}
              columns={[
                { key: 'id', header: 'ID' },
                { key: 'title', header: 'Milestone' },
                { key: 'status', header: 'Status' },
                { key: 'payment', header: 'Payment' },
              ]}
              rows={milestoneTableRows}
              emptyMessage="No milestones on this project."
            />
            <GeRecentTable
              title="Payments"
              viewAllHref="/payments"
              columns={[
                { key: 'id', header: 'ID' },
                { key: 'title', header: 'Ref' },
                { key: 'status', header: 'Status' },
                { key: 'amount', header: 'Amount' },
              ]}
              rows={paymentTableRows}
              emptyMessage="No payments linked yet."
            />
          </div>

          <div className="space-y-4">
            <GeCard flush>
              <GeCardHeader title="Request & quote" subtitle="Commercial origin" />
              <div className="ge-card-body text-sm">
                <dl className="space-y-2">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Request</dt>
                    <dd className="font-mono text-xs">
                      {requestId ? <Link href={`/requests/${requestId}`}>{requestId}</Link> : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Quote</dt>
                    <dd className="font-mono text-xs">
                      {quoteId ? <Link href={`/quotes/${quoteId}`}>{quoteId}</Link> : '—'}
                    </dd>
                  </div>
                </dl>
              </div>
            </GeCard>

            <GeCard flush>
              <GeCardHeader title="Deliverables" subtitle={`${deliverables.length} on project`} />
              <div className="ge-card-body !py-2">
                {deliverables.length ? (
                  <GeTaskList
                    items={deliverables.slice(0, 6).map((d, i) => ({
                      id: rowId(d) || `d-${i}`,
                      title: rowTitle(d),
                      detail: String(d.status ?? ''),
                      severity: String(d.status).toUpperCase() === 'REJECTED' ? 'critical' : 'info',
                    }))}
                  />
                ) : (
                  <p className="py-2 text-sm text-muted-foreground">No deliverables yet.</p>
                )}
              </div>
            </GeCard>

            <GeCard flush>
              <GeCardHeader title="Progress timeline" subtitle="Admin progress API" />
              <div className="ge-card-body !py-2">
                <GeActivityList items={timelineItems} />
              </div>
            </GeCard>

            <GeCard flush>
              <GeCardHeader title="Quick actions" />
              <div className="ge-card-body space-y-2 text-xs text-muted-foreground">
                <p>PATCH /admin/projects/{projectId}/status</p>
                <p>POST /admin/progress/projects/{projectId}/complete</p>
                <p>GET /admin/progress/projects/{projectId}/timeline</p>
              </div>
            </GeCard>
          </div>
        </div>
      </AdminQueryState>
    </div>
  );
}
