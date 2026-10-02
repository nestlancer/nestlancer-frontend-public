'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { Button, StatusBadge } from '@nestlancer/ui';

import { GePageHeader as PageHeader } from '@/components/admin/AdminGentelellaUI';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { adminKeys } from '@/lib/admin-query-keys';
import {
  formatAdminStatus,
  pickAdminRecord,
  pickAdminRows,
  projectStatusTone,
} from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

import { openProjectExportDownload } from '@/features/exports/open-project-export-download';
import { AdminDuplicateProjectWizard } from './AdminDuplicateProjectWizard';
import { AdminProgressUpdateSection } from './AdminProgressUpdateSection';
import { AdminProjectAnalyticsPanel } from './AdminProjectAnalyticsPanel';
import { AdminProjectDeliveryPanel } from './AdminProjectDeliveryPanel';
import { AdminProjectDetailTabBar } from './AdminProjectDetailTabBar';
import { AdminProjectOverviewPanel } from './AdminProjectOverviewPanel';
import { AdminProjectSummaryStrip } from './AdminProjectSummaryStrip';
import {
  ADMIN_PROJECT_DETAIL_TAB_HINTS,
  parseAdminProjectDetailTab,
} from './admin-project-detail-tabs';

type MilestoneRecord = Record<string, unknown>;
type DeliverableRecord = Record<string, unknown>;

export function AdminProjectDetailClient({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { confirm } = useAdminConfirm();
  const activeTab = parseAdminProjectDetailTab(searchParams.get('tab'));
  const [templateOpen, setTemplateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('downloadExport') !== '1') return;
    void openProjectExportDownload(projectId).then((ok) => {
      if (!ok) return;
      const next = new URLSearchParams(searchParams.toString());
      next.delete('downloadExport');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }, [pathname, projectId, router, searchParams]);

  const q = useQuery({
    queryKey: [...adminKeys.root, 'project', projectId],
    queryFn: () => apiServices.admin.getAdminProject(projectId),
  });

  const deliverablesQ = useQuery({
    queryKey: [...adminKeys.root, 'project', projectId, 'deliverables'],
    queryFn: () => apiServices.admin.listProjectDeliverables(projectId),
  });

  const analyticsQ = useQuery({
    queryKey: [...adminKeys.root, 'project', projectId, 'analytics'],
    queryFn: () => apiServices.admin.getProjectAnalytics(projectId),
    enabled: activeTab === 'analytics',
  });

  const progressAnalyticsQ = useQuery({
    queryKey: [...adminKeys.root, 'project', projectId, 'progress-analytics'],
    queryFn: () => apiServices.admin.getProjectProgressAnalytics(projectId),
    enabled: activeTab === 'analytics',
  });

  const record = pickAdminRecord(q.data) ?? {};
  const hasRecord = Boolean(record.id);
  const deliverables = pickAdminRows(deliverablesQ.data) as DeliverableRecord[];
  const milestones = (
    Array.isArray(record.milestones) ? (record.milestones as MilestoneRecord[]) : []
  ).map((m, i) => ({
    id: String(m.id ?? `ms-${i}`),
    name: String(m.name ?? m.title ?? `Milestone ${i + 1}`),
    status: String(m.status ?? ''),
  }));

  const statusLabel = formatAdminStatus(record.status);
  const rawStatus = String(record.status ?? '');
  const isArchived = rawStatus.toLowerCase().includes('archiv');

  const deliverablesAwaitingReview = deliverables.filter((d) => {
    const s = String(d.status ?? '').toUpperCase();
    if (
      !(s === 'PENDING' || s === 'IN_PROGRESS' || s === 'READY_FOR_REVIEW' || s === 'SUBMITTED')
    ) {
      return false;
    }
    const parent = milestones.find((m) => m.id === String(d.milestoneId ?? ''));
    const ms = String(parent?.status ?? '').toUpperCase();
    // NL-DEL-004: do not count review CTAs under already-approved milestones.
    if (ms === 'APPROVED' || ms === 'CANCELLED') return false;
    return true;
  }).length;

  const archiveM = useMutation({
    mutationFn: () => apiServices.admin.archiveProject(projectId),
    onSuccess: () => {
      toast.success('Project archived.');
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'project', projectId] });
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'projects'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not archive')),
  });

  const unarchiveM = useMutation({
    mutationFn: () => apiServices.admin.unarchiveProject(projectId),
    onSuccess: () => {
      toast.success('Project unarchived.');
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'project', projectId] });
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'projects'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not unarchive')),
  });

  const exportM = useMutation({
    mutationFn: () => apiServices.admin.exportProject(projectId),
    onSuccess: () => {
      toast.success('Export triggered. Download link will arrive via notification.');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not export')),
  });

  // NL-BUG-UI-016: invalid / missing entity must not render a silent blank shell
  // (PageHeader titled "Project" + empty body). Show an explicit not-found state.
  if (q.isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/projects"
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          ← Back to projects
        </Link>
        <AdminQueryState isLoading error={null}>
          {null}
        </AdminQueryState>
      </div>
    );
  }

  if (q.isError || !hasRecord) {
    return (
      <div className="space-y-6">
        <Link
          href="/projects"
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          ← Back to projects
        </Link>
        <PageHeader
          pretitle="Operations"
          title="Project not found"
          description="This project id does not exist or is no longer available."
        />
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {q.isError
            ? getApiErrorMessage(q.error, 'Project not found')
            : 'No project matched this id.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/projects"
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          ← Back to projects
        </Link>
      </div>

      <PageHeader
        pretitle="Operations"
        title={String(record.title ?? record.name ?? 'Project')}
        description="Manage delivery, client communication, and project lifecycle from one workspace."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant={projectStatusTone(record.status)}>{statusLabel}</StatusBadge>
            {isArchived ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={unarchiveM.isPending}
                onClick={() => unarchiveM.mutate()}
              >
                {unarchiveM.isPending ? 'Unarchiving…' : 'Unarchive'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={archiveM.isPending}
                onClick={async () => {
                  const { confirmed } = await confirm({
                    title: 'Archive project',
                    description: 'Archive this project? It will be hidden from active lists.',
                    confirmLabel: 'Archive',
                  });
                  if (!confirmed) return;
                  archiveM.mutate();
                }}
              >
                {archiveM.isPending ? 'Archiving…' : 'Archive'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setTemplateOpen(true)}
            >
              Use as template
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={exportM.isPending}
              onClick={() => exportM.mutate()}
            >
              Export
            </Button>
          </div>
        }
      />

      <AdminQueryState isLoading={q.isLoading} error={q.error}>
        <AdminProjectSummaryStrip
          record={record}
          milestoneCount={milestones.length}
          deliverableCount={deliverables.length}
          deliverablesAwaitingReview={deliverablesAwaitingReview}
        />

        <div className="space-y-4 pt-2">
          <AdminProjectDetailTabBar />
          <p className="text-sm text-muted-foreground">
            {ADMIN_PROJECT_DETAIL_TAB_HINTS[activeTab]}
          </p>

          <div
            role="tabpanel"
            id={`admin-project-panel-${activeTab}`}
            aria-labelledby={`admin-project-tab-${activeTab}`}
            className="animate-fade-in motion-reduce:animate-none"
          >
            {activeTab === 'overview' ? (
              <AdminProjectOverviewPanel
                projectId={projectId}
                record={record}
                currentStatus={rawStatus}
              />
            ) : null}

            {activeTab === 'delivery' ? (
              <AdminProjectDeliveryPanel
                projectId={projectId}
                projectStatus={rawStatus}
                milestones={
                  Array.isArray(record.milestones) ? (record.milestones as MilestoneRecord[]) : []
                }
                milestoneOptions={milestones}
                deliverables={deliverables}
                deliverablesLoading={deliverablesQ.isLoading}
                deliverablesError={deliverablesQ.error}
                payments={
                  Array.isArray(record.payments)
                    ? (record.payments as Record<string, unknown>[])
                    : []
                }
              />
            ) : null}

            {activeTab === 'progress' ? (
              <AdminProgressUpdateSection
                projectId={projectId}
                milestones={milestones}
                projectStatus={rawStatus}
              />
            ) : null}

            {activeTab === 'analytics' ? (
              <AdminProjectAnalyticsPanel
                analytics={analyticsQ.data}
                progressAnalytics={progressAnalyticsQ.data}
                isLoading={analyticsQ.isLoading || progressAnalyticsQ.isLoading}
                error={analyticsQ.error ?? progressAnalyticsQ.error}
              />
            ) : null}
          </div>
        </div>
      </AdminQueryState>

      <AdminDuplicateProjectWizard
        projectId={projectId}
        open={templateOpen}
        onOpenChange={setTemplateOpen}
      />
    </div>
  );
}
