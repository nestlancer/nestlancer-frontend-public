'use client';

import { usePathname, useRouter, useSearchParams, notFound } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getApiErrorMessage, isNotFoundApiError } from '@nestlancer/api-client';
import { isFeatureEnabled, queryKeys } from '@nestlancer/constants';
import {
  useProjectDetailQuery,
  useProjectMilestonesQuery,
  useProjectProgressQuery,
} from '@/features/projects/hooks/useProjectsApi';
import { cn, ErrorState, Skeleton, SkeletonText } from '@nestlancer/ui';

import { ProjectHubDeliverablesTab } from '@/features/projects/hub/ProjectHubDeliverablesTab';
import { ProjectHubFilesTab } from '@/features/projects/hub/ProjectHubFilesTab';
import { ProjectHubContractStrip } from '@/features/projects/hub/ProjectHubContractStrip';
import { ProjectHubHeader } from '@/features/projects/hub/ProjectHubHeader';
import { ProjectHubMessagesTab } from '@/features/projects/hub/ProjectHubMessagesTab';
import { ProjectHubMilestonesTab } from '@/features/projects/hub/ProjectHubMilestonesTab';
import { ProjectHubOverviewTab } from '@/features/projects/hub/ProjectHubOverviewTab';
import { ProjectHubProgressTab } from '@/features/projects/hub/ProjectHubProgressTab';
import { ProjectHubTabBar } from '@/features/projects/hub/ProjectHubTabBar';
import { parseProjectHubTab, type ProjectHubTab } from '@/features/projects/hub/project-hub-tabs';
import {
  buildClientMilestoneDisplayRows,
  isPaymentScheduleMilestoneName,
} from '@/features/payments/lib/client-milestone-display';
import { buildPaymentMilestoneMap } from '@/features/payments/lib/payment-milestone-map';
import { useProjectMilestonesQuery as usePaymentMilestonesQuery } from '@/features/payments/hooks/usePaymentsApi';
import { apiServices } from '@/lib/axios';
import { asRecord, extractMilestoneRows, extractProgressView } from '@/lib/client-api-view';
import { isMilestonePayable } from '@/lib/milestone-status';

export function ProjectDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = parseProjectHubTab(searchParams.get('tab'));
  const showContractStrip = isFeatureEnabled('projectHubContractStrip', true);

  const setTab = useCallback(
    (tab: ProjectHubTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'overview') {
        params.delete('tab');
      } else {
        params.set('tab', tab);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const project = useProjectDetailQuery(id);
  const milestonesEnabled = Boolean(id) && project.isSuccess;
  const milestones = useProjectMilestonesQuery(id, milestonesEnabled);
  const progress = useProjectProgressQuery(id, milestonesEnabled);

  const progressStatus = useQuery({
    queryKey: queryKeys.progress.status(id),
    queryFn: () => apiServices.progress.getProjectStatus(id),
    enabled: Boolean(id) && project.isSuccess,
  });

  const paymentMilestones = usePaymentMilestonesQuery(id, milestonesEnabled);
  const paymentMetaByMilestone = useMemo(
    () => buildPaymentMilestoneMap(paymentMilestones.data),
    [paymentMilestones.data]
  );

  const milestoneRows = useMemo(() => {
    const fromMilestones = milestones.data != null ? extractMilestoneRows(milestones.data) : [];
    if (fromMilestones.length > 0) return fromMilestones;
    if (progress.data != null) return extractProgressView(progress.data).milestones;
    return [];
  }, [milestones.data, progress.data]);

  const displayMilestoneRows = useMemo(
    () => buildClientMilestoneDisplayRows(milestoneRows, paymentMetaByMilestone),
    [milestoneRows, paymentMetaByMilestone]
  );

  const progressView = useMemo(
    () =>
      progress.data != null
        ? extractProgressView(progress.data)
        : { percent: null, milestones: [], updates: [] },
    [progress.data]
  );

  const statusSummary = useMemo(() => {
    const raw = progressStatus.data;
    if (!raw || typeof raw !== 'object') return null;
    const d =
      'data' in raw && raw.data && typeof raw.data === 'object'
        ? (raw.data as Record<string, unknown>)
        : (raw as Record<string, unknown>);
    const pct = d.percentageComplete ?? d.percentComplete;
    return typeof pct === 'number' ? pct : Number(pct) || null;
  }, [progressStatus.data]);

  const deliveryDisplayRows = useMemo(
    () => displayMilestoneRows.filter((entry) => !entry.isPayOnly && !entry.isDeposit),
    [displayMilestoneRows]
  );

  const milestonesCompleted = deliveryDisplayRows.filter((entry) => {
    const s = (entry.row.status ?? '').toUpperCase();
    return s === 'APPROVED';
  }).length;

  const projectExtra = project.data ? asRecord(project.data as unknown) : null;
  const budgetRaw = projectExtra?.budget ?? projectExtra?.totalAmount;
  const budgetPaise = typeof budgetRaw === 'number' ? budgetRaw : undefined;

  const nextDeliveryMilestone = deliveryDisplayRows.find((entry) => {
    const s = (entry.row.status ?? '').toUpperCase();
    return s !== 'APPROVED' && s !== 'CANCELLED';
  })?.row;

  const nextMilestone =
    nextDeliveryMilestone ??
    displayMilestoneRows.find((entry) => {
      const s = (entry.row.status ?? '').toUpperCase();
      return s !== 'APPROVED' && s !== 'COMPLETED' && s !== 'CANCELLED';
    })?.row;

  // Overview KPI must match delivery milestones (exclude payment schedule) — NL-BUG-UI-018.
  const overviewMilestoneRows = useMemo(() => {
    if (deliveryDisplayRows.length > 0) {
      return deliveryDisplayRows.map((entry) => entry.row);
    }
    return milestoneRows.filter(
      (row) => !isPaymentScheduleMilestoneName(row.title, row.percentage)
    );
  }, [deliveryDisplayRows, milestoneRows]);

  const payableEntry = displayMilestoneRows.find((entry) =>
    isMilestonePayable({
      status: entry.row.status,
      amountPaise: entry.payAmountPaise ?? entry.row.amount,
      order: entry.row.order,
      paymentStatus: entry.paymentMeta?.paymentStatus,
      paymentRequestedAt: entry.paymentMeta?.paymentRequestedAt,
      isDeposit: entry.isDeposit,
      isPayOnly: entry.isPayOnly,
      isLocked: entry.isLocked,
      canPay: entry.canPay,
    })
  );
  const payableMilestone = payableEntry?.row;

  // NL-BUG-MS-005: label + amount must come from the same payable installment.
  const nextPayLabel = payableEntry
    ? String(
        payableEntry.linkedInstallmentLabel ??
          payableEntry.row.title ??
          payableMilestone?.title ??
          ''
      ).trim() || undefined
    : nextMilestone?.title != null
      ? String(nextMilestone.title)
      : undefined;
  const nextPayPaise = payableEntry
    ? typeof payableEntry.payAmountPaise === 'number'
      ? payableEntry.payAmountPaise
      : typeof payableMilestone?.amount === 'number'
        ? payableMilestone.amount
        : undefined
    : undefined;

  if (project.isError || (!project.isPending && !project.data)) {
    // NL-BUG-UI-015: missing entity → soft 404, not empty authenticated chrome.
    if (!project.error || isNotFoundApiError(project.error)) {
      notFound();
      return null;
    }
    return (
      <ErrorState
        message={getApiErrorMessage(project.error, 'Could not load project')}
        onRetry={() => void project.refetch()}
      />
    );
  }

  const p = project.data;
  const showChromeSkeleton = project.isPending || !p;

  return (
    <div className="space-y-8">
      {showChromeSkeleton ? (
        <div className="space-y-6" aria-busy="true" aria-label="Loading project">
          <Skeleton className="h-9 w-2/3 max-w-md" />
          <SkeletonText lines={2} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ) : (
        <ProjectHubHeader
          project={p}
          percentComplete={statusSummary ?? progressView.percent}
          milestonesCompleted={milestonesCompleted}
          milestonesTotal={
            deliveryDisplayRows.length > 0
              ? deliveryDisplayRows.length
              : displayMilestoneRows.length
          }
          budgetPaise={budgetPaise}
          currency={projectExtra?.currency != null ? String(projectExtra.currency) : 'INR'}
        />
      )}

      <div
        className={cn(
          'sticky top-0 z-20 -mx-4 mb-6 border-b border-gray-200 sm:-mx-6 lg:-mx-8',
          'bg-gray-50 px-4 sm:px-6 dark:border-gray-800 dark:bg-gray-950 lg:px-8'
        )}
      >
        {showContractStrip && !showChromeSkeleton && p ? (
          <ProjectHubContractStrip
            projectId={id}
            status={p.status}
            percentComplete={statusSummary ?? progressView.percent}
            nextMilestoneLabel={nextPayLabel}
            nextPaymentPaise={nextPayPaise}
            currency={projectExtra?.currency != null ? String(projectExtra.currency) : 'INR'}
            payableMilestoneId={payableEntry?.payMilestoneId ?? payableMilestone?.id}
            payablePaymentId={payableEntry?.paymentMeta?.paymentId}
          />
        ) : null}

        <ProjectHubTabBar active={activeTab} onChange={setTab} />
      </div>

      <div
        role="tabpanel"
        id={`project-panel-${activeTab}`}
        aria-labelledby={`project-tab-${activeTab}`}
        className="animate-fade-in motion-reduce:animate-none"
      >
        {showChromeSkeleton ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-8 w-48" />
            <SkeletonText lines={4} />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : p ? (
          <>
            {activeTab === 'overview' ? (
              <ProjectHubOverviewTab
                projectId={id}
                projectStatus={p.status}
                milestoneRows={overviewMilestoneRows}
              />
            ) : null}
            {/* Keep progress mounted to avoid cold-load empty flash (NL-PROG-002). */}
            <div
              className={activeTab === 'progress' ? undefined : 'hidden'}
              hidden={activeTab !== 'progress'}
              aria-hidden={activeTab !== 'progress'}
            >
              <ProjectHubProgressTab projectId={id} />
            </div>
            {activeTab === 'milestones' ? (
              <ProjectHubMilestonesTab
                projectId={id}
                rows={milestoneRows}
                isPending={
                  (milestones.isPending || progress.isPending) && milestoneRows.length === 0
                }
                isError={milestones.isError && progress.isError && milestoneRows.length === 0}
                errorMessage={getApiErrorMessage(
                  milestones.error ?? progress.error,
                  'Could not load milestones'
                )}
              />
            ) : null}
            {activeTab === 'deliverables' ? (
              <ProjectHubDeliverablesTab projectId={id} milestoneRows={milestoneRows} />
            ) : null}
            {activeTab === 'messages' ? <ProjectHubMessagesTab projectId={id} /> : null}
            {activeTab === 'files' ? <ProjectHubFilesTab projectId={id} /> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
