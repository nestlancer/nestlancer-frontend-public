'use client';

import { cn } from '@nestlancer/ui';

import { PROJECT_HUB_TAB_LABELS, PROJECT_HUB_TABS, type ProjectHubTab } from './project-hub-tabs';

export function ProjectHubTabBar({
  active,
  onChange,
  className,
}: {
  active: ProjectHubTab;
  /** Omit on loading/server chrome — functions cannot cross the RSC boundary. */
  onChange?: (tab: ProjectHubTab) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-h-12 items-stretch gap-1 overflow-x-auto scrollbar-none border-b border-border/80 pe-2',
        className
      )}
      role="tablist"
      aria-label="Project sections"
    >
      {PROJECT_HUB_TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`project-tab-${tab}`}
            aria-selected={isActive}
            aria-disabled={onChange ? undefined : true}
            disabled={!onChange}
            aria-controls={`project-panel-${tab}`}
            className={cn(
              'shrink-0 border-b-2 px-4 py-3.5 text-sm font-medium leading-snug transition-theme',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => onChange?.(tab)}
          >
            {PROJECT_HUB_TAB_LABELS[tab]}
          </button>
        );
      })}
    </div>
  );
}
