'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@nestlancer/ui';

import {
  ADMIN_PROJECT_DETAIL_TAB_LABELS,
  ADMIN_PROJECT_DETAIL_TABS,
  type AdminProjectDetailTab,
  parseAdminProjectDetailTab,
} from './admin-project-detail-tabs';

function tabHref(pathname: string, searchParams: URLSearchParams, tab: AdminProjectDetailTab) {
  const params = new URLSearchParams(searchParams.toString());
  if (tab === 'overview') {
    params.delete('tab');
  } else {
    params.set('tab', tab);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function AdminProjectDetailTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = parseAdminProjectDetailTab(searchParams.get('tab'));

  return (
    <nav
      className="ge-tab-bar sticky top-0 z-20 w-full max-w-full scrollbar-none bg-background"
      role="tablist"
      aria-label="Project sections"
    >
      {ADMIN_PROJECT_DETAIL_TABS.map((tab) => {
        const isActive = tab === active;
        const href = tabHref(pathname, searchParams, tab);
        return (
          <Link
            key={tab}
            href={href}
            role="tab"
            id={`admin-project-tab-${tab}`}
            aria-selected={isActive}
            aria-controls={`admin-project-panel-${tab}`}
            scroll={false}
            // NL-UI-003: cold-load Link can focus without navigating; force push.
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              if (isActive) {
                e.preventDefault();
                return;
              }
              e.preventDefault();
              router.push(href);
            }}
            className={cn(
              'ge-tab-bar-item whitespace-nowrap no-underline hover:no-underline',
              isActive && 'active'
            )}
          >
            {ADMIN_PROJECT_DETAIL_TAB_LABELS[tab]}
          </Link>
        );
      })}
    </nav>
  );
}
