'use client';

import { resolvePublicWsUrl } from '@nestlancer/config';
import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { getAccessToken, subscribeToTokens } from '@nestlancer/auth';
import { queryKeys } from '@nestlancer/constants';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, EmptyState, ErrorState } from '@nestlancer/ui';

import { TabPanelSkeleton } from '@/components/common/TabPanelSkeleton';
import { WebPanel } from '@/components/web/WebPanel';
import {
  ProgressTimelineView,
  type ProgressTimelineFilter,
} from '@/features/progress/ProgressTimelineView';
import { useProjectProgressRealtime } from '@nestlancer/websocket';

import { apiServices } from '@/lib/axios';
import { extractTimelineEvents } from '@/lib/client-api-view';

export function ProjectHubProgressTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ProgressTimelineFilter>('all');
  const [changeNote, setChangeNote] = useState('');
  // Resolve inside the component so a missing env cannot crash the project hub module.
  const [wsOrigin] = useState(() => {
    try {
      return resolvePublicWsUrl();
    } catch {
      return '';
    }
  });
  const [accessToken, setAccessToken] = useState<string | undefined>(
    () => getAccessToken() ?? undefined
  );

  useEffect(() => {
    setAccessToken(getAccessToken() ?? undefined);
    return subscribeToTokens((t) => setAccessToken(t?.accessToken ?? undefined));
  }, []);

  const invalidateTimeline = useCallback(() => {
    void qc.invalidateQueries({ queryKey: queryKeys.projects.timeline(projectId) });
    void qc.invalidateQueries({ queryKey: queryKeys.projects.progress(projectId) });
  }, [qc, projectId]);

  useProjectProgressRealtime({
    wsUrl: wsOrigin,
    accessToken,
    projectId,
    enabled: Boolean(accessToken && wsOrigin),
    onProgressUpdated: () => {
      invalidateTimeline();
      toast.info('Progress updated.');
    },
  });

  const timelineQ = useQuery({
    queryKey: queryKeys.projects.timeline(projectId),
    queryFn: () => apiServices.projects.getTimeline(projectId),
  });

  const requestChanges = useMutation({
    mutationFn: () => {
      const reason = changeNote.trim();
      // NL-UI-013: send reason only — duplicating into details caused title+bullet echo.
      return apiServices.progress.requestProjectChanges(projectId, {
        reason,
      });
    },
    onSuccess: () => {
      toast.success('Change request sent');
      setChangeNote('');
      invalidateTimeline();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not request changes')),
  });

  const events =
    timelineQ.data != null
      ? extractTimelineEvents(timelineQ.data).filter((ev) => ev.type !== 'projectCreated')
      : [];

  // NL-PROG-002: keep skeleton until feed has data or a settled empty response.
  const timelineLoading =
    timelineQ.isPending || (timelineQ.isFetching && events.length === 0 && !timelineQ.isError);
  const timelineReady = !timelineLoading && !timelineQ.isError;

  return (
    <div className="space-y-6">
      <WebPanel padding="md">
        <h2 className="text-sm font-semibold">Daily progress</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          End-of-day updates from your delivery team, grouped by date.
        </p>

        {timelineLoading ? (
          <div className="mt-4">
            <TabPanelSkeleton variant="timeline" />
          </div>
        ) : null}
        {timelineQ.isError ? (
          <ErrorState
            className="mt-4"
            title="Could not load progress"
            message={getApiErrorMessage(timelineQ.error)}
            onRetry={() => void timelineQ.refetch()}
          />
        ) : null}

        {timelineReady && events.length === 0 ? (
          <EmptyState
            className="mt-4 border-0 bg-transparent py-4"
            variant="no-data"
            title="No progress entries yet"
            description="Your team will post daily updates here as work continues."
          />
        ) : null}

        {timelineReady && events.length > 0 ? (
          <div className="mt-6">
            <ProgressTimelineView
              events={events}
              filter={filter}
              showFilters
              onFilterChange={setFilter}
            />
          </div>
        ) : null}
      </WebPanel>

      <WebPanel padding="md">
        <h2 className="text-sm font-semibold">Request changes</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Ask your team to adjust scope or delivery based on recent progress.
        </p>
        {timelineLoading ? (
          <div className="mt-4">
            <TabPanelSkeleton variant="list" />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <FormFieldLabel fieldKey="progress.changeReason" label="Request changes">
              Request changes
            </FormFieldLabel>
            <textarea
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="Describe what should change…"
              className="min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              disabled={!changeNote.trim() || requestChanges.isPending}
              onClick={() => requestChanges.mutate()}
            >
              {requestChanges.isPending ? 'Sending…' : 'Send request'}
            </Button>
          </div>
        )}
      </WebPanel>
    </div>
  );
}
