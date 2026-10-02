import { asRecord } from '@/lib/client-api-view';

export type DeliverableFileLink = {
  url: string;
  label: string;
  mediaId?: string;
  size?: number;
};

export type DeliverableRow = {
  id: string;
  label: string;
  status: string;
  milestoneId?: string;
  files: DeliverableFileLink[];
};

export type DeliverableSummary = {
  total: number;
  completed: number;
  pending: number;
  awaitingReview: number;
};

export type DeliverableMilestoneGroup = {
  milestoneId: string;
  milestoneLabel: string;
  items: DeliverableRow[];
};

function parseMediaEntry(entry: unknown, fallbackIndex: number): DeliverableFileLink | null {
  const link = asRecord(entry);
  if (!link) return null;

  const urls = asRecord(link.urls);
  const nestedUrl =
    urls &&
    (typeof urls.original === 'string'
      ? urls.original
      : typeof urls.preview === 'string'
        ? urls.preview
        : typeof urls.thumbnail === 'string'
          ? urls.thumbnail
          : '');

  const url =
    link.url != null && String(link.url) ? String(link.url) : nestedUrl ? String(nestedUrl) : '';
  const mediaId =
    link.mediaId != null ? String(link.mediaId) : link.id != null ? String(link.id) : undefined;
  const label = String(link.label ?? link.filename ?? link.name ?? `File ${fallbackIndex + 1}`);
  const size = typeof link.size === 'number' ? link.size : undefined;

  if (!url && !mediaId) return null;
  return { url, label, mediaId, size };
}

function parseDeliverableItem(item: unknown, index: number): DeliverableRow {
  const o = asRecord(item) ?? {};

  const mediaFromApi = Array.isArray(o.media)
    ? (o.media as unknown[])
        .map((entry, j) => parseMediaEntry(entry, j))
        .filter((x): x is DeliverableFileLink => x != null)
    : [];

  const mediaUrls = Array.isArray(o.mediaUrls)
    ? (o.mediaUrls as unknown[])
        .map((entry, j) => parseMediaEntry(entry, j))
        .filter((x): x is DeliverableFileLink => x != null)
    : [];

  const attachmentIds = Array.isArray(o.attachments)
    ? (o.attachments as unknown[]).map((id) => String(id))
    : [];

  const resolvedFiles = mediaFromApi.length > 0 ? mediaFromApi : mediaUrls;
  const filesFromIds =
    resolvedFiles.length === 0 && attachmentIds.length > 0
      ? attachmentIds.map((id, j) => ({
          url: '',
          label: `File ${j + 1}`,
          mediaId: id,
        }))
      : [];

  const files = resolvedFiles.length > 0 ? resolvedFiles : filesFromIds;
  const rawName = String(o.name ?? o.title ?? o.description ?? o.filename ?? '').trim();
  const isGenericName = !rawName || /^deliverable(\s+upload)?$/i.test(rawName);
  const fileLabel = files[0]?.label?.trim();
  const label =
    isGenericName && fileLabel ? fileLabel : rawName || fileLabel || String(o.id ?? 'Deliverable');

  return {
    id: String(o.id ?? `row-${index}`),
    label,
    status: String(o.status ?? ''),
    milestoneId: o.milestoneId != null ? String(o.milestoneId) : undefined,
    files,
  };
}

export function extractDeliverables(data: unknown): DeliverableRow[] {
  const r = asRecord(data);
  if (!r) return [];
  const raw = Array.isArray(r.items)
    ? r.items
    : Array.isArray(r.deliverables)
      ? r.deliverables
      : [];
  return (raw as unknown[]).map((item, i) => parseDeliverableItem(item, i));
}

export function extractDeliverableSummary(data: unknown): DeliverableSummary {
  const r = asRecord(data);
  const rows = extractDeliverables(data);

  const awaitingReview = rows.filter((d) => canClientReviewDeliverable(d.status)).length;
  const completedFromRows = rows.filter((d) => d.status.toUpperCase() === 'APPROVED').length;
  const pendingFromRows = rows.filter((d) => {
    const s = d.status.toUpperCase();
    return s === 'PENDING' || s === 'IN_PROGRESS';
  }).length;

  return {
    total: typeof r?.total === 'number' ? r.total : rows.length,
    completed: typeof r?.completed === 'number' ? r.completed : completedFromRows,
    pending: typeof r?.pending === 'number' ? r.pending : pendingFromRows,
    awaitingReview,
  };
}

export function groupDeliverablesByMilestone(
  rows: DeliverableRow[],
  milestoneLabels: Map<string, string>
): DeliverableMilestoneGroup[] {
  const groups = new Map<string, DeliverableRow[]>();

  for (const row of rows) {
    const milestoneId = row.milestoneId ?? 'unassigned';
    const bucket = groups.get(milestoneId) ?? [];
    bucket.push(row);
    groups.set(milestoneId, bucket);
  }

  return Array.from(groups.entries()).map(([milestoneId, items]) => ({
    milestoneId,
    milestoneLabel:
      milestoneId === 'unassigned'
        ? 'General deliverables'
        : (milestoneLabels.get(milestoneId) ?? 'Milestone'),
    items,
  }));
}

export function formatDeliverableStatusLabel(status: string | undefined): string {
  const s = (status ?? '').trim().toUpperCase();
  switch (s) {
    case 'PENDING':
      return 'Awaiting upload';
    case 'IN_PROGRESS':
      return 'In progress';
    case 'READY_FOR_REVIEW':
      return 'Ready for your review';
    case 'REVISION_REQUESTED':
      return 'Revision in progress';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    default:
      return status ? status.replace(/_/g, ' ') : '—';
  }
}

export function deliverableStatusBadgeVariant(
  status: string | undefined
): 'success' | 'warning' | 'neutral' | 'error' | 'info' {
  const s = (status ?? '').trim().toUpperCase();
  if (s === 'APPROVED') return 'success';
  if (s === 'READY_FOR_REVIEW') return 'warning';
  if (s === 'REJECTED') return 'error';
  if (s === 'IN_PROGRESS' || s === 'REVISION_REQUESTED') return 'info';
  if (s === 'PENDING') return 'neutral';
  return 'neutral';
}

/** Client may accept/reject only after admin uploads and marks ready for review. */
export function canClientReviewDeliverable(
  status: string,
  milestoneStatus?: string | null
): boolean {
  if (status.trim().toUpperCase() !== 'READY_FOR_REVIEW') return false;
  // NL-DEL-003: hide review CTAs when the parent milestone is already closed.
  const ms = String(milestoneStatus ?? '')
    .trim()
    .toUpperCase();
  if (ms === 'APPROVED' || ms === 'CANCELLED') return false;
  return true;
}
