export const WORK_HUB_VIEWS = ['all', 'requests', 'projects'] as const;

export type WorkHubView = (typeof WORK_HUB_VIEWS)[number];

export const WORK_HUB_VIEW_LABELS: Record<WorkHubView, string> = {
  all: 'All',
  requests: 'Requests',
  projects: 'Projects',
};

export function parseWorkHubView(value: string | null): WorkHubView {
  if (value && WORK_HUB_VIEWS.includes(value as WorkHubView)) {
    return value as WorkHubView;
  }
  return 'requests';
}
