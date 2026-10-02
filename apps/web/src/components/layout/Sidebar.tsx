'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from '@nestlancer/ui/icons';

import { routes } from '@nestlancer/constants';
import { NestlancerLogo, cn } from '@nestlancer/ui';

import { DASHBOARD_NAV_SECTIONS, navItemActive } from '@/config/dashboard-nav';

import { SidebarNavSection } from './SidebarNavSection';
import { useSidebar } from './SidebarContext';

function sidebarLinkClass(active: boolean, compact: boolean) {
  return cn(
    'group relative flex items-center rounded-lg text-sm font-medium transition-colors',
    compact ? 'justify-center px-2.5 py-2.5' : 'gap-3 px-3 py-2.5',
    active
      ? 'bg-ta-brand-50 text-ta-brand-500 dark:bg-ta-brand-500/[0.12] dark:text-ta-brand-400'
      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  compact,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  compact: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = navItemActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={compact ? label : undefined}
      className={sidebarLinkClass(active, compact)}
    >
      <Icon
        className={cn(
          'h-5 w-5 shrink-0',
          active ? 'text-ta-brand-500 dark:text-ta-brand-400' : 'text-gray-500 dark:text-gray-400'
        )}
        aria-hidden
      />
      {!compact ? <span className="truncate">{label}</span> : null}
    </Link>
  );
}

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const { isExpanded, isHovered, setIsHovered } = useSidebar();
  const showLabels = isExpanded || isHovered;
  const compact = !showLabels;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'flex h-full shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900',
        showLabels ? 'w-[var(--ta-sidebar-expanded)]' : 'w-[var(--ta-sidebar-collapsed)]',
        className
      )}
    >
      <div
        className={cn(
          'flex h-[var(--ta-header-height)] items-center border-b border-gray-200 dark:border-gray-800',
          showLabels ? 'gap-3 px-5' : 'justify-center px-2'
        )}
      >
        <Link
          href={routes.dashboard}
          className={cn('flex min-w-0 items-center', showLabels ? 'gap-3' : 'justify-center')}
          onClick={onNavigate}
        >
          {showLabels ? (
            <NestlancerLogo variant="full" size="md" />
          ) : (
            <NestlancerLogo variant="icon" size="md" />
          )}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Main">
        {DASHBOARD_NAV_SECTIONS.map((section) => (
          <SidebarNavSection key={section.title} title={section.title} compact={compact}>
            {section.items.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                compact={compact}
                onNavigate={onNavigate}
              />
            ))}
          </SidebarNavSection>
        ))}
      </nav>
    </aside>
  );
}
