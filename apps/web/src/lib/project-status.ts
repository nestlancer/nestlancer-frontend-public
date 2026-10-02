/** Project lifecycle helpers aligned with backend ProjectStatus enum. */

export function normalizeProjectStatusKey(status: string | undefined): string {
  return (status ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/\s+/g, '_');
}

export function formatProjectStatusLabel(status: string | undefined): string {
  const key = normalizeProjectStatusKey(status);
  switch (key) {
    case 'created':
      return 'Created';
    case 'pending_payment':
      return 'Pending payment';
    case 'in_progress':
      return 'In progress';
    case 'review':
      return 'Ready for review';
    case 'completed':
      return 'Completed';
    case 'archived':
      return 'Archived';
    case 'cancelled':
      return 'Cancelled';
    case 'revision_requested':
      return 'Revision requested';
    case 'on_hold':
      return 'On hold';
    case 'active':
      return 'Active';
    case 'paused':
      return 'Paused';
    default:
      return status ? String(status).replace(/_/g, ' ') : '—';
  }
}

/** Client may approve the whole project or request a revision at these stages. */
export function canClientActOnProject(status: string | undefined): boolean {
  const key = normalizeProjectStatusKey(status);
  return key === 'review' || key === 'revision_requested';
}
