'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileArchive, FileText, Image as ImageIcon } from '@nestlancer/ui/icons';
import { useMemo, useState } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, EmptyState, ErrorState, StatusBadge } from '@nestlancer/ui';

import { TabPanelSkeleton } from '@/components/common/TabPanelSkeleton';
import { WebPanel } from '@/components/web/WebPanel';

import { apiServices } from '@/lib/axios';
import type { MilestoneRow } from '@/lib/client-api-view';
import { invalidateByAction } from '@/lib/invalidate-queries';
import {
  canClientReviewDeliverable,
  deliverableStatusBadgeVariant,
  extractDeliverables,
  formatDeliverableStatusLabel,
  groupDeliverablesByMilestone,
} from '@/features/projects/hub/deliverable-utils';
import { DeliverableFileAction } from '@/features/projects/hub/DeliverableFileAction';
import { webPrimaryButtonClass } from '@/lib/tailadmin-classes';

function deliverableIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes('.zip') || lower.includes('.rar')) {
    return <FileArchive className="h-5 w-5" aria-hidden />;
  }
  if (lower.match(/\.(png|jpg|jpeg|gif|webp|svg|fig)$/)) {
    return <ImageIcon className="h-5 w-5" aria-hidden />;
  }
  return <FileText className="h-5 w-5" aria-hidden />;
}

export function ProjectHubDeliverablesTab({
  projectId,
  milestoneRows,
}: {
  projectId: string;
  milestoneRows: MilestoneRow[];
}) {
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [previewedIds, setPreviewedIds] = useState<Set<string>>(() => new Set());

  const deliverables = useQuery({
    queryKey: [...queryKeys.projects.detail(projectId), 'deliverables'],
    queryFn: () => apiServices.projects.getDeliverables(projectId),
  });

  const rows = extractDeliverables(deliverables.data);

  const milestoneLabels = useMemo(
    () => new Map(milestoneRows.map((m) => [m.id, m.title])),
    [milestoneRows]
  );

  const grouped = useMemo(() => {
    const groups = groupDeliverablesByMilestone(rows, milestoneLabels);
    const orderMap = new Map(milestoneRows.map((m, i) => [m.id, m.order ?? i]));
    return groups.sort((a, b) => {
      if (a.milestoneId === 'unassigned') return 1;
      if (b.milestoneId === 'unassigned') return -1;
      return (orderMap.get(a.milestoneId) ?? 999) - (orderMap.get(b.milestoneId) ?? 999);
    });
  }, [rows, milestoneLabels, milestoneRows]);

  const approveDeliverableM = useMutation({
    mutationFn: (deliverableId: string) =>
      apiServices.progress.approveDeliverable(deliverableId, {}),
    onSuccess: async () => {
      toast.success('Deliverable approved');
      await invalidateByAction(qc, 'progress.milestone', projectId);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not approve deliverable')),
  });

  const rejectDeliverableM = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiServices.progress.rejectDeliverable(id, { reason }),
    onSuccess: async () => {
      toast.success('Deliverable rejected');
      setRejectTarget(null);
      setRejectReason('');
      await invalidateByAction(qc, 'progress.milestone', projectId);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not reject deliverable')),
  });

  if (deliverables.isPending) {
    return <TabPanelSkeleton variant="list" />;
  }

  if (deliverables.isError) {
    return (
      <ErrorState
        title="Could not load deliverables"
        message={getApiErrorMessage(deliverables.error)}
        onRetry={() => void deliverables.refetch()}
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No deliverables yet"
        description="Files and assets from your team will appear here when uploaded."
        icon={<FileText className="h-6 w-6" aria-hidden />}
      />
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <section key={group.milestoneId} className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">{group.milestoneLabel}</h2>
            <p className="text-xs text-muted-foreground">
              {group.items.length} deliverable{group.items.length === 1 ? '' : 's'}
            </p>
          </div>
          <ul className="space-y-3">
            {group.items.map((d) => {
              const milestoneStatus =
                milestoneRows.find((m) => m.id === group.milestoneId)?.status ?? null;
              return (
                <li key={d.id}>
                  <WebPanel padding="sm">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md,0.625rem)] bg-muted text-muted-foreground">
                        {deliverableIcon(d.label)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{d.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDeliverableStatusLabel(d.status)}
                        </p>
                        {d.files.length > 0 ? (
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {d.files.map((f, idx) => (
                              <li key={`${d.id}-file-${idx}`}>
                                <DeliverableFileAction
                                  file={f}
                                  className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                                  onPreviewed={() =>
                                    setPreviewedIds((prev) => {
                                      const next = new Set(prev);
                                      next.add(d.id);
                                      return next;
                                    })
                                  }
                                >
                                  Preview {f.label}
                                </DeliverableFileAction>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                      {d.status ? (
                        <StatusBadge variant={deliverableStatusBadgeVariant(d.status)} dot>
                          {formatDeliverableStatusLabel(d.status)}
                        </StatusBadge>
                      ) : null}
                      {canClientReviewDeliverable(d.status, milestoneStatus) ? (
                        <div className="flex flex-col items-end gap-1">
                          {d.files.length > 0 && !previewedIds.has(d.id) ? (
                            <p className="text-[11px] text-muted-foreground">
                              Preview files before accepting
                            </p>
                          ) : null}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className={webPrimaryButtonClass}
                              disabled={
                                approveDeliverableM.isPending ||
                                (d.files.length > 0 && !previewedIds.has(d.id))
                              }
                              onClick={() => approveDeliverableM.mutate(d.id)}
                            >
                              Accept
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRejectTarget(d.id);
                                setRejectReason('');
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </WebPanel>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {rejectTarget ? (
        <WebPanel padding="sm" className="space-y-3">
          <FormFieldLabel fieldKey="projects.rejectionReason" label="Rejection reason">
            Reason for rejection
          </FormFieldLabel>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="e.g. Logo files are the old version"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={rejectDeliverableM.isPending}
              onClick={() =>
                rejectDeliverableM.mutate({
                  id: rejectTarget,
                  reason: rejectReason.trim() || 'Rejected by client',
                })
              }
            >
              Confirm reject
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
          </div>
        </WebPanel>
      ) : null}
    </div>
  );
}
