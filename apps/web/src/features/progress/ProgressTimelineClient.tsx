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
import { ProgressTimelineView } from '@/features/progress/ProgressTimelineView';
import { useProjectProgressRealtime } from '@nestlancer/websocket';

import { apiServices } from '@/lib/axios';
import { extractTimelineEvents } from '@/lib/client-api-view';

const wsOrigin = typeof process !== 'undefined' ? resolvePublicWsUrl() : '';

/** Legacy full timeline block — prefer ProjectHubProgressTab for new hub UI. */
export function ProgressTimelineClient({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [changeNote, setChangeNote] = useState('');
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

  const handleProgressUpdated = useCallback(() => {
    invalidateTimeline();
    toast.info('Progress updated.');
  }, [invalidateTimeline]);

  useProjectProgressRealtime({
    wsUrl: wsOrigin,
    accessToken,
    projectId,
    enabled: Boolean(accessToken && wsOrigin),
    onProgressUpdated: handleProgressUpdated,
  });

  const timelineQ = useQuery({
    queryKey: queryKeys.projects.timeline(projectId),
    queryFn: () => apiServices.projects.getTimeline(projectId),
  });

  const requestChanges = useMutation({
    mutationFn: () => {
      const reason = changeNote.trim();
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

  const timelineLoading = timelineQ.isPending || (timelineQ.isFetching && timelineQ.data == null);
  const timelineReady = !timelineLoading && !timelineQ.isError;

  return (
    <section className="rounded-xl border border-border bg-card/60 p-5">
      <h2 className="text-base font-semibold">Progress timeline</h2>
      <p className="mt-1 text-xs text-muted-foreground">Delivery updates and change requests.</p>

      {timelineLoading ? <TabPanelSkeleton variant="timeline" /> : null}
      {timelineQ.isError ? (
        <ErrorState
          className="mt-4"
          title="Could not load timeline"
          message={getApiErrorMessage(timelineQ.error)}
          onRetry={() => void timelineQ.refetch()}
        />
      ) : null}

      {timelineReady && events.length === 0 ? (
        <EmptyState
          className="mt-4 border-0 bg-transparent py-4"
          variant="no-data"
          title="No progress entries yet"
          description="Delivery updates from your team will appear on this timeline."
        />
      ) : null}

      {timelineReady && events.length > 0 ? (
        <div className="mt-6">
          <ProgressTimelineView events={events} />
        </div>
      ) : null}

      <div className="mt-6 space-y-3 border-t border-border pt-4">
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
          Request changes
        </Button>
      </div>
    </section>
  );
}
