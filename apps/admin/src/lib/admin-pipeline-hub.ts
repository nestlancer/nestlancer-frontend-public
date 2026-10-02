import type { KpiItem } from '@/lib/admin-view-model';
import { rowId, rowTitle } from '@/lib/admin-response';

/** Default page size for pipeline hub entity-scoped list queries. */
export const PIPELINE_HUB_LIST_LIMIT = 50;

export type PipelineHubListQuery = {
  page: number;
  limit: number;
};

/** Server-side filters for user pipeline hub list APIs. */
export function userPipelineRequestsQuery(
  userId: string
): PipelineHubListQuery & { userId: string; status: string } {
  return { page: 1, limit: PIPELINE_HUB_LIST_LIMIT, userId, status: 'all' };
}

export function userPipelineQuotesQuery(
  userId: string
): PipelineHubListQuery & { userId: string; status: string } {
  return { page: 1, limit: PIPELINE_HUB_LIST_LIMIT, userId, status: 'all' };
}

export function userPipelineProjectsQuery(
  userId: string
): PipelineHubListQuery & { clientId: string } {
  return { page: 1, limit: PIPELINE_HUB_LIST_LIMIT, clientId: userId };
}

export function userPipelinePaymentsQuery(
  userId: string
): PipelineHubListQuery & { clientId: string } {
  return { page: 1, limit: PIPELINE_HUB_LIST_LIMIT, clientId: userId };
}

export function userPipelineFlaggedQuery(
  userId: string
): PipelineHubListQuery & { userId: string } {
  return { page: 1, limit: PIPELINE_HUB_LIST_LIMIT, userId };
}

/** Server-side filter for project pipeline hub payments. */
export function projectPipelinePaymentsQuery(
  projectId: string
): PipelineHubListQuery & { projectId: string } {
  return { page: 1, limit: PIPELINE_HUB_LIST_LIMIT, projectId };
}

/** Resolve owning user id from heterogeneous admin list rows. */
export function rowUserId(row: Record<string, unknown>): string {
  const direct = row.userId ?? row.clientId;
  if (typeof direct === 'string' && direct) return direct;
  if (typeof direct === 'number') return String(direct);
  for (const key of ['user', 'client']) {
    const rel = row[key];
    if (rel && typeof rel === 'object') {
      const id = (rel as Record<string, unknown>).id;
      if (typeof id === 'string' && id) return id;
    }
  }
  return '';
}

export function filterRowsForUser(
  rows: Record<string, unknown>[],
  userId: string
): Record<string, unknown>[] {
  return rows.filter((r) => rowUserId(r) === userId);
}

export function filterRowsForProject(
  rows: Record<string, unknown>[],
  projectId: string
): Record<string, unknown>[] {
  return rows.filter((r) => {
    const pid = r.projectId ?? r.project_id;
    if (typeof pid === 'string' && pid === projectId) return true;
    if (typeof pid === 'number' && String(pid) === projectId) return true;
    const proj = r.project;
    if (proj && typeof proj === 'object') {
      const id = (proj as Record<string, unknown>).id;
      if (String(id) === projectId) return true;
    }
    return rowId(r) === projectId;
  });
}

export function normalizeStatusKey(status: unknown): string {
  const s = String(status ?? '')
    .trim()
    .replace(/\s+/g, '');
  if (!s) return 'unknown';
  return s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

/** Count rows grouped by status field (case-insensitive keys). */
export function countByStatus(
  rows: Record<string, unknown>[],
  statusField = 'status'
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = normalizeStatusKey(row[statusField]);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function countWithPredicate(
  rows: Record<string, unknown>[],
  pred: (row: Record<string, unknown>) => boolean
): number {
  return rows.filter(pred).length;
}

export type PipelineCategoryId =
  | 'requests'
  | 'quotes'
  | 'projects'
  | 'payments'
  | 'messages'
  | 'trust';

export const PIPELINE_CATEGORY_LABELS: Record<PipelineCategoryId, string> = {
  requests: 'Requests',
  quotes: 'Quotes',
  projects: 'Projects',
  payments: 'Payments',
  messages: 'Messages',
  trust: 'Trust & account',
};

export type CrossComboAlert = {
  id: string;
  label: string;
  severity: 'crit' | 'warn';
  action: string;
};

export type UserPipelineSnapshot = {
  requests: Record<string, unknown>[];
  quotes: Record<string, unknown>[];
  projects: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  requestCounts: Record<string, number>;
  quoteCounts: Record<string, number>;
  projectCounts: Record<string, number>;
  paymentCounts: Record<string, number>;
  crossAlerts: CrossComboAlert[];
};

export function buildUserPipelineSnapshot(
  requests: Record<string, unknown>[],
  quotes: Record<string, unknown>[],
  projects: Record<string, unknown>[],
  payments: Record<string, unknown>[],
  flaggedCount: number
): UserPipelineSnapshot {
  const requestCounts = countByStatus(requests);
  const quoteCounts = countByStatus(quotes);
  const projectCounts = countByStatus(projects);
  const paymentCounts = countByStatus(payments);

  const acceptedQuotes = countWithPredicate(quotes, (r) =>
    ['accepted', 'accept'].includes(normalizeStatusKey(r.status))
  );
  const activeProjects = countWithPredicate(projects, (r) => {
    const s = normalizeStatusKey(r.status);
    return s === 'active' || s === 'in_progress' || s === 'inprogress';
  });
  const sentQuotes = countWithPredicate(quotes, (r) =>
    ['sent', 'pending'].includes(normalizeStatusKey(r.status))
  );
  const submittedRequests = requestCounts.submitted ?? 0;
  const underReview = requestCounts.underreview ?? requestCounts.under_review ?? 0;
  const pendingPayments = countWithPredicate(payments, (r) =>
    ['pending', 'created'].includes(normalizeStatusKey(r.status))
  );

  const crossAlerts: CrossComboAlert[] = [];
  if (acceptedQuotes > 0 && activeProjects === 0) {
    crossAlerts.push({
      id: 'acc-no-prj',
      label: 'Accepted quote, no active project',
      severity: 'crit',
      action: 'Verify quote→project creation',
    });
  }
  if (sentQuotes > 0) {
    crossAlerts.push({
      id: 'stale-sent',
      label: `${sentQuotes} sent quote(s) awaiting client`,
      severity: 'warn',
      action: 'Follow up or resend',
    });
  }
  if (activeProjects > 0 && pendingPayments > 0) {
    crossAlerts.push({
      id: 'pay-block',
      label: 'Active project with pending payments',
      severity: 'warn',
      action: 'Open payments console',
    });
  }
  if (flaggedCount > 0 && activeProjects > 0) {
    crossAlerts.push({
      id: 'flag-active',
      label: 'Flagged messages on active delivery',
      severity: 'crit',
      action: 'Review moderation',
    });
  }
  if (submittedRequests > 0 && underReview === 0) {
    crossAlerts.push({
      id: 'triage-gap',
      label: 'Submitted requests not yet under review',
      severity: 'warn',
      action: 'Assign operator',
    });
  }

  return {
    requests,
    quotes,
    projects,
    payments,
    requestCounts,
    quoteCounts,
    projectCounts,
    paymentCounts,
    crossAlerts,
  };
}

export function userPipelineKpis(snapshot: UserPipelineSnapshot, sessionCount: number): KpiItem[] {
  const openRequests =
    (snapshot.requestCounts.submitted ?? 0) +
    (snapshot.requestCounts.underreview ?? snapshot.requestCounts.under_review ?? 0);
  const activeProjects = countWithPredicate(snapshot.projects, (r) => {
    const s = normalizeStatusKey(r.status);
    return !['completed', 'archived', 'cancelled'].includes(s);
  });
  const pendingPay = countWithPredicate(snapshot.payments, (r) =>
    ['pending', 'created'].includes(normalizeStatusKey(r.status))
  );

  return [
    { label: 'Open requests', value: String(openRequests), hint: 'Submitted + in review' },
    { label: 'Quotes', value: String(snapshot.quotes.length), hint: 'All proposals' },
    { label: 'Active projects', value: String(activeProjects), href: undefined },
    { label: 'Pending payments', value: String(pendingPay) },
    { label: 'Cross alerts', value: String(snapshot.crossAlerts.length) },
    { label: 'Sessions', value: String(sessionCount) },
  ];
}

export function tableRowsFromRecords(
  rows: Record<string, unknown>[],
  limit = 8
): Record<string, string>[] {
  return rows.slice(0, limit).map((r) => ({
    id: rowId(r) || '—',
    title: rowTitle(r),
    status: String(r.status ?? '—'),
  }));
}

export const MILESTONE_LOOP_STEPS = [11, 12, 13, 14, 15, 16] as const;

export function projectProgressPercent(record: Record<string, unknown>): number {
  const p =
    record.overallProgress ??
    record.progress ??
    record.progressPercent ??
    record.completionPercentage;
  if (typeof p === 'number' && p >= 0 && p <= 100) return Math.round(p);
  if (typeof p === 'string' && p.trim() !== '' && !Number.isNaN(Number(p))) {
    return Math.min(100, Math.max(0, Math.round(Number(p))));
  }
  return 0;
}
