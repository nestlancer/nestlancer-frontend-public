'use client';

import { Bell } from '@nestlancer/ui/icons';

import { Button } from '@nestlancer/ui';

export function NotificationBell({ count = 0 }: { count?: number }) {
  return (
    <Button type="button" variant="ghost" size="icon" aria-label="Notifications">
      <Bell className="h-5 w-5" />
      {count > 0 ? (
        <span className="sr-only">{count} unread notifications</span>
      ) : (
        <span className="sr-only">No unread notifications</span>
      )}
    </Button>
  );
}
