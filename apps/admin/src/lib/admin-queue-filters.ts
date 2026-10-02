/** Fixed admin queue/status filters — do not derive from current page rows. */

export type AdminQueueOption = { value: string; label: string };

export const ADMIN_REQUEST_QUEUE_OPTIONS: AdminQueueOption[] = [
  { value: 'inbox', label: 'Inbox (needs review)' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'underReview', label: 'Under review' },
  { value: 'changesRequested', label: 'Changes requested' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'convertedToProject', label: 'Converted to project' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'draft', label: 'Client drafts only' },
  { value: 'all', label: 'All statuses' },
];

export const ADMIN_QUOTE_QUEUE_OPTIONS: AdminQueueOption[] = [
  { value: 'inbox', label: 'Inbox (active)' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending send' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'changesRequested', label: 'Changes requested' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
  { value: 'all', label: 'All statuses' },
];

/** Statuses where admin can create a quote for a request. */
export const ADMIN_QUOTE_ELIGIBLE_REQUEST_STATUSES = new Set([
  'submitted',
  'underreview',
  'changesrequested',
]);

export function normalizeAdminStatusKey(status: unknown): string {
  return String(status ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/_/g, '')
    .toLowerCase();
}

export function canAdminCreateQuoteForRequest(status: unknown): boolean {
  return ADMIN_QUOTE_ELIGIBLE_REQUEST_STATUSES.has(normalizeAdminStatusKey(status));
}
