import type { StatusBadgeProps } from '@nestlancer/ui';

/** Normalize API statuses (`viewed`, `changesRequested`, `CHANGES_REQUESTED`) to `VIEWED`, etc. */
export function normalizeWorkStatus(status: unknown): string {
  return String(status ?? '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase()
    .replace(/-/g, '_');
}

export function canClientAcceptQuote(status: unknown): boolean {
  return ['SENT', 'VIEWED'].includes(normalizeWorkStatus(status));
}

export function canClientNegotiateQuote(status: unknown): boolean {
  return ['SENT', 'VIEWED', 'PENDING'].includes(normalizeWorkStatus(status));
}

export function workStatusBadgeVariant(status: string): NonNullable<StatusBadgeProps['variant']> {
  const s = status.toLowerCase().replace(/\s+/g, '_');
  if (['active', 'approved', 'accepted', 'completed', 'sent', 'closed'].includes(s)) {
    return 'success';
  }
  if (
    ['pending', 'draft', 'under_review', 'underreview', 'viewed', 'awaiting_review'].includes(s)
  ) {
    return 'warning';
  }
  if (['rejected', 'declined', 'cancelled', 'canceled', 'withdrawn'].includes(s)) {
    return 'error';
  }
  if (['in_progress', 'inprogress', 'review', 'quoted'].includes(s)) {
    return 'info';
  }
  if (['paused', 'revisionrequested', 'revision_requested'].includes(s)) {
    return 'purple';
  }
  return 'neutral';
}

/** Title-case a status for badges (e.g. ACCEPTED → "Accepted", not "A C C E P T E D"). */
export function formatWorkStatusLabel(status: string): string {
  const normalized = normalizeWorkStatus(status);
  if (!normalized) return '';
  return normalized
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
