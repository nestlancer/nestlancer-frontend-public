'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@nestlancer/ui';

const TABS = [
  { href: '/pipeline', label: 'Stage pipeline', match: (p: string) => p === '/pipeline' },
  {
    href: '/pipeline/users',
    label: 'User hub',
    match: (p: string) => p.startsWith('/pipeline/users'),
  },
  {
    href: '/pipeline/projects',
    label: 'Project hub',
    match: (p: string) => p.startsWith('/pipeline/projects'),
  },
] as const;

export function PipelineHubTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="ge-tab-bar sticky top-0 z-20 mb-4 scrollbar-none bg-background"
      aria-label="Pipeline views"
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={cn('ge-tab-bar-item no-underline hover:no-underline', active && 'active')}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
