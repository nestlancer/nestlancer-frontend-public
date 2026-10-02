'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import {
  Button,
  DataTable,
  type DataTableColumn,
  ErrorState,
  SkeletonTable,
  StatusBadge,
  Text,
} from '@nestlancer/ui';

import { GePageHeader as PageHeader } from '@/components/admin/AdminGentelellaUI';
import { AdminMilestoneProgressBar } from '@/components/admin/AdminMilestoneProgressBar';
import {
  AdminDataShell,
  AdminMetricStrip,
  adminCardClass,
  adminDataTableClass,
} from '@/components/admin/AdminPageChrome';
import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { adminKeys } from '@/lib/admin-query-keys';
import { projectPipelinePaymentsQuery } from '@/lib/admin-pipeline-hub';
import { resolvePaymentStatusVariant } from '@/lib/admin-status';
import { pickAdminRecord, pickAdminRows, rowId } from '@/lib/admin-response';
import { LiveAdminPaymentDocumentsPanel } from '@/features/documents/components/LiveAdminPaymentDocumentsPanel';
import { apiServices } from '@/lib/axios';

import { adminPaymentsDebug, adminPaymentsDebugError } from './payments-debug';
import { ManualPaymentModal } from './ManualPaymentModal';
import {
  getMilestonePipelineActions,
  pipelineDisabledReason,
  normalizePipelineStatus,
} from './payment-pipeline';
import {
  formatAdminCurrency,
  formatDeliveryStatusLabel,
  formatPaymentStatusLabel,
  groupMilestonesByProject,
  installmentSlotCounts,
  milestoneLabel,
  milestoneRowType,
  projectBillingStatus,
  projectBillingStatusLabel,
  type MilestoneRow,
  type PaymentRow,
} from './payment-hub-utils';

function deliveryStatusVariant(status: string) {
  const s = status.toUpperCase();
  if (s === 'APPROVED') return 'success' as const;
  if (s === 'COMPLETED') return 'info' as const;
  if (s === 'IN_PROGRESS' || s === 'REVIEW') return 'info' as const;
  if (s === 'PENDING') return 'warning' as const;
  if (s === 'REVISION_REQUESTED') return 'error' as const;
  return 'neutral' as const;
}

function isMilestonePaymentComplete(row: MilestoneRow): boolean {
  const pay = String(row.latestStatus ?? '').toUpperCase();
  if (pay === 'COMPLETED') return true;
  const delivery = String(row.status ?? '').toUpperCase();
  return delivery === 'APPROVED' || delivery === 'COMPLETED' || delivery === 'REVIEW';
}

function milestoneRowId(row: MilestoneRow): string {
  return rowId(row) || String(row.id ?? '');
}

function nextUnpaidMilestoneId(rows: MilestoneRow[]): string | null {
  for (const row of rows) {
    if (!isMilestonePaymentComplete(row)) {
      const id = milestoneRowId(row);
      if (id) return id;
    }
  }
  return null;
}

export function ProjectPaymentsClient({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [selectedMsId, setSelectedMsId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const projectQ = useQuery({
    queryKey: [...adminKeys.root, 'project', projectId],
    queryFn: () => apiServices.admin.getAdminProject(projectId),
  });

  const milestonesQ = useQuery({
    queryKey: [...adminKeys.milestones(), projectId],
    queryFn: async () => {
      adminPaymentsDebug('milestones:project:fetch', { projectId });
      return apiServices.admin.listPaymentMilestones({ projectId });
    },
  });

  const paymentsQ = useQuery({
    queryKey: [...adminKeys.payments(), 'project', projectId],
    queryFn: () => apiServices.admin.listAdminPayments(projectPipelinePaymentsQuery(projectId)),
  });

  const project = useMemo(() => pickAdminRecord(projectQ.data) ?? {}, [projectQ.data]);
  const msRows = useMemo(
    () => pickAdminRows(milestonesQ.data) as MilestoneRow[],
    [milestonesQ.data]
  );
  const payRows = useMemo(() => pickAdminRows(paymentsQ.data) as PaymentRow[], [paymentsQ.data]);

  const selectedMsRow = msRows.find((row) => rowId(row) === selectedMsId) ?? msRows[0] ?? null;
  const milestoneId = selectedMsRow ? rowId(selectedMsRow) || String(selectedMsRow.id ?? '') : '';
  const latestPaymentId =
    selectedMsRow && typeof selectedMsRow.latestPaymentId === 'string'
      ? selectedMsRow.latestPaymentId
      : '';

  const pipelineRow = selectedMsRow
    ? {
        status: String(selectedMsRow.status ?? ''),
        latestStatus:
          typeof selectedMsRow.latestStatus === 'string' ? selectedMsRow.latestStatus : null,
        projectStatus: String(project.status ?? ''),
        isDeposit: Boolean(selectedMsRow.isDeposit),
        isPayOnly:
          typeof selectedMsRow.isPayOnly === 'boolean'
            ? selectedMsRow.isPayOnly
            : Boolean(selectedMsRow.isDeposit),
        name: typeof selectedMsRow.name === 'string' ? selectedMsRow.name : undefined,
        order: typeof selectedMsRow.order === 'number' ? selectedMsRow.order : undefined,
        paymentRequestedAt:
          typeof selectedMsRow.paymentRequestedAt === 'string'
            ? selectedMsRow.paymentRequestedAt
            : null,
        paymentsCount:
          typeof selectedMsRow.paymentsCount === 'number' ? selectedMsRow.paymentsCount : undefined,
      }
    : null;

  useEffect(() => {
    if (msRows.length === 0) {
      setSelectedMsId(null);
      return;
    }
    const stillValid = selectedMsId != null && msRows.some((row) => rowId(row) === selectedMsId);
    if (!stillValid) {
      const first = msRows[0];
      if (!first) return;
      setSelectedMsId(rowId(first) || String(first.id ?? '') || null);
    }
  }, [msRows, selectedMsId]);

  const syncMilestoneFromPayment = useCallback(
    (paymentId: string) => {
      const payment = payRows.find((row) => (rowId(row) || String(row.id ?? '')) === paymentId);
      const linkedMilestoneId =
        typeof payment?.milestoneId === 'string'
          ? payment.milestoneId
          : payment?.milestoneId != null
            ? String(payment.milestoneId)
            : '';
      if (linkedMilestoneId) setSelectedMsId(linkedMilestoneId);
    },
    [payRows]
  );

  useEffect(() => {
    if (payRows.length === 0) {
      setSelectedPaymentId(null);
      return;
    }
    const stillValid =
      selectedPaymentId != null &&
      payRows.some((row) => (rowId(row) || String(row.id ?? '')) === selectedPaymentId);
    if (!stillValid) {
      const first = payRows[0];
      const preferred = latestPaymentId || (first ? rowId(first) || String(first.id ?? '') : '');
      const nextId = preferred || null;
      setSelectedPaymentId(nextId);
      if (nextId) syncMilestoneFromPayment(nextId);
    }
  }, [payRows, selectedPaymentId, latestPaymentId, syncMilestoneFromPayment]);

  const invalidateProjectPayments = () => {
    void qc.invalidateQueries({ queryKey: [...adminKeys.milestones(), projectId] });
    void qc.invalidateQueries({ queryKey: [...adminKeys.payments(), 'project', projectId] });
    void qc.invalidateQueries({ queryKey: adminKeys.payments() });
    void qc.invalidateQueries({ queryKey: adminKeys.milestones() });
  };

  const submitForApproval = useMutation({
    mutationFn: (id: string) => apiServices.admin.completeMilestone(id),
    onSuccess: () => {
      toast.success('Milestone submitted for client approval');
      invalidateProjectPayments();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const requestPayment = useMutation({
    mutationFn: (id: string) => apiServices.admin.requestMilestonePayment(id, {}),
    onSuccess: () => {
      toast.success('Payment requested — client will be notified');
      invalidateProjectPayments();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const verifyPayment = useMutation({
    mutationFn: (paymentId: string) => apiServices.admin.verifyPayment(paymentId, {}),
    onSuccess: (result) => {
      const data = (result as { data?: { verified?: boolean; alreadyCompleted?: boolean } })?.data;
      if (data?.verified === false) {
        toast.error('Gateway has not captured this payment yet');
      } else {
        toast.success(data?.alreadyCompleted ? 'Payment already completed' : 'Payment verified');
      }
      invalidateProjectPayments();
    },
    onError: (e) => {
      adminPaymentsDebugError('verify:error', e, { projectId });
      toast.error(getApiErrorMessage(e));
    },
  });

  const milestoneColumns = useMemo<DataTableColumn<MilestoneRow>[]>(
    () => [
      {
        id: 'select',
        header: '',
        className: 'w-12',
        cell: (row) => {
          const id = rowId(row) || String(row.id ?? '');
          if (!id) return null;
          return (
            <input
              type="radio"
              name="milestone-select"
              checked={id === (selectedMsId ?? milestoneId)}
              onChange={() => setSelectedMsId(id)}
              aria-label={`Select milestone ${milestoneLabel(row)}`}
            />
          );
        },
      },
      {
        id: 'milestone',
        header: 'Milestone',
        cell: (row) => {
          const type = milestoneRowType(row);
          return (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{milestoneLabel(row)}</span>
                <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {type === 'installment' ? 'Installment' : 'Delivery'}
                </span>
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                {(rowId(row) || String(row.id ?? '')).slice(0, 12) || '—'}
              </div>
            </div>
          );
        },
      },
      {
        id: 'delivery',
        header: 'Delivery',
        cell: (row) => {
          if (milestoneRowType(row) === 'installment') {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          const status = String(row.status ?? '—');
          return (
            <StatusBadge variant={deliveryStatusVariant(status)} dot>
              {formatDeliveryStatusLabel(status)}
            </StatusBadge>
          );
        },
      },
      {
        id: 'payment',
        header: 'Payment',
        cell: (row) => {
          const status = String(row.latestStatus ?? '');
          const linked =
            typeof row.linkedInstallmentName === 'string' && row.linkedInstallmentName.trim()
              ? row.linkedInstallmentName.trim()
              : null;
          const inclusive = Boolean(row.linkedInstallmentInclusive);
          const requestedAt =
            typeof row.paymentRequestedAt === 'string' ? row.paymentRequestedAt : null;

          if (!status && !linked) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }

          return (
            <div>
              {status ? (
                <StatusBadge variant={resolvePaymentStatusVariant(status)} dot>
                  {formatPaymentStatusLabel(status, { paymentRequestedAt: requestedAt })}
                </StatusBadge>
              ) : null}
              {linked ? (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {inclusive ? `Included in ${linked}` : `via ${linked}`}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (row) => {
          const type = milestoneRowType(row);
          const due =
            typeof row.billableAmount === 'number'
              ? row.billableAmount
              : typeof row.amount === 'number'
                ? row.amount
                : null;
          const allocation = typeof row.amount === 'number' ? row.amount : null;
          if (type === 'installment') {
            return (
              <span className="font-medium tabular-nums">
                {formatAdminCurrency(due, row.currency ?? 'INR')}
              </span>
            );
          }
          return (
            <div className="tabular-nums">
              <div className="font-medium">
                {formatAdminCurrency(allocation, row.currency ?? 'INR')}
              </div>
              {due != null && due !== allocation ? (
                <div className="text-xs text-muted-foreground">
                  Due {formatAdminCurrency(due, row.currency ?? 'INR')}
                </div>
              ) : null}
            </div>
          );
        },
      },
    ],
    [milestoneId, selectedMsId]
  );

  const paymentColumns = useMemo<DataTableColumn<PaymentRow>[]>(
    () => [
      {
        id: 'select',
        header: '',
        className: 'w-12',
        cell: (row) => {
          const pid = rowId(row) || String(row.id ?? '');
          if (!pid) return null;
          return (
            <input
              type="radio"
              name="payment-select"
              checked={pid === selectedPaymentId}
              onChange={() => {
                setSelectedPaymentId(pid);
                syncMilestoneFromPayment(pid);
              }}
              aria-label={`Select payment ${pid}`}
            />
          );
        },
      },
      {
        id: 'id',
        header: 'Payment ID',
        cell: (row) => {
          const pid = rowId(row) || String(row.id ?? '');
          if (!pid) return '—';
          return (
            <Link
              href={`/payments/${encodeURIComponent(pid)}`}
              className="font-mono text-xs text-primary hover:underline"
            >
              {pid.slice(0, 10)}…
            </Link>
          );
        },
      },
      {
        id: 'milestone',
        header: 'Milestone',
        cell: (row) => {
          const linked = msRows.find(
            (m) => rowId(m) === String(row.milestoneId ?? '') || m.id === row.milestoneId
          );
          return (
            <span className="text-sm text-muted-foreground">
              {linked ? milestoneLabel(linked) : String(row.milestoneId ?? '—')}
            </span>
          );
        },
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (row) => (
          <span className="font-medium">{formatAdminCurrency(row.amount, row.currency)}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => {
          const status = String(row.status ?? '—');
          const requestedAt =
            typeof row.paymentRequestedAt === 'string' ? row.paymentRequestedAt : null;
          return (
            <StatusBadge variant={resolvePaymentStatusVariant(status)} dot>
              {formatPaymentStatusLabel(status, { paymentRequestedAt: requestedAt })}
            </StatusBadge>
          );
        },
      },
      {
        id: 'paidAt',
        header: 'Paid at',
        cell: (row) => (
          <span className="text-xs text-muted-foreground">
            {row.paidAt ? new Date(String(row.paidAt)).toLocaleString() : '—'}
          </span>
        ),
      },
    ],
    [msRows, selectedPaymentId, syncMilestoneFromPayment]
  );

  const projectTitle = String(project.title ?? project.name ?? 'Project');

  const billingSummary = useMemo(() => {
    const grouped = groupMilestonesByProject(msRows);
    return grouped[0] ?? null;
  }, [msRows]);
  const installmentCounts = useMemo(() => installmentSlotCounts(payRows), [payRows]);

  const billingStatus = billingSummary ? projectBillingStatus(billingSummary) : 'none';
  const billingVariant =
    billingStatus === 'complete' ? 'success' : billingStatus === 'partial' ? 'info' : 'warning';

  const openManualPayment = () => {
    const selectedRow = msRows.find((row) => milestoneRowId(row) === selectedMsId);
    const keepSelected =
      selectedRow != null && !isMilestonePaymentComplete(selectedRow) && Boolean(selectedMsId);

    if (!keepSelected) {
      const preferredId = nextUnpaidMilestoneId(msRows);
      if (preferredId) setSelectedMsId(preferredId);
    }
    setManualOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/payments" className="hover:text-primary">
          Payments
        </Link>
        <span aria-hidden>›</span>
        <span className="text-foreground">{projectTitle}</span>
      </div>

      <PageHeader
        pretitle="Operations"
        title={projectTitle}
        description="Deliveries, payment schedule installments, and billing actions for this project."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={openManualPayment}>
              Record manual payment
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/payments">← All projects</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${projectId}`}>Project detail</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/pipeline/projects/${projectId}`}>Pipeline hub</Link>
            </Button>
          </>
        }
      />

      <ManualPaymentModal
        key={manualOpen ? `manual-${(selectedMsId ?? milestoneId) || 'none'}` : 'manual-closed'}
        open={manualOpen}
        onOpenChange={setManualOpen}
        projectId={projectId}
        clientId={
          typeof project.clientId === 'string'
            ? project.clientId
            : typeof project.userId === 'string'
              ? project.userId
              : undefined
        }
        milestoneId={(selectedMsId ?? milestoneId) || undefined}
        milestones={msRows
          .map((row) => {
            const id = rowId(row) || String(row.id ?? '');
            const amountPaise = typeof row.amount === 'number' ? row.amount : undefined;
            const name = typeof row.name === 'string' && row.name.trim() ? row.name : 'Installment';
            return {
              id,
              amountPaise,
              label:
                typeof amountPaise === 'number' && amountPaise > 0
                  ? `${name} · ${formatAdminCurrency(amountPaise, 'INR')}`
                  : name,
            };
          })
          .filter((row) => row.id)}
      />

      {billingSummary ? (
        <div className={`space-y-4 ${adminCardClass}`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Billing progress
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {formatAdminCurrency(billingSummary.paidAmountPaise, 'INR')}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  of {formatAdminCurrency(billingSummary.totalBudgetPaise, 'INR')}
                </span>
              </p>
            </div>
            <StatusBadge variant={billingVariant} dot>
              {projectBillingStatusLabel(billingStatus)}
            </StatusBadge>
          </div>
          <AdminMilestoneProgressBar
            percent={billingSummary.progressPercent}
            variant={billingVariant}
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">
            {billingSummary.progressPercent}% of contract value collected (
            {billingSummary.paidCount}/{billingSummary.milestoneCount} installments)
          </p>
          <AdminMetricStrip
            items={[
              {
                label: 'Installments paid',
                value: `${billingSummary.paidCount}/${billingSummary.milestoneCount}`,
              },
              {
                label: 'Outstanding',
                value: formatAdminCurrency(
                  Math.max(0, billingSummary.totalBudgetPaise - billingSummary.paidAmountPaise),
                  'INR'
                ),
              },
              {
                label: 'Awaiting client',
                value: String(billingSummary.awaitingApprovalCount),
              },
            ]}
            max={3}
          />
        </div>
      ) : null}

      <section className="space-y-4">
        <Text className="text-sm font-semibold text-foreground">
          Deliveries &amp; payment schedule
        </Text>
        <AdminQueryState isLoading={milestonesQ.isLoading} error={milestonesQ.error}>
          <AdminDataShell>
            {milestonesQ.isLoading ? <SkeletonTable rows={4} cols={5} /> : null}
            {!milestonesQ.isLoading && !milestonesQ.error ? (
              <DataTable
                className={adminDataTableClass}
                columns={milestoneColumns}
                rows={msRows}
                getRowId={(row) => rowId(row) || String(row.id ?? '')}
                emptyTitle="No milestones for this project"
                emptyDescription="Milestones are created when a quote is accepted."
              />
            ) : null}
          </AdminDataShell>
        </AdminQueryState>

        {milestoneId && pipelineRow ? (
          <div className={`flex flex-wrap gap-2 p-3 ${adminCardClass}`}>
            <Text className="w-full text-xs text-muted-foreground">
              Pipeline for {milestoneLabel(selectedMsRow ?? {})}
              {pipelineRow.isDeposit
                ? ' — deposit is pay-only (client pays first; no delivery approval)'
                : pipelineRow.isPayOnly
                  ? ' — installment: request payment → client pays → verify (no delivery submit)'
                  : ' — submit work → client approve → then request payment on the installment'}
            </Text>
            {pipelineRow.isDeposit ? (
              <Text className="text-xs text-muted-foreground">
                {normalizePipelineStatus(
                  typeof selectedMsRow?.latestStatus === 'string'
                    ? selectedMsRow.latestStatus
                    : null
                ) === 'COMPLETED'
                  ? 'Deposit paid — project work can proceed on delivery milestones.'
                  : 'Waiting for the client to pay the deposit (or record it via Manual payment).'}
              </Text>
            ) : (
              <>
                {!pipelineRow.isPayOnly ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      submitForApproval.isPending ||
                      !getMilestonePipelineActions(pipelineRow).find(
                        (a) => a.action === 'submitForApproval'
                      )?.enabled
                    }
                    title={pipelineDisabledReason(pipelineRow, 'submitForApproval')}
                    onClick={() => submitForApproval.mutate(milestoneId)}
                  >
                    {submitForApproval.isPending ? 'Submitting…' : 'Submit for client approval'}
                  </Button>
                ) : null}
                {(pipelineRow.isPayOnly ||
                  (normalizePipelineStatus(pipelineRow.status) === 'APPROVED' &&
                    ((pipelineRow.paymentsCount ?? 0) > 0 ||
                      Boolean(pipelineRow.latestStatus)))) && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      requestPayment.isPending ||
                      !getMilestonePipelineActions(pipelineRow).find(
                        (a) => a.action === 'requestPayment'
                      )?.enabled
                    }
                    title={pipelineDisabledReason(pipelineRow, 'requestPayment')}
                    onClick={() => requestPayment.mutate(milestoneId)}
                  >
                    {requestPayment.isPending ? 'Requesting…' : 'Request payment'}
                  </Button>
                )}
                {latestPaymentId &&
                getMilestonePipelineActions(pipelineRow).find((a) => a.action === 'verifyPayment')
                  ?.enabled ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={verifyPayment.isPending}
                    title={pipelineDisabledReason(pipelineRow, 'verifyPayment')}
                    onClick={() => verifyPayment.mutate(latestPaymentId)}
                  >
                    {verifyPayment.isPending ? 'Verifying…' : 'Verify payment'}
                  </Button>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <Text className="text-sm font-semibold text-foreground">Contract installments</Text>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            These are the {payRows.length} billing slots from the quote payment schedule (e.g.
            30-40-30). All slots appear here when the quote is accepted — only paid or requested
            rows mean money has moved or is due. Work deliveries are tracked in the table above.
          </p>
        </div>
        <AdminQueryState isLoading={paymentsQ.isLoading} error={paymentsQ.error}>
          <AdminDataShell>
            {paymentsQ.isLoading ? <SkeletonTable rows={4} cols={5} /> : null}
            {!paymentsQ.isLoading && paymentsQ.error ? (
              <ErrorState
                message={getApiErrorMessage(paymentsQ.error, 'Could not load payments')}
                onRetry={() => void paymentsQ.refetch()}
              />
            ) : null}
            {!paymentsQ.isLoading && !paymentsQ.error ? (
              <>
                {payRows.length > 0 ? (
                  <p className="mb-3 text-xs text-muted-foreground">
                    {installmentCounts.paid} paid · {installmentCounts.due} due ·{' '}
                    {installmentCounts.scheduled} scheduled (not yet requested)
                  </p>
                ) : null}
                <DataTable
                  className={adminDataTableClass}
                  columns={paymentColumns}
                  rows={payRows}
                  getRowId={(row) => rowId(row) || String(row.id ?? '')}
                  emptyTitle="No contract installments"
                  emptyDescription="Installment rows are created when the client accepts the quote."
                />
              </>
            ) : null}
          </AdminDataShell>
        </AdminQueryState>
      </section>

      {selectedPaymentId ? <LiveAdminPaymentDocumentsPanel paymentId={selectedPaymentId} /> : null}
    </div>
  );
}
