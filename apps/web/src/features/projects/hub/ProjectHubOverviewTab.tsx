'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { routes } from '@nestlancer/constants';
import { queryKeys } from '@nestlancer/constants';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, ErrorState } from '@nestlancer/ui';

import { TabPanelSkeleton } from '@/components/common/TabPanelSkeleton';
import { WebPanel } from '@/components/web/WebPanel';

import { ProgressTimelineView } from '@/features/progress/ProgressTimelineView';
import { extractDeliverableSummary } from '@/features/projects/hub/deliverable-utils';
import { ProjectHubStatusPanel } from '@/features/projects/hub/ProjectHubStatusPanel';
import { apiServices } from '@/lib/axios';
import { invalidateByAction } from '@/lib/invalidate-queries';
import {
  extractProgressView,
  extractTimelineEvents,
  type MilestoneRow,
} from '@/lib/client-api-view';
import { canClientActOnProject } from '@/lib/project-status';
import { webPrimaryButtonClass } from '@/lib/tailadmin-classes';

export function ProjectHubOverviewTab({
  projectId,
  projectStatus,
  milestoneRows,
}: {
  projectId: string;
  projectStatus?: string;
  milestoneRows: MilestoneRow[];
}) {
  const qc = useQueryClient();
  const [revisionNote, setRevisionNote] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

  const progress = useQuery({
    queryKey: queryKeys.projects.progress(projectId),
    queryFn: () => apiServices.projects.getProgress(projectId),
  });

  const timeline = useQuery({
    queryKey: queryKeys.projects.timeline(projectId),
    queryFn: () => apiServices.projects.getTimeline(projectId),
  });

  const deliverables = useQuery({
    queryKey: [...queryKeys.projects.detail(projectId), 'deliverables'],
    queryFn: () => apiServices.projects.getDeliverables(projectId),
  });

  const progressView =
    progress.data != null
      ? extractProgressView(progress.data)
      : { percent: null, milestones: [], updates: [] };

  const timelinePreview =
    timeline.data != null
      ? extractTimelineEvents(timeline.data).filter((ev) => ev.type !== 'projectCreated')
      : [];

  const deliverableSummary =
    deliverables.data != null ? extractDeliverableSummary(deliverables.data) : null;

  const canAct = canClientActOnProject(projectStatus);

  const approveM = useMutation({
    mutationFn: () =>
      apiServices.projects.approve(projectId, {
        rating: 5,
        feedback: {
          quality: 5,
          communication: 5,
          timeliness: 5,
          professionalism: 5,
          overallSatisfaction: 5,
        },
      }),
    onSuccess: async () => {
      toast.success('Project approved');
      await invalidateByAction(qc, 'projects.approve', projectId);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const revisionM = useMutation({
    mutationFn: () => {
      const note = revisionNote.trim();
      return apiServices.projects.requestRevision(projectId, {
        area: 'Delivery',
        priority: 'medium',
        description: note,
        details: note ? [note] : ['Revision requested by client'],
      });
    },
    onSuccess: () => {
      toast.success('Revision requested');
      setRevisionNote('');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const feedbackM = useMutation({
    mutationFn: () => {
      const text = feedbackText.trim();
      return apiServices.projects.submitFeedback(projectId, {
        title: 'Client feedback',
        feedback: text,
      });
    },
    onSuccess: () => {
      toast.success('Feedback submitted');
      setFeedbackText('');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProjectHubStatusPanel
        projectId={projectId}
        projectStatus={projectStatus ?? ''}
        milestoneRows={milestoneRows}
        deliverableSummary={deliverableSummary}
      />

      {canAct ? (
        <WebPanel padding="md" className="lg:col-span-2">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className={webPrimaryButtonClass}
              disabled={approveM.isPending}
              onClick={() => approveM.mutate()}
            >
              Approve delivery
            </Button>
            <div className="flex min-w-[200px] flex-1 flex-wrap items-end gap-2">
              <div className="min-w-[160px] flex-1">
                <FormFieldLabel fieldKey="projects.revisionNotes" label="Revision notes">
                  Revision notes
                </FormFieldLabel>
                <input
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="What should change before you approve"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={!revisionNote.trim() || revisionM.isPending}
                onClick={() => revisionM.mutate()}
              >
                Request revision
              </Button>
            </div>
          </div>
        </WebPanel>
      ) : null}

      <WebPanel padding="md" className="lg:col-span-2">
        <div className="mb-4 flex flex-row items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Latest progress</h2>
            <p className="text-xs text-muted-foreground">
              Recent daily updates from your delivery team.
            </p>
          </div>
          <Link
            href={`${routes.project(projectId)}?tab=progress`}
            className="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            View all progress
          </Link>
        </div>
        {timeline.isPending ? (
          <TabPanelSkeleton variant="timeline" />
        ) : timeline.isError ? (
          <ErrorState
            title="Could not load progress"
            message={getApiErrorMessage(timeline.error)}
            onRetry={() => void timeline.refetch()}
          />
        ) : timelinePreview.length === 0 ? (
          <p className="text-sm text-muted-foreground">No progress entries yet.</p>
        ) : (
          <ProgressTimelineView events={timelinePreview} compact />
        )}
      </WebPanel>

      <WebPanel padding="md">
        <h2 className="text-sm font-semibold">Recent updates</h2>
        <p className="mb-4 text-xs text-muted-foreground">Summary from the progress feed.</p>
        {progress.isPending ? (
          <TabPanelSkeleton variant="list" />
        ) : progress.isError ? (
          <ErrorState
            title="Could not load updates"
            message={getApiErrorMessage(progress.error)}
            onRetry={() => void progress.refetch()}
          />
        ) : progressView.updates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent progress entries.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border/80">
            {progressView.updates.slice(0, 3).map((u, i) => (
              <li key={`${u.title}-${i}`} className="px-4 py-3">
                <p className="text-sm font-medium">{u.title}</p>
                {u.detail ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{u.detail}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">{u.when}</p>
              </li>
            ))}
          </ul>
        )}
      </WebPanel>

      <WebPanel padding="md" className="space-y-3 lg:col-span-2 lg:max-w-xl">
        <div>
          <h2 className="text-sm font-semibold">Submit feedback</h2>
          <p className="text-xs text-muted-foreground">Share notes with your delivery team.</p>
        </div>
        <FormFieldLabel fieldKey="projects.revisionNotes" label="Your feedback">
          Your feedback
        </FormFieldLabel>
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Share your feedback…"
          className="min-h-[100px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <Button
          type="button"
          className={webPrimaryButtonClass}
          disabled={!feedbackText.trim() || feedbackM.isPending}
          onClick={() => feedbackM.mutate()}
        >
          Submit feedback
        </Button>
      </WebPanel>
    </div>
  );
}
