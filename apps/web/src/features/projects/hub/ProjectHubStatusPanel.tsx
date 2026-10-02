'use client';

import Link from 'next/link';
import { Activity, FileText, Target } from '@nestlancer/ui/icons';

import { routes } from '@nestlancer/constants';
import { DomainStatusBadge, StatusBadge } from '@nestlancer/ui';

import { WebPanel } from '@/components/web/WebPanel';
import type { DeliverableSummary } from '@/features/projects/hub/deliverable-utils';
import type { MilestoneRow } from '@/lib/client-api-view';
import {
  formatMilestoneStatusLabel,
  isMilestoneFullyApproved,
  milestoneStatusBadgeVariant,
} from '@/lib/milestone-status';

export function ProjectHubStatusPanel({
  projectId,
  projectStatus,
  milestoneRows,
  deliverableSummary,
}: {
  projectId: string;
  projectStatus: string;
  milestoneRows: MilestoneRow[];
  deliverableSummary: DeliverableSummary | null;
}) {
  const milestonesApproved = milestoneRows.filter((m) => isMilestoneFullyApproved(m.status)).length;
  const milestonesInReview = milestoneRows.filter(
    (m) => (m.status ?? '').toUpperCase() === 'COMPLETED'
  ).length;
  const activeMilestone = milestoneRows.find((m) => {
    const s = (m.status ?? '').toUpperCase();
    return s !== 'APPROVED' && s !== 'CANCELLED';
  });

  return (
    <WebPanel padding="md" className="lg:col-span-2">
      <h2 className="text-sm font-semibold">Project status</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Overall contract status, milestone delivery, and file reviews are tracked separately.
      </p>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Project
          </dt>
          <dd className="mt-2">
            <DomainStatusBadge domain="project" status={projectStatus} />
          </dd>
          <dd className="mt-2 text-xs text-muted-foreground">
            Set by your delivery team for the whole engagement.
          </dd>
        </div>

        <div className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Target className="h-3.5 w-3.5" aria-hidden />
            Milestones
          </dt>
          <dd className="mt-2 text-sm font-semibold">
            {milestoneRows.length === 0
              ? 'No delivery milestones yet'
              : `${milestonesApproved}/${milestoneRows.length} approved`}
          </dd>
          {milestoneRows.length > 0 ? (
            <dd className="mt-1 text-xs text-muted-foreground">
              Delivery milestones (payment schedule excluded)
            </dd>
          ) : null}
          {milestonesInReview > 0 ? (
            <dd className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              {milestonesInReview} ready for your approval
            </dd>
          ) : null}
          {activeMilestone ? (
            <dd className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Current:</span>
              <span className="text-xs font-medium">{activeMilestone.title}</span>
              {activeMilestone.status ? (
                <StatusBadge variant={milestoneStatusBadgeVariant(activeMilestone.status)} dot>
                  {formatMilestoneStatusLabel(activeMilestone.status)}
                </StatusBadge>
              ) : null}
            </dd>
          ) : (
            <dd className="mt-2 text-xs text-muted-foreground">
              {milestoneRows.length > 0
                ? 'All delivery milestones approved'
                : 'No active milestone'}
            </dd>
          )}
          {milestoneRows.length > 0 ? (
            <dd className="mt-3">
              <Link
                href={`${routes.project(projectId)}?tab=milestones`}
                className="text-xs font-medium text-primary hover:underline"
              >
                View all milestones
              </Link>
            </dd>
          ) : null}
        </div>

        <div className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Deliverables
          </dt>
          {deliverableSummary ? (
            <>
              <dd className="mt-2 text-sm font-semibold">
                {deliverableSummary.completed}/{deliverableSummary.total} approved
              </dd>
              {deliverableSummary.awaitingReview > 0 ? (
                <dd className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  {deliverableSummary.awaitingReview} awaiting your review
                </dd>
              ) : null}
              {deliverableSummary.pending > 0 ? (
                <dd className="mt-1 text-xs text-muted-foreground">
                  {deliverableSummary.pending} in progress
                </dd>
              ) : null}
            </>
          ) : (
            <dd className="mt-2 text-xs text-muted-foreground">Loading deliverable summary…</dd>
          )}
          <dd className="mt-3">
            <Link
              href={`${routes.project(projectId)}?tab=deliverables`}
              className="text-xs font-medium text-primary hover:underline"
            >
              View deliverables
            </Link>
          </dd>
        </div>

        <div className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Activity className="h-3.5 w-3.5" aria-hidden />
            Daily progress
          </dt>
          <dd className="mt-2 text-sm font-semibold">Team updates</dd>
          <dd className="mt-1 text-xs text-muted-foreground">
            End-of-day work logs and delivery notes from your team.
          </dd>
          <dd className="mt-3">
            <Link
              href={`${routes.project(projectId)}?tab=progress`}
              className="text-xs font-medium text-primary hover:underline"
            >
              View progress timeline
            </Link>
          </dd>
        </div>
      </dl>
    </WebPanel>
  );
}
