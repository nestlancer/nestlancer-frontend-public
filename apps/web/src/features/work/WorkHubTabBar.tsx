'use client';

import { cn } from '@nestlancer/ui';

import {
  webTabBarClass,
  webTabBarItemActiveClass,
  webTabBarItemClass,
  webTabBarItemInactiveClass,
} from '@/lib/tailadmin-classes';

import { WORK_HUB_VIEW_LABELS, WORK_HUB_VIEWS, type WorkHubView } from './work-hub-tabs';

export function WorkHubTabBar({
  active,
  onChange,
  counts,
  className,
}: {
  active: WorkHubView;
  onChange: (view: WorkHubView) => void;
  counts?: Partial<Record<WorkHubView, number>>;
  className?: string;
}) {
  return (
    <div className={cn(webTabBarClass, className)} role="tablist" aria-label="Work hub views">
      {WORK_HUB_VIEWS.map((view) => {
        const isActive = view === active;
        const count = counts?.[view];
        const label =
          count != null && count > 0
            ? `${WORK_HUB_VIEW_LABELS[view]} (${count})`
            : WORK_HUB_VIEW_LABELS[view];
        return (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cn(
              webTabBarItemClass,
              isActive ? webTabBarItemActiveClass : webTabBarItemInactiveClass
            )}
            onClick={() => onChange(view)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
