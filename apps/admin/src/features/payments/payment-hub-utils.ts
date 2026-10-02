import { formatMoneyFromPaise } from '@nestlancer/utils';

import { pickAdminRecord, pickAdminRows, rowId } from '@/lib/admin-response';
import { cellPreview, humanizeKey } from '@/lib/admin-view-model';

export type MilestoneRow = Record<string, unknown>;
export type PaymentRow = Record<string, unknown>;
export type ReconciliationRow = Record<string, unknown>;

export type ProjectPaymentSummary = {
  projectId: string;
  projectTitle: string;
  /** Billable installment count (payment schedule rows only). */
  milestoneCount: number;
  paidCount: number;
  pendingCount: number;
  paidAmountPaise: number;
  pendingAmountPaise: number;
  totalBudgetPaise: number;
  progressPercent: number;
  awaitingApprovalCount: number;
  /** Work/delivery milestones (excludes pay-only schedule rows). */
  deliveryCount: number;
  milestones: MilestoneRow[];
};

export type ProjectBillingStatus = 'complete' | 'partial' | 'pending' | 'none';

const SCHEDULE_PAYMENT_NAME =
  /^(deposit|full payment|mid[- ]?project payment|final payment|milestone \d+|payment \d+)\b/i;

export function projectBillingStatus(
  summary: Pick<
    ProjectPaymentSummary,
    'paidCount' | 'milestoneCount' | 'paidAmountPaise' | 'totalBudgetPaise'
  >
): ProjectBillingStatus {
  if (summary.milestoneCount === 0) return 'none';
  if (summary.paidCount >= summary.milestoneCount) return 'complete';
  if (summary.paidCount > 0 || summary.paidAmountPaise > 0) return 'partial';
  return 'pending';
}

export function projectBillingStatusLabel(status: ProjectBillingStatus): string {
  switch (status) {
    case 'complete':
      return 'Fully paid';
    case 'partial':
      return 'Partial';
    case 'pending':
      return 'Outstanding';
    default:
      return 'No milestones';
  }
}

export function milestoneLabel(row: MilestoneRow): string {
  const title = row.title ?? row.name ?? row.milestoneTitle;
  if (typeof title === 'string' && title.trim()) return title;
  const id = rowId(row) || String(row.id ?? '');
  return id ? `Milestone ${id.slice(0, 8)}…` : '—';
}

export function projectLabel(row: MilestoneRow | PaymentRow): string {
  if (row.project && typeof row.project === 'object') {
    const title = (row.project as Record<string, unknown>).title;
    if (typeof title === 'string' && title.trim()) return title.trim();
  }
  const directTitle = row.projectTitle ?? row.projectName ?? row.project_title;
  if (typeof directTitle === 'string' && directTitle.trim()) return directTitle.trim();
  const projectId = projectIdFromRow(row);
  return projectId || '—';
}

export function resolveProjectTitle(milestones: MilestoneRow[], projectId: string): string {
  for (const row of milestones) {
    const label = projectLabel(row);
    if (label && label !== '—' && label !== projectId) return label;
  }
  return projectId;
}

export function formatProjectIdLabel(projectId: string): string {
  if (!projectId) return '—';
  return projectId.length > 16 ? `${projectId.slice(0, 8)}…${projectId.slice(-4)}` : projectId;
}

export function projectIdFromRow(row: MilestoneRow | PaymentRow): string {
  const direct = row.projectId ?? row.project_id;
  if (typeof direct === 'string' && direct) return direct;
  if (typeof direct === 'number') return String(direct);
  if (row.project && typeof row.project === 'object') {
    const id = (row.project as Record<string, unknown>).id;
    if (typeof id === 'string' && id) return id;
  }
  return '';
}

export function formatAdminCurrency(amount: unknown, currency: unknown): string {
  if (typeof amount !== 'number') return String(amount ?? '—');
  return formatMoneyFromPaise(amount, String(currency ?? 'INR'), 'en-IN');
}

export function formatDeliveryStatusLabel(status: string): string {
  const s = status.trim().toUpperCase();
  switch (s) {
    case 'PENDING':
      return 'Awaiting work';
    case 'IN_PROGRESS':
      return 'Work in progress';
    case 'COMPLETED':
      return 'Awaiting client approval';
    case 'APPROVED':
      return 'Approved';
    case 'REVISION_REQUESTED':
      return 'Revision requested';
    default:
      return status.replace(/_/g, ' ');
  }
}

export function formatPaymentStatusLabel(
  status: string,
  opts?: { paymentRequestedAt?: string | null }
): string {
  const s = status.trim().toUpperCase();
  switch (s) {
    case 'COMPLETED':
      return 'Paid';
    case 'PENDING':
      return 'Payment due';
    case 'PENDING_VERIFICATION':
      return 'Awaiting verification';
    case 'CREATED':
      return opts?.paymentRequestedAt ? 'Payment due' : 'Not requested';
    case 'FAILED':
      return 'Failed';
    case 'REFUNDED':
      return 'Refunded';
    default:
      return status.replace(/_/g, ' ');
  }
}

/** Work row that only mirrors a linked installment — never bill this amount. */
export function isLinkedWorkMilestoneRow(row: MilestoneRow): boolean {
  return typeof row.linkedInstallmentId === 'string' && row.linkedInstallmentId.length > 0;
}

/**
 * Billable installment rows: deposit / Mid / Final / schedule payments.
 * Excludes work deliveries that only surface a linked installment status.
 */
export function isBillableMilestoneRow(row: MilestoneRow): boolean {
  if (isLinkedWorkMilestoneRow(row)) return false;
  if (row.isPayOnly === true) return true;
  if (row.isDeposit === true) return true;
  const paymentsCount = typeof row.paymentsCount === 'number' ? row.paymentsCount : 0;
  if (paymentsCount > 0) return true;
  const name =
    typeof row.name === 'string' ? row.name : typeof row.title === 'string' ? row.title : '';
  if (SCHEDULE_PAYMENT_NAME.test(name.trim())) return true;
  const percentage = typeof row.percentage === 'number' ? row.percentage : 0;
  return percentage > 0;
}

export function isDeliveryMilestoneRow(row: MilestoneRow): boolean {
  if (isBillableMilestoneRow(row) && !isLinkedWorkMilestoneRow(row)) {
    // Pay-only schedule rows are not deliveries.
    if (row.isPayOnly === true || row.isDeposit === true) return false;
    const name =
      typeof row.name === 'string' ? row.name : typeof row.title === 'string' ? row.title : '';
    if (SCHEDULE_PAYMENT_NAME.test(name.trim())) return false;
  }
  if (isLinkedWorkMilestoneRow(row)) return true;
  if (row.isPayOnly === true || row.isDeposit === true) return false;
  const name =
    typeof row.name === 'string' ? row.name : typeof row.title === 'string' ? row.title : '';
  if (SCHEDULE_PAYMENT_NAME.test(name.trim())) return false;
  return true;
}

export function milestoneRowType(row: MilestoneRow): 'installment' | 'delivery' {
  return isBillableMilestoneRow(row) ? 'installment' : 'delivery';
}

export function billableAmountPaise(row: MilestoneRow): number {
  if (typeof row.billableAmount === 'number') return row.billableAmount;
  if (typeof row.amount === 'number') return row.amount;
  return 0;
}

export function installmentSlotCounts(rows: PaymentRow[]): {
  paid: number;
  due: number;
  scheduled: number;
} {
  let paid = 0;
  let due = 0;
  for (const row of rows) {
    const status = String(row.status ?? '').toUpperCase();
    if (status === 'COMPLETED') {
      paid += 1;
    } else if (
      status === 'PENDING' ||
      status === 'PENDING_VERIFICATION' ||
      (status === 'CREATED' && Boolean(row.paymentRequestedAt))
    ) {
      due += 1;
    }
  }
  return { paid, due, scheduled: Math.max(0, rows.length - paid - due) };
}

export function groupMilestonesByProject(rows: MilestoneRow[]): ProjectPaymentSummary[] {
  const byProject = new Map<string, MilestoneRow[]>();

  for (const row of rows) {
    const projectId = projectIdFromRow(row);
    if (!projectId) continue;
    if (!byProject.has(projectId)) byProject.set(projectId, []);
    byProject.get(projectId)!.push(row);
  }

  return Array.from(byProject.entries())
    .map(([projectId, milestones]) => {
      let paidCount = 0;
      let pendingCount = 0;
      let paidAmountPaise = 0;
      let pendingAmountPaise = 0;
      let totalBudgetPaise = 0;
      let awaitingApprovalCount = 0;
      let installmentCount = 0;
      let deliveryCount = 0;

      for (const milestone of milestones) {
        const deliveryStatus = String(milestone.status ?? '').toUpperCase();
        if (isDeliveryMilestoneRow(milestone)) {
          deliveryCount += 1;
          if (deliveryStatus === 'COMPLETED') {
            awaitingApprovalCount += 1;
          }
        }

        if (!isBillableMilestoneRow(milestone)) continue;

        installmentCount += 1;
        const payStatus = String(milestone.latestStatus ?? '').toUpperCase();
        const amount = billableAmountPaise(milestone);
        totalBudgetPaise += amount;

        if (payStatus === 'COMPLETED') {
          paidCount += 1;
          paidAmountPaise += amount;
        } else if (
          payStatus === 'PENDING' ||
          payStatus === 'CREATED' ||
          payStatus === 'PENDING_VERIFICATION'
        ) {
          pendingCount += 1;
          pendingAmountPaise += amount;
        }
      }

      const progressPercent =
        totalBudgetPaise > 0
          ? Math.round((paidAmountPaise / totalBudgetPaise) * 100)
          : installmentCount > 0
            ? Math.round((paidCount / installmentCount) * 100)
            : 0;

      const projectTitle = resolveProjectTitle(milestones, projectId);
      return {
        projectId,
        projectTitle,
        milestoneCount: installmentCount,
        paidCount,
        pendingCount,
        paidAmountPaise,
        pendingAmountPaise,
        totalBudgetPaise,
        progressPercent,
        awaitingApprovalCount,
        deliveryCount,
        milestones,
      };
    })
    .sort((a, b) => a.projectTitle.localeCompare(b.projectTitle));
}

function asObjectRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x) => x && typeof x === 'object') as Record<string, unknown>[];
}

export type ReconciliationView = {
  record: Record<string, unknown> | null;
  payments: Record<string, unknown>[];
  mismatches: Record<string, unknown>[];
  kpis: { label: string; value: string }[];
};

/** Parse reconciliation envelopes that are summary objects, not list rows. */
export function parseReconciliationPayload(payload: unknown): ReconciliationView {
  const fromList = pickAdminRows(payload);
  const record = pickAdminRecord(payload);
  const source =
    record ??
    (payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null);

  const payments =
    [
      asObjectRows(source?.payments),
      asObjectRows(source?.transactions),
      asObjectRows(source?.records),
    ].find((rows) => rows.length > 0) ?? [];
  const mismatches =
    [
      asObjectRows(source?.mismatches),
      asObjectRows(source?.discrepancies),
      asObjectRows(source?.exceptions),
      asObjectRows(source?.unmatched),
    ].find((rows) => rows.length > 0) ?? [];

  const paymentRows = payments.length > 0 ? payments : fromList;
  const mismatchRows = mismatches;

  const kpis: { label: string; value: string }[] = [];
  if (source) {
    const skip = new Set([
      'payments',
      'transactions',
      'records',
      'items',
      'mismatches',
      'discrepancies',
      'exceptions',
      'unmatched',
      'data',
      'summary',
      'pagination',
    ]);
    const flatEntries: [string, unknown][] = [...Object.entries(source)];
    if (source.summary && typeof source.summary === 'object' && !Array.isArray(source.summary)) {
      for (const [k, v] of Object.entries(source.summary as Record<string, unknown>)) {
        flatEntries.push([k, v]);
      }
    }
    for (const [key, val] of flatEntries) {
      if (skip.has(key) || Array.isArray(val) || (val && typeof val === 'object')) continue;
      if (val == null) continue;
      kpis.push({ label: humanizeKey(key), value: cellPreview(val) });
      if (kpis.length >= 6) break;
    }
  }

  return {
    record: source,
    payments: paymentRows,
    mismatches: mismatchRows,
    kpis,
  };
}
