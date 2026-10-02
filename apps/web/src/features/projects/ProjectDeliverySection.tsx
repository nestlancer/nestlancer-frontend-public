'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from '@nestlancer/ui';
import Link from 'next/link';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys, routes } from '@nestlancer/constants';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, ErrorState } from '@nestlancer/ui';

import { TabPanelSkeleton } from '@/components/common/TabPanelSkeleton';
import { WebPanel } from '@/components/web/WebPanel';
import { formatMoneyFromPaise } from '@nestlancer/utils';

import { PaymentCheckoutLink } from '@/features/payments/components/PaymentCheckoutLink';
import { ProgressTimelineClient } from '@/features/progress/ProgressTimelineClient';
import { apiServices } from '@/lib/axios';
import { invalidateByAction } from '@/lib/invalidate-queries';
import {
  canClientReviewDeliverable,
  extractDeliverables,
  formatDeliverableStatusLabel,
} from '@/features/projects/hub/deliverable-utils';
import { DeliverableFileAction } from '@/features/projects/hub/DeliverableFileAction';
import { asRecord } from '@/lib/client-api-view';
import { isMilestonePayable } from '@/lib/milestone-status';
import { webPrimaryButtonClass } from '@/lib/tailadmin-classes';

type Tab = 'deliverables' | 'payments' | 'feedback';

export function ProjectDeliverySection({
  projectId,
  projectStatus,
}: {
  projectId: string;
  projectStatus?: string;
}) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('deliverables');
  const [revisionNote, setRevisionNote] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [previewedIds, setPreviewedIds] = useState<Set<string>>(() => new Set());

  const deliverables = useQuery({
    queryKey: [...queryKeys.projects.detail(projectId), 'deliverables'],
    queryFn: () => apiServices.projects.getDeliverables(projectId),
    enabled: tab === 'deliverables',
  });
  const payments = useQuery({
    queryKey: [...queryKeys.projects.detail(projectId), 'payments'],
    queryFn: () => apiServices.payments.listByProject(projectId),
    enabled: tab === 'payments',
  });
  const paymentMilestones = useQuery({
    queryKey: [...queryKeys.projects.detail(projectId), 'payment-milestones'],
    queryFn: () => apiServices.payments.listMilestonesByProject(projectId),
    enabled: tab === 'payments',
  });
  const feedback = useQuery({
    queryKey: [...queryKeys.projects.detail(projectId), 'feedback'],
    queryFn: () => apiServices.projects.getFeedback(projectId),
    enabled: tab === 'feedback',
  });

  const deliverableRows = extractDeliverables(deliverables.data);

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
    onSuccess: () => {
      toast.success('Project approved');
      void qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
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
      void qc.invalidateQueries({
        queryKey: [...queryKeys.projects.detail(projectId), 'feedback'],
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const normalizedStatus = (projectStatus ?? '').toLowerCase();
  const canAct = normalizedStatus === 'review' || normalizedStatus === 'revisionrequested';

  type ScheduleRow = {
    milestoneId?: string;
    name: string;
    amountPaise: number;
    currency: string;
    deliveryStatus: string;
    paymentStatus: string;
    paymentId?: string;
    order?: number;
    paymentRequestedAt?: string | null;
    isDeposit?: boolean;
    isPayOnly?: boolean;
  };

  const scheduleRows: ScheduleRow[] = (() => {
    const msData = paymentMilestones.data;
    const r = asRecord(msData);
    const msList = Array.isArray(r?.milestones)
      ? (r!.milestones as unknown[])
      : Array.isArray(r?.data)
        ? (r!.data as unknown[])
        : Array.isArray(msData)
          ? (msData as unknown[])
          : [];
    if (msList.length > 0) {
      return msList.map((item) => {
        const o = asRecord(item) ?? {};
        const amountRaw = o.amount ?? o.totalAmount;
        return {
          milestoneId:
            typeof o.milestoneId === 'string'
              ? o.milestoneId
              : typeof o.id === 'string'
                ? o.id
                : undefined,
          name: String(o.name ?? o.title ?? 'Milestone'),
          amountPaise: typeof amountRaw === 'number' ? amountRaw : 0,
          currency: String(o.currency ?? 'INR'),
          deliveryStatus: String(o.status ?? 'PENDING'),
          paymentStatus: String(o.latestStatus ?? ''),
          paymentId: typeof o.latestPaymentId === 'string' ? o.latestPaymentId : undefined,
          order: typeof o.order === 'number' ? o.order : undefined,
          paymentRequestedAt:
            typeof o.paymentRequestedAt === 'string' ? o.paymentRequestedAt : null,
          isDeposit: typeof o.isDeposit === 'boolean' ? o.isDeposit : undefined,
          isPayOnly: typeof o.isPayOnly === 'boolean' ? o.isPayOnly : undefined,
        };
      });
    }
    const payList = Array.isArray(payments.data) ? payments.data : [];
    return payList.map((raw) => {
      const p = asRecord(raw) ?? {};
      return {
        milestoneId: typeof p.milestoneId === 'string' ? p.milestoneId : undefined,
        name: String((asRecord(p.milestone)?.name as string | undefined) ?? 'Payment'),
        amountPaise: typeof p.amount === 'number' ? p.amount : 0,
        currency: String(p.currency ?? 'INR'),
        deliveryStatus: 'PENDING',
        paymentStatus: String(p.status ?? '—'),
        paymentId: typeof p.id === 'string' ? p.id : undefined,
      };
    });
  })();

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {(['deliverables', 'payments', 'feedback'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm capitalize ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {canAct ? (
        <WebPanel padding="sm" className="flex flex-wrap gap-2">
          <Button
            type="button"
            className={webPrimaryButtonClass}
            disabled={approveM.isPending}
            onClick={() => approveM.mutate()}
          >
            Approve delivery
          </Button>
          <div className="flex min-w-[200px] flex-1 flex-col gap-2">
            <FormFieldLabel fieldKey="projects.revisionNotes" label="Revision notes">
              Revision notes
            </FormFieldLabel>
            <div className="flex flex-wrap gap-2">
              <input
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="What should change before you approve"
                className="min-w-[160px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
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

      {tab === 'deliverables' ? (
        <WebPanel padding="md">
          {deliverables.isPending ? <TabPanelSkeleton variant="list" /> : null}
          {deliverables.isError ? (
            <ErrorState
              title="Could not load deliverables"
              message={getApiErrorMessage(deliverables.error)}
              onRetry={() => void deliverables.refetch()}
            />
          ) : null}
          {deliverables.isError ? (
            <p className="text-sm text-destructive">{getApiErrorMessage(deliverables.error)}</p>
          ) : null}
          {deliverableRows.length === 0 && !deliverables.isPending ? (
            <p className="text-sm text-muted-foreground">No deliverables yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {deliverableRows.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{d.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDeliverableStatusLabel(d.status)}
                    </p>
                    {d.files.length > 0 ? (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {d.files.map((f, idx) => (
                          <li key={`${d.id}-file-${idx}`}>
                            <DeliverableFileAction
                              file={f}
                              className="text-xs text-primary underline"
                              onPreviewed={() =>
                                setPreviewedIds((prev) => {
                                  const next = new Set(prev);
                                  next.add(d.id);
                                  return next;
                                })
                              }
                            >
                              Preview {f.label ?? 'file'}
                            </DeliverableFileAction>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  {canClientReviewDeliverable(d.status) ? (
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
                          Approve
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
                </li>
              ))}
            </ul>
          )}
          {rejectTarget ? (
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <FormFieldLabel fieldKey="projects.rejectionReason" label="Rejection reason">
                Reason for rejection
              </FormFieldLabel>
              <div className="flex flex-wrap gap-2">
                <input
                  className="min-w-[200px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="e.g. Logo files are the old version"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
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
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setRejectTarget(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </WebPanel>
      ) : null}

      {tab === 'payments' ? (
        <WebPanel padding="md">
          {payments.isPending || paymentMilestones.isPending ? (
            <TabPanelSkeleton variant="list" />
          ) : null}
          {(payments.isError || paymentMilestones.isError) && scheduleRows.length === 0 ? (
            <ErrorState
              title="Could not load payments"
              message={getApiErrorMessage(payments.error ?? paymentMilestones.error)}
              onRetry={() => {
                void payments.refetch();
                void paymentMilestones.refetch();
              }}
            />
          ) : null}
          {!payments.isPending && !paymentMilestones.isPending && scheduleRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payment schedule yet. Pay from the Milestones section above when amounts are due.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {scheduleRows.map((row, i) => (
                <li
                  key={row.paymentId ?? row.milestoneId ?? `sched-${i}`}
                  className="flex items-center justify-between gap-4"
                >
                  <span>
                    {row.name} · {formatMoneyFromPaise(row.amountPaise, row.currency)} ·{' '}
                    {row.paymentStatus || '—'}
                  </span>
                  <div className="flex gap-2">
                    {row.paymentId ? (
                      <Link
                        href={routes.payment(row.paymentId)}
                        className="text-xs text-primary underline"
                      >
                        Details
                      </Link>
                    ) : null}
                    {row.milestoneId &&
                    isMilestonePayable({
                      status: row.deliveryStatus,
                      amountPaise: row.amountPaise,
                      order: row.order ?? 1,
                      paymentStatus: row.paymentStatus,
                      paymentRequestedAt: row.paymentRequestedAt,
                      isDeposit: row.isDeposit,
                      isPayOnly: row.isPayOnly,
                    }) ? (
                      <PaymentCheckoutLink
                        projectId={projectId}
                        milestoneId={row.milestoneId}
                        amount={row.amountPaise}
                        currency={row.currency}
                        paymentId={row.paymentId}
                        label="Pay"
                        variant="compact"
                        className="h-8 px-2 text-xs"
                      />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </WebPanel>
      ) : null}

      {tab === 'feedback' ? (
        <WebPanel padding="md" className="space-y-4">
          {feedback.isPending ? <TabPanelSkeleton variant="list" /> : null}
          {feedback.isError ? (
            <ErrorState
              title="Could not load feedback"
              message={getApiErrorMessage(feedback.error)}
              onRetry={() => void feedback.refetch()}
            />
          ) : null}
          <FormFieldLabel fieldKey="projects.revisionNotes" label="Your feedback">
            Your feedback
          </FormFieldLabel>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="What went well, and what to improve"
            className="min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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
      ) : null}

      <ProgressTimelineClient projectId={projectId} />
    </div>
  );
}
