'use client';

import {
  asArray,
  peelSuccessEnvelope,
  projectsProjectsControllerGetProjectByQuoteId,
  useGatewayProjectsControllerGetProgress,
  useProjectsProjectsControllerApproveProject,
  useProjectsProjectsControllerGetDeliverables,
  useProjectsProjectsControllerGetMilestones,
  useProjectsProjectsControllerGetProjectDetails,
  useProjectsProjectsControllerGetStats,
  useProjectsProjectsControllerGetTimeline,
  useProjectsProjectsControllerListProjects,
  useProjectsProjectsControllerRequestRevision,
  useProjectsProjectsControllerSubmitFeedback,
} from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import type { Project, ProjectSummary, UserProjectStats } from '@nestlancer/types';

export function useProjectsListQuery(enabled = true) {
  return useProjectsProjectsControllerListProjects<ProjectSummary[]>({
    query: {
      enabled,
      queryKey: queryKeys.projects.all,
      select: (data) => asArray<ProjectSummary>(data),
    },
  });
}

export function useProjectsStatsQuery() {
  return useProjectsProjectsControllerGetStats({
    query: {
      queryKey: queryKeys.projects.stats,
      select: (data) => data as unknown as UserProjectStats,
    },
  });
}

export function useProjectDetailQuery(id: string) {
  return useProjectsProjectsControllerGetProjectDetails(id, {
    query: {
      queryKey: queryKeys.projects.detail(id),
      select: (data) => {
        const peeled = peelSuccessEnvelope(data) as Project | null;
        return (peeled ?? data) as unknown as Project;
      },
    },
  });
}

export function useProjectMilestonesQuery(id: string, enabled: boolean) {
  return useProjectsProjectsControllerGetMilestones(id, {
    query: {
      enabled,
      queryKey: queryKeys.projects.milestones(id),
      select: (data) => peelSuccessEnvelope(data),
    },
  });
}

export function useProjectProgressQuery(id: string, enabled: boolean) {
  return useGatewayProjectsControllerGetProgress(id, {
    query: {
      enabled,
      queryKey: queryKeys.projects.progress(id),
      select: (data) => peelSuccessEnvelope(data),
    },
  });
}

export function useProjectTimelineQuery(id: string, enabled: boolean) {
  return useProjectsProjectsControllerGetTimeline(id, {
    query: {
      enabled,
      queryKey: queryKeys.projects.timeline(id),
      select: (data) => peelSuccessEnvelope(data),
    },
  });
}

export function useProjectDeliverablesQuery(id: string, enabled: boolean) {
  return useProjectsProjectsControllerGetDeliverables(id, {
    query: {
      enabled,
      queryKey: [...queryKeys.projects.detail(id), 'deliverables'],
      select: (data) => peelSuccessEnvelope(data),
    },
  });
}

/** Imperative poll after quote accept (async project creation + sync fallback). */
const POLL_INITIAL_DELAY_MS = 500;
const POLL_INTERVAL_MS = 1000;
const POLL_MAX_ATTEMPTS = 30;

export async function fetchProjectIdByQuoteId(quoteId: string): Promise<string | null> {
  try {
    const data = await projectsProjectsControllerGetProjectByQuoteId(quoteId);
    const body = peelSuccessEnvelope(data) as { projectId?: string; error?: unknown };
    if (body && typeof body === 'object' && 'error' in body && body.error) return null;
    if (body?.projectId) return String(body.projectId);
    return null;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw err;
  }
}

/** Poll until project exists after quote accept (handles async provisioning race). */
export async function pollProjectIdByQuoteId(quoteId: string): Promise<string | null> {
  await new Promise((resolve) => setTimeout(resolve, POLL_INITIAL_DELAY_MS));
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    const projectId = await fetchProjectIdByQuoteId(quoteId);
    if (projectId) return projectId;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return null;
}

export {
  useProjectsProjectsControllerApproveProject as useApproveProjectMutation,
  useProjectsProjectsControllerRequestRevision as useRequestProjectRevisionMutation,
  useProjectsProjectsControllerSubmitFeedback as useSubmitProjectFeedbackMutation,
};
