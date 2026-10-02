'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { routes } from '@nestlancer/constants';
import { PageHeader, cn } from '@nestlancer/ui';

import {
  webTabBarClass,
  webTabBarItemActiveClass,
  webTabBarItemClass,
  webTabBarItemInactiveClass,
} from '@/lib/tailadmin-classes';

const TABS = [
  { href: routes.settingsAccount, label: 'Account' },
  { href: routes.settingsSecurity, label: 'Security' },
  { href: routes.settingsNotifications, label: 'Notifications' },
  { href: routes.settingsFiles, label: 'Files' },
  { href: routes.settingsActivity, label: 'Activity' },
] as const;

export function SettingsLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage account preferences, security, notifications, files, and activity."
      />

      <div className={webTabBarClass} role="tablist" aria-label="Settings sections">
        {TABS.map((t) => {
          const active =
            pathname === t.href ||
            (t.href !== routes.settingsAccount && pathname.startsWith(`${t.href}/`));
          return (
            <Link
              key={t.href}
              href={t.href}
              prefetch={false}
              role="tab"
              aria-selected={active}
              className={cn(
                webTabBarItemClass,
                active ? webTabBarItemActiveClass : webTabBarItemInactiveClass
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
