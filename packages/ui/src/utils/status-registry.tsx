import type { ComponentProps } from 'react';

import { StatusBadge } from '../components/dashboard/StatusBadge';

type StatusVariant = NonNullable<ComponentProps<typeof StatusBadge>['variant']>;

const REQUEST_STATUS: Record<string, StatusVariant> = {
  draft: 'neutral',
  submitted: 'info',
  under_review: 'warning',
  quoted: 'purple',
  accepted: 'success',
  rejected: 'error',
  cancelled: 'neutral',
};

const PROJECT_STATUS: Record<string, StatusVariant> = {
  created: 'neutral',
  pending_payment: 'warning',
  in_progress: 'info',
  review: 'warning',
  completed: 'success',
  archived: 'neutral',
  cancelled: 'neutral',
  revision_requested: 'error',
  on_hold: 'warning',
  // Legacy / alias values
  active: 'success',
  paused: 'warning',
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  created: 'Created',
  pending_payment: 'Pending payment',
  in_progress: 'In progress',
  review: 'Ready for review',
  completed: 'Completed',
  archived: 'Archived',
  cancelled: 'Cancelled',
  revision_requested: 'Revision requested',
  on_hold: 'On hold',
  active: 'Active',
  paused: 'Paused',
};

const QUOTE_STATUS: Record<string, StatusVariant> = {
  draft: 'neutral',
  pending: 'warning',
  sent: 'info',
  viewed: 'info',
  accepted: 'success',
  declined: 'error',
  expired: 'warning',
  changes_requested: 'warning',
  revised: 'info',
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending',
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  changes_requested: 'Changes requested',
  revised: 'Revised',
};

const USER_STATUS: Record<string, StatusVariant> = {
  active: 'success',
  suspended: 'error',
  pending: 'warning',
  inactive: 'neutral',
};

/** API may send `PENDING_PAYMENT`, `pendingPayment`, or `pending payment`. */
export function normalizeStatusKey(status: string | null | undefined): string {
  // Coerce — non-string status previously threw and white-screened the project hub.
  return String(status ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/\s+/g, '_');
}

export function formatDomainStatusLabel(
  domain: 'request' | 'project' | 'quote' | 'user',
  status: string | null | undefined
): string {
  const key = normalizeStatusKey(status);
  if (!key) return 'Unknown';
  if (domain === 'project' && PROJECT_STATUS_LABELS[key]) {
    return PROJECT_STATUS_LABELS[key];
  }
  if (domain === 'quote' && QUOTE_STATUS_LABELS[key]) {
    return QUOTE_STATUS_LABELS[key];
  }
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function resolveStatusVariant(
  domain: 'request' | 'project' | 'quote' | 'user',
  status: string | null | undefined
): StatusVariant {
  const key = normalizeStatusKey(status);
  const map =
    domain === 'request'
      ? REQUEST_STATUS
      : domain === 'project'
        ? PROJECT_STATUS
        : domain === 'quote'
          ? QUOTE_STATUS
          : USER_STATUS;
  const variant = map[key];
  if (!variant && typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(`[status-registry] Unknown ${domain} status: ${status}`);
  }
  return variant ?? 'neutral';
}

export function DomainStatusBadge({
  domain,
  status,
  className,
}: {
  domain: 'request' | 'project' | 'quote' | 'user';
  status: string | null | undefined;
  className?: string;
}) {
  return (
    <StatusBadge variant={resolveStatusVariant(domain, status)} dot className={className}>
      {formatDomainStatusLabel(domain, status)}
    </StatusBadge>
  );
}
