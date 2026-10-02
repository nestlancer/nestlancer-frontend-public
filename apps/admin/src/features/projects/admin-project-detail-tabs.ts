export const ADMIN_PROJECT_DETAIL_TABS = ['overview', 'delivery', 'progress', 'analytics'] as const;

export type AdminProjectDetailTab = (typeof ADMIN_PROJECT_DETAIL_TABS)[number];

export const ADMIN_PROJECT_DETAIL_TAB_LABELS: Record<AdminProjectDetailTab, string> = {
  overview: 'Overview',
  delivery: 'Milestones & files',
  progress: 'Daily progress',
  analytics: 'Analytics',
};

export const ADMIN_PROJECT_DETAIL_TAB_HINTS: Record<AdminProjectDetailTab, string> = {
  overview: 'Project details, status, client, and operator assignment',
  delivery: 'Milestone phases, deliverable uploads, and file reviews',
  progress: 'End-of-day updates for the client',
  analytics: 'Metrics and progress statistics',
};

const ADMIN_PROJECT_TAB_ALIASES: Record<string, AdminProjectDetailTab> = {
  operations: 'delivery',
  files: 'delivery',
  billing: 'delivery',
  milestones: 'delivery',
  deliverables: 'delivery',
  invoices: 'delivery',
};

export function parseAdminProjectDetailTab(value: string | null): AdminProjectDetailTab {
  if (!value) return 'overview';
  const normalized = value.trim().toLowerCase();
  if (ADMIN_PROJECT_DETAIL_TABS.includes(normalized as AdminProjectDetailTab)) {
    return normalized as AdminProjectDetailTab;
  }
  return ADMIN_PROJECT_TAB_ALIASES[normalized] ?? 'overview';
}
