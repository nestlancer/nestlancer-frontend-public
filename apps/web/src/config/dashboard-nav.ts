import type { LucideIcon } from '@nestlancer/ui/icons';
import {
  Bell,
  CreditCard,
  FolderKanban,
  ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Receipt,
  Send,
  Settings,
  User,
} from '@nestlancer/ui/icons';

import { routes } from '@nestlancer/constants';

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

export type DashboardNavSection = {
  title: string;
  items: DashboardNavItem[];
};

/** Grouped sidebar navigation aligned with demo IA. */
export const DASHBOARD_NAV_SECTIONS: DashboardNavSection[] = [
  {
    title: 'Main',
    items: [
      { href: routes.dashboard, label: 'Dashboard', icon: LayoutDashboard },
      { href: routes.requests, label: 'Requests', icon: Send },
      { href: routes.projects, label: 'Projects', icon: FolderKanban },
      { href: routes.quotes, label: 'Quotes', icon: Receipt },
      { href: routes.messages, label: 'Messages', icon: MessageSquare },
      { href: routes.payments, label: 'Billing', icon: CreditCard },
      { href: routes.invoices, label: 'Invoices', icon: Receipt },
      { href: routes.notifications, label: 'Notifications', icon: Bell },
    ],
  },
  {
    title: 'Explore',
    items: [
      { href: routes.blog, label: 'Blog', icon: Newspaper },
      { href: routes.portfolio, label: 'Portfolio', icon: ImageIcon },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: routes.profile, label: 'Profile', icon: User },
      { href: routes.settingsAccount, label: 'Settings', icon: Settings },
    ],
  },
];

/** Flat list for backward compatibility and mobile shortcuts. */
export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = DASHBOARD_NAV_SECTIONS.flatMap(
  (section) => section.items
);

/** Shortcut row on mobile bottom bar. */
export const DASHBOARD_BOTTOM_NAV: DashboardNavItem[] = [
  DASHBOARD_NAV_ITEMS[0]!,
  DASHBOARD_NAV_ITEMS[2]!,
  DASHBOARD_NAV_ITEMS[4]!,
  DASHBOARD_NAV_ITEMS[5]!,
];

export function findActiveNavItem(pathname: string): DashboardNavItem | undefined {
  return DASHBOARD_NAV_ITEMS.find((item) => navItemActive(pathname, item.href));
}

export function navItemActive(pathname: string, href: string): boolean {
  if (href === routes.dashboard) return pathname === href;
  if (href === routes.settings || href === routes.settingsAccount) {
    return pathname === routes.settings || pathname.startsWith(`${routes.settings}/`);
  }
  if (href === routes.profile) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
