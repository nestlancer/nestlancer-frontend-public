'use client';

import { cn } from '@nestlancer/ui';

import {
  NOTIFICATION_TABS,
  NOTIFICATION_TAB_LABELS,
  type NotificationTab,
} from './notifications-tabs';

export function NotificationsTabBar({
  active,
  onChange,
  unreadCount,
  className,
}: {
  active: NotificationTab;
  onChange: (tab: NotificationTab) => void;
  unreadCount?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-h-12 items-stretch gap-1 overflow-x-auto scrollbar-none border-b border-border/80 pe-2',
        className
      )}
      role="tablist"
      aria-label="Notification views"
    >
      {NOTIFICATION_TABS.map((tab) => {
        const isActive = tab === active;
        const label =
          tab === 'unread' && unreadCount != null && unreadCount > 0
            ? `${NOTIFICATION_TAB_LABELS[tab]} (${unreadCount})`
            : NOTIFICATION_TAB_LABELS[tab];
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cn(
              'shrink-0 border-b-2 px-4 py-3.5 text-sm font-medium leading-snug transition-theme',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => onChange(tab)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
