'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Text } from '@nestlancer/ui';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import {
  Button,
  DataTable,
  type DataTableColumn,
  ErrorState,
  Pagination,
  SkeletonTable,
  StatusBadge,
} from '@nestlancer/ui';

import { GePageHeader as PageHeader } from '@/components/admin/AdminGentelellaUI';
import { AdminEntityIdChip } from '@/components/admin/AdminEntityIdChip';
import { AdminMilestoneProgressBar } from '@/components/admin/AdminMilestoneProgressBar';
import { resolvePaymentStatusVariant } from '@/lib/admin-status';

import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { DebugApiSection } from '@/components/admin/AdminDataViews';
import {
  AdminDataShell,
  AdminFilterBar,
  AdminMetricStrip,
  AdminTabBar,
  adminDataTableClass,
} from '@/components/admin/AdminPageChrome';
import { collectStatusFilterOptions, filterTableRows } from '@/components/admin/AdminTableViews';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminPagination, pickAdminRows, rowId } from '@/lib/admin-response';
import {
  cellPreview,
  extractPaymentsHubKpis,
  humanizeKey,
  inferColumns,
} from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';
import { AdminDisputesSection } from './AdminDisputesSection';
import { PaymentRefundModal } from './PaymentRefundModal';
import {
  formatAdminCurrency,
  formatPaymentStatusLabel,
  groupMilestonesByProject,
  parseReconciliationPayload,
  projectBillingStatus,
  projectBillingStatusLabel,
  projectLabel,
  type PaymentRow,
  type ProjectPaymentSummary,
} from './payment-hub-utils';

const PAGE_SIZE = 20;

type PaymentsView = 'projects' | 'transactions' | 'verification' | 'disputes' | 'reconciliation';

const VIEW_TABS: { id: PaymentsView; label: string }[] = [
  { id: 'projects', label: 'By project' },
  { id: 'transactions', label: 'All transactions' },
  { id: 'verification', label: 'Awaiting verification' },
  { id: 'disputes', label: 'Disputes' },
  { id: 'reconciliation', label: 'Reconciliation' },
];

function parsePaymentsView(raw: string | null): PaymentsView {
  if (
    raw === 'transactions' ||
    raw === 'verification' ||
    raw === 'disputes' ||
    raw === 'reconciliation'
  ) {
    return raw;
  }
  return 'projects';
}

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function isoDateToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function paymentNotes(row: PaymentRow): string {
  const notes =
    row.verificationNotes ?? row.notes ?? row.adminNotes ?? row.transferReference ?? row.utr;
  return typeof notes === 'string' && notes.trim() ? notes.trim() : '—';
}

export function PaymentsClient() {
  const qc = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setViewState] = useState<PaymentsView>(() =>
    parsePaymentsView(searchParams.get('view'))
  );
  const [projectSearch, setProjectSearch] = useState('');

  const [paySearch, setPaySearch] = useState('');
  const [payStatus, setPayStatus] = useState('all');
  const [payPage, setPayPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState<PaymentRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PaymentRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reconStart, setReconStart] = useState(() => isoDateDaysAgo(90));
  const [reconEnd, setReconEnd] = useState(() => isoDateToday());
  const [reconPage, setReconPage] = useState(1);

  useEffect(() => {
    const next = parsePaymentsView(searchParams.get('view'));
    if (next !== view) setViewState(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- URL is source of truth
  }, [searchParams]);

  const setView = (next: PaymentsView) => {
    setViewState(next);
    if (next === 'disputes') {
      router.replace('/payments/disputes', { scroll: false });
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'projects') {
      params.delete('view');
    } else {
      params.set('view', next);
    }
    const qs = params.toString();
    router.replace(qs ? `/payments?${qs}` : '/payments', { scroll: false });
  };

  const milestones = useQuery({
    queryKey: adminKeys.milestones(),
    queryFn: () => apiServices.admin.listPaymentMilestones(),
  });

  const paymentStatsQ = useQuery({
    queryKey: [...adminKeys.payments(), 'stats'],
    queryFn: () => apiServices.admin.getAdminPaymentStats(),
  });

  const paymentsQ = useQuery({
    queryKey: [...adminKeys.payments(), payPage, paySearch, payStatus, view],
    queryFn: () =>
      apiServices.admin.listAdminPayments({
        page: payPage,
        limit: PAGE_SIZE,
        search: paySearch || undefined,
        status:
          view === 'verification'
            ? 'PENDING_VERIFICATION'
            : payStatus !== 'all'
              ? payStatus
              : undefined,
      }),
    enabled: view === 'transactions' || view === 'verification',
  });

  const reconciliation = useQuery({
    queryKey: adminKeys.reconciliation({
      startDate: reconStart,
      endDate: reconEnd,
      page: reconPage,
      limit: PAGE_SIZE,
    }),
    queryFn: () =>
      apiServices.admin.getReconciliation({
        startDate: reconStart,
        endDate: reconEnd,
        page: reconPage,
        limit: PAGE_SIZE,
      }),
    enabled: view === 'reconciliation',
  });

  const verifyPayment = useMutation({
    mutationFn: (paymentId: string) => apiServices.admin.verifyPayment(paymentId, {}),
    onSuccess: () => {
      toast.success('Payment verified');
      void qc.invalidateQueries({ queryKey: adminKeys.payments() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const approveTransfer = useMutation({
    mutationFn: (paymentId: string) => apiServices.admin.approveTransfer(paymentId, {}),
    onSuccess: (result) => {
      const warn = (result as { data?: { duplicateUtrWarning?: string | null } })?.data
        ?.duplicateUtrWarning;
      toast.success(
        warn ? `Transfer approved (duplicate UTR warning: ${warn})` : 'Transfer approved'
      );
      void qc.invalidateQueries({ queryKey: adminKeys.payments() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const rejectTransfer = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiServices.admin.rejectTransfer(id, { reason, allowRetry: true }),
    onSuccess: () => {
      toast.success('Transfer rejected — client can retry');
      setRejectTarget(null);
      setRejectReason('');
      void qc.invalidateQueries({ queryKey: adminKeys.payments() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const msRows = useMemo(() => pickAdminRows(milestones.data), [milestones.data]);
  const projectSummaries = useMemo(() => groupMilestonesByProject(msRows), [msRows]);
  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projectSummaries;
    return projectSummaries.filter(
      (p) => p.projectTitle.toLowerCase().includes(q) || p.projectId.toLowerCase().includes(q)
    );
  }, [projectSummaries, projectSearch]);

  const payRows = useMemo(() => pickAdminRows(paymentsQ.data), [paymentsQ.data]);
  const payPagination = useMemo(() => pickAdminPagination(paymentsQ.data), [paymentsQ.data]);
  const payStatusOptions = useMemo(() => collectStatusFilterOptions(payRows), [payRows]);
  const filteredPayRows = useMemo(() => {
    if (view === 'verification') {
      const q = paySearch.trim().toLowerCase();
      if (!q) return payRows;
      return filterTableRows(payRows, paySearch, 'all');
    }
    return filterTableRows(payRows, paySearch, payStatus);
  }, [payRows, paySearch, payStatus, view]);

  const reconView = useMemo(
    () => parseReconciliationPayload(reconciliation.data),
    [reconciliation.data]
  );
  const reconPagination = useMemo(
    () => pickAdminPagination(reconciliation.data),
    [reconciliation.data]
  );

  const projectColumns = useMemo<DataTableColumn<ProjectPaymentSummary>[]>(
    () => [
      {
        id: 'project',
        header: 'Project',
        cell: (row) => {
          const hasName = row.projectTitle.trim().length > 0 && row.projectTitle !== row.projectId;
          return (
            <div className="min-w-[14rem] max-w-[22rem]">
              <Link
                href={`/payments/projects/${encodeURIComponent(row.projectId)}`}
                className="font-medium text-foreground hover:text-primary hover:underline"
              >
                {hasName ? row.projectTitle : 'Untitled project'}
              </Link>
              <AdminEntityIdChip id={row.projectId} />
            </div>
          );
        },
      },
      {
        id: 'progress',
        header: 'Installment progress',
        cell: (row) => {
          const billing = projectBillingStatus(row);
          const variant =
            billing === 'complete' ? 'success' : billing === 'partial' ? 'info' : 'warning';
          return (
            <div className="min-w-[10rem] space-y-1">
              <AdminMilestoneProgressBar percent={row.progressPercent} variant={variant} />
              <p className="text-xs text-muted-foreground">
                {row.paidCount}/{row.milestoneCount} installments paid
                {row.deliveryCount > 0 ? ` · ${row.deliveryCount} deliveries` : ''}
              </p>
            </div>
          );
        },
      },
      {
        id: 'budget',
        header: 'Total budget',
        className: 'text-right',
        cell: (row) => (
          <span className="font-medium tabular-nums">
            {formatAdminCurrency(row.totalBudgetPaise, 'INR')}
          </span>
        ),
      },
      {
        id: 'paid',
        header: 'Paid',
        className: 'text-right',
        cell: (row) => (
          <span className="font-medium text-emerald-700 tabular-nums dark:text-emerald-300">
            {formatAdminCurrency(row.paidAmountPaise, 'INR')}
          </span>
        ),
      },
      {
        id: 'balance',
        header: 'Balance',
        className: 'text-right',
        cell: (row) => {
          const balance = Math.max(0, row.totalBudgetPaise - row.paidAmountPaise);
          return (
            <span className="text-muted-foreground tabular-nums">
              {balance > 0 ? formatAdminCurrency(balance, 'INR') : '—'}
            </span>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => {
          const billing = projectBillingStatus(row);
          const variant =
            billing === 'complete' ? 'success' : billing === 'partial' ? 'info' : 'warning';
          return (
            <StatusBadge variant={variant} dot>
              {projectBillingStatusLabel(billing)}
            </StatusBadge>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        className: 'text-right',
        cell: (row) => (
          <Link
            href={`/payments/projects/${encodeURIComponent(row.projectId)}`}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Manage →
          </Link>
        ),
      },
    ],
    []
  );

  const paymentColumns = useMemo<DataTableColumn<PaymentRow>[]>(
    () => [
      {
        id: 'id',
        header: 'ID',
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
        id: 'client',
        header: 'Client',
        cell: (row) => {
          const client =
            row.client && typeof row.client === 'object'
              ? String(
                  (row.client as Record<string, unknown>).email ??
                    (row.client as Record<string, unknown>).firstName ??
                    '—'
                )
              : String(row.clientId ?? '—');
          return <span className="text-muted-foreground">{client}</span>;
        },
      },
      {
        id: 'project',
        header: 'Project',
        cell: (row) => {
          const projectId = String(row.projectId ?? '');
          const title = projectLabel(row);
          return projectId ? (
            <Link
              href={`/payments/projects/${projectId}`}
              className="block max-w-[180px] truncate text-primary hover:underline"
            >
              {title}
            </Link>
          ) : (
            <span className="text-muted-foreground">{title}</span>
          );
        },
      },
      ...(view === 'verification'
        ? [
            {
              id: 'notes',
              header: 'Receipt / notes',
              cell: (row: PaymentRow) => (
                <span className="block max-w-[14rem] truncate text-sm text-muted-foreground">
                  {paymentNotes(row)}
                </span>
              ),
            } satisfies DataTableColumn<PaymentRow>,
          ]
        : []),
      {
        id: 'actions',
        header: 'Actions',
        className: 'text-right',
        cell: (row) => {
          const pid = rowId(row) || String(row.id ?? '');
          const status = String(row.status ?? '—');
          const canRefund = ['COMPLETED', 'completed'].includes(status);
          const canVerify = ['PENDING', 'PROCESSING', 'pending', 'processing'].includes(status);
          const canApproveTransfer = ['PENDING_VERIFICATION', 'pending_verification'].includes(
            status
          );
          return (
            <div className="flex justify-end gap-2">
              {pid ? (
                <Link
                  href={`/payments/${encodeURIComponent(pid)}`}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  View →
                </Link>
              ) : null}
              {canApproveTransfer && pid ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs"
                    disabled={approveTransfer.isPending}
                    onClick={() => approveTransfer.mutate(pid)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs"
                    onClick={() => {
                      setRejectTarget(row);
                      setRejectReason('');
                    }}
                  >
                    Reject
                  </Button>
                </>
              ) : null}
              {canVerify && pid ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs"
                  disabled={verifyPayment.isPending}
                  onClick={() => verifyPayment.mutate(pid)}
                >
                  Verify
                </Button>
              ) : null}
              {canRefund ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-red-400 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => setRefundTarget(row)}
                >
                  Refund
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [verifyPayment, approveTransfer, view]
  );

  const reconPaymentColumns = useMemo<DataTableColumn<Record<string, unknown>>[]>(() => {
    const keys = inferColumns(reconView.payments, 6);
    return keys.map((key) => ({
      id: key,
      header: humanizeKey(key),
      cell: (row) => {
        if (key === 'amount' || key === 'localAmount' || key === 'providerAmount') {
          return (
            <span className="font-medium tabular-nums">
              {formatAdminCurrency(row[key], row.currency ?? row.localCurrency ?? 'INR')}
            </span>
          );
        }
        return <span className="text-sm">{cellPreview(row[key])}</span>;
      },
    }));
  }, [reconView.payments]);

  const reconMismatchColumns = useMemo<DataTableColumn<Record<string, unknown>>[]>(() => {
    const keys = inferColumns(reconView.mismatches, 6);
    return keys.map((key) => ({
      id: key,
      header: humanizeKey(key),
      cell: (row) => {
        if (key === 'amount' || key === 'localAmount' || key === 'providerAmount') {
          return (
            <span className="font-medium tabular-nums">
              {formatAdminCurrency(row[key], row.currency ?? 'INR')}
            </span>
          );
        }
        return <span className="text-sm">{cellPreview(row[key])}</span>;
      },
    }));
  }, [reconView.mismatches]);

  const paymentKpis = useMemo(() => {
    const stats = paymentStatsQ.data as
      | { data?: { totalRevenue?: number }; totalRevenue?: number }
      | undefined;
    const totalRevenue =
      typeof stats?.data?.totalRevenue === 'number'
        ? stats.data.totalRevenue
        : typeof stats?.totalRevenue === 'number'
          ? stats.totalRevenue
          : undefined;
    return extractPaymentsHubKpis(projectSummaries, {
      totalCollectedPaise: totalRevenue,
    });
  }, [projectSummaries, paymentStatsQ.data]);

  const viewTabIndex = VIEW_TABS.findIndex((t) => t.id === view);

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="Operations"
        title="Payments"
        description="Billing operations organized by project. Open a project to manage milestones, request payments, and verify transactions."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/payments/accounts">Settlement accounts</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/payments/company-legal">Company legal identity</Link>
            </Button>
          </div>
        }
      />

      <AdminTabBar
        tabs={VIEW_TABS.map((t) => ({ label: t.label }))}
        activeIndex={viewTabIndex >= 0 ? viewTabIndex : 0}
        onChange={(i) => setView(VIEW_TABS[i]?.id ?? 'projects')}
      />

      {view === 'projects' ? <AdminMetricStrip items={paymentKpis} max={3} /> : null}

      {refundTarget ? (
        <PaymentRefundModal
          paymentId={rowId(refundTarget) || String(refundTarget.id ?? '')}
          amount={refundTarget.amount}
          currency={refundTarget.currency}
          onClose={() => setRefundTarget(null)}
        />
      ) : null}

      {view === 'projects' ? (
        <section className="space-y-3">
          <Text className="text-sm text-muted-foreground">
            Select a project to view milestones, payment status, and pipeline actions.
          </Text>
          <AdminDataShell
            filter={
              <AdminFilterBar
                search={projectSearch}
                onSearchChange={setProjectSearch}
                searchPlaceholder="Search projects…"
              />
            }
            footer={
              <span>
                {filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'} with
                billing
              </span>
            }
          >
            {milestones.isLoading ? <SkeletonTable rows={5} cols={7} /> : null}
            {!milestones.isLoading && milestones.error ? (
              <ErrorState
                message={getApiErrorMessage(milestones.error, 'Could not load projects')}
                onRetry={() => void milestones.refetch()}
              />
            ) : null}
            {!milestones.isLoading && !milestones.error ? (
              <DataTable
                className={adminDataTableClass}
                columns={projectColumns}
                rows={filteredProjects}
                getRowId={(row) => row.projectId}
                emptyTitle="No projects with payment milestones"
                emptyDescription="Projects appear here once quotes are accepted and milestones are scheduled."
              />
            ) : null}
          </AdminDataShell>
        </section>
      ) : null}

      {view === 'transactions' || view === 'verification' ? (
        <section className="space-y-4">
          <Text className="text-sm text-muted-foreground">
            {view === 'verification'
              ? 'Manual bank/UPI transfers waiting for operator review. Approve or reject the proof; gateway captures still use Verify.'
              : 'Global transaction log. For milestone pipeline actions, use By project.'}
          </Text>
          {rejectTarget ? (
            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground">
                Reject transfer {rowId(rejectTarget) || String(rejectTarget.id ?? '')}
              </p>
              <textarea
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="e.g. UTR does not match the amount"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={!rejectReason.trim() || rejectTransfer.isPending}
                  onClick={() => {
                    const id = rowId(rejectTarget) || String(rejectTarget.id ?? '');
                    if (!id) return;
                    rejectTransfer.mutate({ id, reason: rejectReason.trim() });
                  }}
                >
                  {rejectTransfer.isPending ? 'Rejecting…' : 'Confirm reject'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRejectTarget(null);
                    setRejectReason('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
          <AdminQueryState isLoading={paymentsQ.isLoading} error={paymentsQ.error}>
            <AdminDataShell
              filter={
                <AdminFilterBar
                  search={paySearch}
                  onSearchChange={(value) => {
                    setPaySearch(value);
                    setPayPage(1);
                  }}
                  searchPlaceholder="Search by client, project, amount…"
                  filters={
                    view === 'verification'
                      ? undefined
                      : [
                          {
                            id: 'status',
                            label: 'Status',
                            value: payStatus,
                            options: [
                              { value: 'all', label: 'All statuses' },
                              ...payStatusOptions.map((opt) => ({ value: opt, label: opt })),
                            ],
                            onChange: (value) => {
                              setPayStatus(value);
                              setPayPage(1);
                            },
                          },
                        ]
                  }
                />
              }
              footer={
                payPagination ? (
                  <Pagination
                    page={payPagination.page}
                    pageSize={payPagination.limit}
                    total={payPagination.total}
                    onPageChange={(nextPage) => setPayPage(nextPage)}
                  />
                ) : undefined
              }
            >
              {paymentsQ.isLoading ? <SkeletonTable rows={6} cols={6} /> : null}
              {!paymentsQ.isLoading && !paymentsQ.error ? (
                <DataTable
                  className={adminDataTableClass}
                  columns={paymentColumns}
                  rows={filteredPayRows}
                  getRowId={(row) =>
                    rowId(row) ||
                    `${String(row.clientId ?? '')}-${String(row.projectId ?? '')}-${String(row.amount ?? '')}`
                  }
                  emptyTitle={
                    view === 'verification'
                      ? 'No payments awaiting verification'
                      : 'No payments match your filters'
                  }
                  emptyDescription={
                    view === 'verification'
                      ? 'Offline transfers appear here when a client submits proof.'
                      : 'Try changing status or search query.'
                  }
                />
              ) : null}
            </AdminDataShell>
          </AdminQueryState>
        </section>
      ) : null}

      {view === 'disputes' ? <AdminDisputesSection /> : null}

      {view === 'reconciliation' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Start date</span>
              <input
                type="date"
                className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                value={reconStart}
                onChange={(e) => {
                  setReconStart(e.target.value);
                  setReconPage(1);
                }}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">End date</span>
              <input
                type="date"
                className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                value={reconEnd}
                onChange={(e) => {
                  setReconEnd(e.target.value);
                  setReconPage(1);
                }}
              />
            </label>
          </div>
          {reconView.kpis.length > 0 ? (
            <AdminMetricStrip
              items={reconView.kpis.map((k) => ({ label: k.label, value: k.value }))}
              max={4}
            />
          ) : null}
          <AdminDataShell
            footer={
              reconPagination ? (
                <Pagination
                  page={reconPagination.page}
                  pageSize={reconPagination.limit}
                  total={reconPagination.total}
                  onPageChange={setReconPage}
                />
              ) : undefined
            }
          >
            {reconciliation.isLoading ? <SkeletonTable rows={4} cols={6} /> : null}
            {!reconciliation.isLoading && reconciliation.error ? (
              <ErrorState
                message={getApiErrorMessage(reconciliation.error, 'Could not load reconciliation')}
                onRetry={() => void reconciliation.refetch()}
              />
            ) : null}
            {!reconciliation.isLoading && !reconciliation.error ? (
              <div className="space-y-6">
                {reconView.mismatches.length > 0 ? (
                  <div className="space-y-2">
                    <Text className="text-sm font-semibold text-foreground">Mismatches</Text>
                    <DataTable
                      className={adminDataTableClass}
                      columns={reconMismatchColumns}
                      rows={reconView.mismatches}
                      getRowId={(row) => rowId(row) || JSON.stringify(row)}
                      emptyTitle="No mismatches"
                    />
                  </div>
                ) : null}
                {reconView.payments.length > 0 ? (
                  <div className="space-y-2">
                    <Text className="text-sm font-semibold text-foreground">Payments in range</Text>
                    <DataTable
                      className={adminDataTableClass}
                      columns={reconPaymentColumns}
                      rows={reconView.payments}
                      getRowId={(row) =>
                        rowId(row) || String(row.reference ?? row.id ?? JSON.stringify(row))
                      }
                      emptyTitle="No payments in this range"
                    />
                  </div>
                ) : null}
                {reconView.payments.length === 0 &&
                reconView.mismatches.length === 0 &&
                reconView.kpis.length === 0 ? (
                  <ErrorState
                    title="No reconciliation data"
                    message="The API returned no summary KPIs, payments, or mismatches for this date range."
                    onRetry={() => void reconciliation.refetch()}
                  />
                ) : null}
                {reconView.payments.length === 0 &&
                reconView.mismatches.length === 0 &&
                reconView.kpis.length > 0 ? (
                  <Text className="text-sm text-muted-foreground">
                    Summary loaded. No payment or mismatch rows were included in this response.
                  </Text>
                ) : null}
              </div>
            ) : null}
          </AdminDataShell>
        </section>
      ) : null}

      <DebugApiSection
        payloads={{
          milestones: milestones.data,
          payments: paymentsQ.data,
          reconciliation: reconciliation.data,
        }}
      />
    </div>
  );
}
