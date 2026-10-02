import { NOTIFICATION_PREFERENCE_CATEGORIES } from '@nestlancer/utils/notifications';

export const NOTIFICATION_TABS = [
  'all',
  'unread',
  ...NOTIFICATION_PREFERENCE_CATEGORIES,
  'settings',
] as const;

export type NotificationTab = (typeof NOTIFICATION_TABS)[number];

export const NOTIFICATION_TAB_LABELS: Record<NotificationTab, string> = {
  all: 'All',
  unread: 'Unread',
  quotes: 'Quotes',
  payments: 'Payments',
  messages: 'Messages',
  projects: 'Projects',
  requests: 'Requests',
  account: 'Account',
  settings: 'Settings',
};

export function parseNotificationTab(raw: string | null): NotificationTab {
  if (!raw) return 'all';
  return (NOTIFICATION_TABS as readonly string[]).includes(raw) ? (raw as NotificationTab) : 'all';
}
