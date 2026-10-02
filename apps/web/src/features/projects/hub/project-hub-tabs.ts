export const PROJECT_HUB_TABS = [
  'overview',
  'progress',
  'milestones',
  'deliverables',
  'messages',
  'files',
] as const;

export type ProjectHubTab = (typeof PROJECT_HUB_TABS)[number];

export const PROJECT_HUB_TAB_LABELS: Record<ProjectHubTab, string> = {
  overview: 'Overview',
  progress: 'Progress',
  milestones: 'Milestones',
  deliverables: 'Deliverables',
  messages: 'Messages',
  files: 'Files',
};

const PROJECT_HUB_TAB_ALIASES: Record<string, ProjectHubTab> = {
  delivery: 'deliverables',
  deliverable: 'deliverables',
  billing: 'files',
  invoices: 'files',
  payments: 'milestones',
  operations: 'deliverables',
};

export function parseProjectHubTab(value: string | null): ProjectHubTab {
  if (!value) return 'overview';
  const normalized = value.trim().toLowerCase();
  if (PROJECT_HUB_TABS.includes(normalized as ProjectHubTab)) {
    return normalized as ProjectHubTab;
  }
  return PROJECT_HUB_TAB_ALIASES[normalized] ?? 'overview';
}
