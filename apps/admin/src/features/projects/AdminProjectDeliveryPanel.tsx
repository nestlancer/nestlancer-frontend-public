'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { formatIsoDate, safeHttpUrl } from '@nestlancer/utils';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { FormFieldLabel } from '@nestlancer/field-help';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  StatusBadge,
} from '@nestlancer/ui';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { AdminQueryState, AdminSection } from '@/components/admin/AdminConsolePrimitives';
import { TimeEntriesPanel } from '@/features/payments/TimeEntriesPanel';
import { formatPaymentStatusLabel } from '@/features/payments/payment-hub-utils';
import { adminKeys } from '@/lib/admin-query-keys';
import { formatAdminStatus, projectStatusTone } from '@/lib/admin-response';
import { resolvePaymentStatusVariant } from '@/lib/admin-status';
import { apiServices } from '@/lib/axios';

type MilestoneRecord = Record<string, unknown>;
type DeliverableRecord = Record<string, unknown>;

type DeliverableFileLink = { url: string; label: string; mediaId?: string };

/** Latest payment status for a milestone, preferring COMPLETED over in-flight rows. */
function latestPaymentStatusForMilestone(
  milestoneId: string,
  payments: Record<string, unknown>[]
): string | null {
  const rows = payments.filter((p) => String(p.milestoneId ?? '') === milestoneId);
  if (rows.length === 0) return null;
  const rank = (s: string) => {
    const u = s.toUpperCase();
    if (u === 'COMPLETED' || u === 'PAID' || u === 'SUCCESS') return 5;
    if (u === 'PROCESSING' || u === 'PENDING_VERIFICATION') return 4;
    if (u === 'PENDING' || u === 'CREATED') return 3;
    if (u === 'FAILED') return 2;
    if (u === 'REFUNDED') return 1;
    return 0;
  };
  let best: Record<string, unknown> | null = null;
  let bestRank = -1;
  for (const row of rows) {
    const status = String(row.status ?? '');
    const r = rank(status);
    if (r > bestRank) {
      bestRank = r;
      best = row;
    }
  }
  return best ? String(best.status ?? '') : null;
}

function parseDeliverableFiles(d: DeliverableRecord): DeliverableFileLink[] {
  const mediaUrls = Array.isArray(d.mediaUrls) ? (d.mediaUrls as unknown[]) : [];
  const media = Array.isArray(d.media) ? (d.media as unknown[]) : [];
  const raw = media.length > 0 ? media : mediaUrls;

  return raw
    .map((entry, i) => {
      if (typeof entry === 'string') {
        return entry.startsWith('http') ? { url: entry, label: `File ${i + 1}` } : null;
      }
      if (!entry || typeof entry !== 'object') return null;
      const row = entry as Record<string, unknown>;
      const url = row.url != null ? String(row.url) : '';
      const mediaId =
        row.mediaId != null
          ? String(row.mediaId)
          : row.id != null && !url
            ? String(row.id)
            : undefined;
      const label = String(row.label ?? row.filename ?? row.name ?? `File ${i + 1}`);
      if (!url && !mediaId) return null;
      return { url, label, mediaId };
    })
    .filter((x): x is DeliverableFileLink => x != null);
}

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function plusDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultMilestoneForm() {
  return {
    msName: '',
    msStart: todayIsoDate(),
    msEnd: plusDaysIso(14),
    msAmountRupees: '',
  };
}

function defaultDeliverableForm(milestoneId: string) {
  return {
    delMilestoneId: milestoneId,
    delMediaIds: '',
    delDescription: '',
  };
}

export function AdminProjectDeliveryPanel({
  projectId,
  projectStatus,
  milestones,
  milestoneOptions,
  deliverables,
  deliverablesLoading,
  deliverablesError,
  payments = [],
}: {
  projectId: string;
  projectStatus?: string;
  milestones: MilestoneRecord[];
  milestoneOptions: { id: string; name: string }[];
  deliverables: DeliverableRecord[];
  deliverablesLoading: boolean;
  deliverablesError: unknown;
  /** Project payments — used to show Paid vs Pending on pay-only milestones (NL-BUG-MS-004). */
  payments?: Record<string, unknown>[];
}) {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();

  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [deliverableDialogOpen, setDeliverableDialogOpen] = useState(false);
  const [rejectDeliverableId, setRejectDeliverableId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [milestoneForm, setMilestoneForm] = useState(defaultMilestoneForm);
  const [deliverableForm, setDeliverableForm] = useState(() =>
    defaultDeliverableForm(milestoneOptions[0]?.id ?? '')
  );

  const completeMilestoneM = useMutation({
    mutationFn: (milestoneId: string) => apiServices.admin.completeMilestone(milestoneId),
    onSuccess: () => {
      toast.success('Milestone submitted for client approval.');
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'project', projectId] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not complete milestone')),
  });

  const createMilestoneM = useMutation({
    mutationFn: () => {
      const amountPaise = milestoneForm.msAmountRupees.trim()
        ? Math.round(parseFloat(milestoneForm.msAmountRupees) * 100)
        : undefined;
      return apiServices.admin.createProjectMilestone(projectId, {
        name: milestoneForm.msName.trim(),
        startDate: milestoneForm.msStart,
        endDate: milestoneForm.msEnd,
        dueDate: milestoneForm.msEnd,
        ...(amountPaise != null && amountPaise > 0 ? { amount: amountPaise } : {}),
      });
    },
    onSuccess: () => {
      toast.success('Milestone created');
      setMilestoneDialogOpen(false);
      setMilestoneForm(defaultMilestoneForm());
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'project', projectId] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create milestone')),
  });

  const { upload: uploadDeliverableFile, isUploading: deliverableFileUploading } = useMediaUpload({
    onSuccess: ({ mediaId }) => {
      setDeliverableForm((prev) => {
        const ids = prev.delMediaIds
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (ids.includes(mediaId)) return prev;
        return { ...prev, delMediaIds: [...ids, mediaId].join(', ') };
      });
    },
  });

  const deliverablesQueryKey = [...adminKeys.root, 'project', projectId, 'deliverables'] as const;

  const refreshDeliverables = () =>
    qc.refetchQueries({ queryKey: deliverablesQueryKey, type: 'active' });

  const uploadDeliverableM = useMutation({
    mutationFn: () => {
      const mediaIds = deliverableForm.delMediaIds
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (!deliverableForm.delMilestoneId) throw new Error('Select a milestone');
      if (mediaIds.length === 0) throw new Error('Upload at least one file or enter a media UUID');
      return apiServices.admin.uploadProjectDeliverable(projectId, {
        milestoneId: deliverableForm.delMilestoneId,
        mediaIds,
        description: deliverableForm.delDescription.trim() || undefined,
      });
    },
    onSuccess: async () => {
      toast.success('Deliverable uploaded');
      setDeliverableDialogOpen(false);
      setDeliverableForm(defaultDeliverableForm(milestoneOptions[0]?.id ?? ''));
      await refreshDeliverables();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not upload deliverable')),
  });

  const deleteDeliverableM = useMutation({
    mutationFn: (deliverableId: string) => apiServices.admin.deleteDeliverable(deliverableId),
    onSuccess: async () => {
      toast.success('Deliverable removed.');
      await refreshDeliverables();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not delete deliverable')),
  });

  const updateDeliverableM = useMutation({
    mutationFn: ({
      id,
      status: s,
      rejectionReason,
    }: {
      id: string;
      status: string;
      rejectionReason?: string;
    }) =>
      apiServices.admin.updateDeliverable(id, {
        status: s,
        ...(rejectionReason?.trim() ? { rejectionReason: rejectionReason.trim() } : {}),
      }),
    onSuccess: async (_, { status: s }) => {
      toast.success(`Deliverable ${s === 'APPROVED' ? 'approved' : 'rejected'}.`);
      await refreshDeliverables();
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'project', projectId] });
      void qc.invalidateQueries({ queryKey: adminKeys.milestones() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update deliverable')),
  });

  const openDeliverableDialog = () => {
    setDeliverableForm(defaultDeliverableForm(milestoneOptions[0]?.id ?? ''));
    setDeliverableDialogOpen(true);
  };

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-2">
        <AdminSection
          title="Milestone timeline"
          description="Track phase delivery and submit completed work for client approval."
        >
          <div className="mb-4">
            <Button size="sm" onClick={() => setMilestoneDialogOpen(true)}>
              Add milestone
            </Button>
          </div>
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No milestones yet.</p>
          ) : (
            <ol className="space-y-3">
              {milestones.map((m, i) => {
                const mStatus = String(m.status ?? '').toUpperCase();
                const mName = String(m.name ?? m.title ?? '');
                const isDeposit =
                  typeof m.isDeposit === 'boolean' ? m.isDeposit : /^\s*deposit\b/i.test(mName);
                const isScheduleInstallment = /^(mid[- ]?project payment|final payment)\b/i.test(
                  mName.trim()
                );
                // Prefer API flag when present; Mid/Final remain pay-only by name (NL-MS-001).
                const isPayOnly =
                  typeof m.isPayOnly === 'boolean'
                    ? m.isPayOnly || isDeposit || isScheduleInstallment
                    : isDeposit || isScheduleInstallment;
                const milestoneId = String(m.id ?? '');
                const submittedDeliverables = deliverables.filter((d) => {
                  if (String(d.milestoneId ?? '') !== milestoneId) return false;
                  const status = String(d.status ?? '').toUpperCase();
                  return (
                    status === 'READY_FOR_REVIEW' ||
                    status === 'IN_PROGRESS' ||
                    status === 'REVISION_REQUESTED' ||
                    status === 'APPROVED'
                  );
                });
                const canSubmitForApproval =
                  !isPayOnly &&
                  ['PENDING', 'IN_PROGRESS', 'REVISION_REQUESTED'].includes(mStatus) &&
                  String(projectStatus ?? '')
                    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
                    .replace(/[\s-]+/g, '_')
                    .toUpperCase() !== 'PENDING_PAYMENT';
                const blockedNoDeliverable =
                  canSubmitForApproval &&
                  !deliverablesLoading &&
                  submittedDeliverables.length === 0;
                const paymentStatus = isPayOnly
                  ? latestPaymentStatusForMilestone(milestoneId, payments)
                  : null;
                const payOnlyBadgeLabel = paymentStatus
                  ? formatPaymentStatusLabel(paymentStatus)
                  : 'Payment not requested';
                const payOnlyBadgeTone = paymentStatus
                  ? resolvePaymentStatusVariant(paymentStatus)
                  : 'neutral';
                return (
                  <li
                    key={String(m.id ?? i)}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/15 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {mName || '—'}
                        {isPayOnly ? (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            {isDeposit ? '(deposit · pay-only)' : '(installment · pay-only)'}
                          </span>
                        ) : null}
                      </p>
                      {m.endDate || m.dueDate ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Due {formatIsoDate(String(m.endDate ?? m.dueDate), 'PP')}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isPayOnly ? (
                        <StatusBadge variant={payOnlyBadgeTone}>{payOnlyBadgeLabel}</StatusBadge>
                      ) : (
                        <StatusBadge variant={projectStatusTone(m.status)}>
                          {formatAdminStatus(m.status)}
                        </StatusBadge>
                      )}
                      {canSubmitForApproval && m.id && submittedDeliverables.length > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-xs"
                          disabled={completeMilestoneM.isPending}
                          onClick={() => completeMilestoneM.mutate(String(m.id))}
                        >
                          Submit for approval
                        </Button>
                      ) : null}
                      {blockedNoDeliverable ? (
                        <span className="text-xs text-muted-foreground">
                          Upload a deliverable before submitting
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </AdminSection>

        <AdminSection
          title="Deliverables"
          description="Review uploaded files and manage client-facing status."
        >
          <div className="mb-4">
            <Button
              size="sm"
              disabled={milestoneOptions.length === 0}
              onClick={openDeliverableDialog}
            >
              Upload deliverable
            </Button>
            {milestoneOptions.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Add a milestone first to upload files.
              </p>
            ) : null}
          </div>
          <AdminQueryState isLoading={deliverablesLoading} error={deliverablesError}>
            {deliverables.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deliverables uploaded yet.</p>
            ) : (
              <ol className="max-h-[min(70vh,640px)] space-y-3 overflow-y-auto pr-1">
                {deliverables.map((d, i) => {
                  const dStatus = String(d.status ?? '');
                  const parentMs = milestones.find(
                    (m) => String(m.id) === String(d.milestoneId ?? '')
                  );
                  const parentMsStatus = String(parentMs?.status ?? '').toUpperCase();
                  const milestoneClosed =
                    parentMsStatus === 'APPROVED' || parentMsStatus === 'CANCELLED';
                  const isPending =
                    !milestoneClosed &&
                    (dStatus === 'PENDING' ||
                      dStatus === 'IN_PROGRESS' ||
                      dStatus === 'READY_FOR_REVIEW' ||
                      dStatus === 'SUBMITTED');
                  const isRejecting = rejectDeliverableId === String(d.id);
                  return (
                    <li
                      key={String(d.id ?? i)}
                      className="space-y-2 rounded-lg border border-border/60 bg-muted/15 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{String(d.name ?? '—')}</p>
                          {d.createdAt ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Submitted {formatIsoDate(String(d.createdAt), 'PPp')}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge variant={projectStatusTone(d.status)}>
                            {formatAdminStatus(d.status)}
                          </StatusBadge>
                          {isPending && d.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg border-green-500 text-xs text-green-700 hover:bg-green-50"
                                disabled={updateDeliverableM.isPending}
                                onClick={() =>
                                  updateDeliverableM.mutate({
                                    id: String(d.id),
                                    status: 'APPROVED',
                                  })
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg border-red-400 text-xs text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setRejectDeliverableId(String(d.id));
                                  setRejectReason('');
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          ) : null}
                          {d.id ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-lg text-xs text-destructive"
                              disabled={deleteDeliverableM.isPending}
                              onClick={async () => {
                                const { confirmed } = await confirm({
                                  title: 'Delete deliverable',
                                  description: 'Delete this deliverable? This cannot be undone.',
                                  destructive: true,
                                  confirmLabel: 'Delete',
                                });
                                if (!confirmed) return;
                                deleteDeliverableM.mutate(String(d.id));
                              }}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      {(() => {
                        const files = parseDeliverableFiles(d);
                        if (files.length === 0) return null;
                        return (
                          <ul className="flex flex-wrap gap-2 border-t border-border/40 pt-2">
                            {files.map((file, fi) => (
                              <li key={`${String(d.id)}-file-${fi}`}>
                                {safeHttpUrl(file.url) ? (
                                  <a
                                    href={safeHttpUrl(file.url) ?? undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex rounded-lg border border-border/60 bg-background px-2.5 py-1 text-xs font-medium text-primary hover:bg-muted/40"
                                  >
                                    Download {file.label}
                                  </a>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    {file.label}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        );
                      })()}
                      {isRejecting ? (
                        <div className="flex flex-col gap-2 border-t border-border/50 pt-3">
                          <FormFieldLabel
                            fieldKey="projects.rejectionReason"
                            label="Rejection reason"
                          >
                            Reason for rejection
                          </FormFieldLabel>
                          <div className="flex flex-wrap gap-2">
                            <input
                              className="min-w-[200px] flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="Reason (optional)"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg border-red-400 text-xs text-red-600"
                              disabled={updateDeliverableM.isPending}
                              onClick={() => {
                                updateDeliverableM.mutate(
                                  {
                                    id: String(d.id),
                                    status: 'REJECTED',
                                    rejectionReason: rejectReason,
                                  },
                                  {
                                    onSettled: () => {
                                      setRejectDeliverableId(null);
                                      setRejectReason('');
                                    },
                                  }
                                );
                              }}
                            >
                              Confirm reject
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-lg text-xs"
                              onClick={() => setRejectDeliverableId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </AdminQueryState>
        </AdminSection>
      </div>

      <TimeEntriesPanel projectId={projectId} />

      <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Add milestone</DialogTitle>
          <DialogDescription>Schedule a new payment or delivery phase.</DialogDescription>
          <div className="mt-4 grid gap-3">
            <div className="space-y-1">
              <FormFieldLabel fieldKey="projects.milestoneName" label="Milestone name">
                Name
              </FormFieldLabel>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Kickoff / Design / Launch"
                value={milestoneForm.msName}
                onChange={(e) => setMilestoneForm((prev) => ({ ...prev, msName: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <FormFieldLabel fieldKey="projects.milestoneStartDate" label="Start date">
                  Start
                </FormFieldLabel>
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={milestoneForm.msStart}
                  onChange={(e) =>
                    setMilestoneForm((prev) => ({ ...prev, msStart: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <FormFieldLabel fieldKey="projects.milestoneEndDate" label="End date">
                  End
                </FormFieldLabel>
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={milestoneForm.msEnd}
                  onChange={(e) => setMilestoneForm((prev) => ({ ...prev, msEnd: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <FormFieldLabel fieldKey="projects.milestoneAmount" label="Amount">
                Amount (₹)
              </FormFieldLabel>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="5000"
                value={milestoneForm.msAmountRupees}
                onChange={(e) =>
                  setMilestoneForm((prev) => ({ ...prev, msAmountRupees: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setMilestoneDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!milestoneForm.msName.trim() || createMilestoneM.isPending}
              onClick={() => createMilestoneM.mutate()}
            >
              {createMilestoneM.isPending ? 'Creating…' : 'Create milestone'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deliverableDialogOpen} onOpenChange={setDeliverableDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Upload deliverable</DialogTitle>
          <DialogDescription>Attach files to a milestone for client review.</DialogDescription>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Milestone</span>
              <select
                className="nl-select w-full rounded-lg border border-border bg-background py-2 text-sm"
                value={deliverableForm.delMilestoneId}
                onChange={(e) =>
                  setDeliverableForm((prev) => ({ ...prev, delMilestoneId: e.target.value }))
                }
              >
                {milestoneOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <FormFieldLabel fieldKey="projects.deliverableMediaIds" label="Deliverable files">
                Files
              </FormFieldLabel>
              <label className="flex cursor-pointer flex-col gap-1 rounded-lg border border-dashed border-border px-3 py-2 text-sm">
                <span className="text-xs text-muted-foreground">Upload file(s) to attach</span>
                <input
                  type="file"
                  className="text-xs"
                  disabled={deliverableFileUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadDeliverableFile({ file: f, projectId });
                    e.target.value = '';
                  }}
                />
              </label>
              {deliverableForm.delMediaIds.trim() ? (
                <p className="text-xs text-muted-foreground">
                  Media IDs: <span className="font-mono">{deliverableForm.delMediaIds}</span>
                </p>
              ) : null}
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Or paste media UUIDs (comma-separated)"
                value={deliverableForm.delMediaIds}
                onChange={(e) =>
                  setDeliverableForm((prev) => ({ ...prev, delMediaIds: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <FormFieldLabel
                fieldKey="projects.deliverableDescription"
                label="Deliverable description"
              >
                Description
              </FormFieldLabel>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Description (optional)"
                value={deliverableForm.delDescription}
                onChange={(e) =>
                  setDeliverableForm((prev) => ({ ...prev, delDescription: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeliverableDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={uploadDeliverableM.isPending || !deliverableForm.delMediaIds.trim()}
              onClick={() => uploadDeliverableM.mutate()}
            >
              {uploadDeliverableM.isPending ? 'Uploading…' : 'Upload deliverable'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
