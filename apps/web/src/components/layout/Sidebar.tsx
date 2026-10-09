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
    'group relative flex items-center rounded-md text-[13px] font-medium transition-colors',
    compact ? 'justify-center px-2 py-1.5' : 'gap-2.5 px-2.5 py-1.5',
    active
      ? 'bg-ta-brand-50 text-ta-brand-700 ring-1 ring-inset ring-ta-brand-500/25 dark:bg-ta-brand-500/15 dark:text-ta-brand-300 dark:ring-ta-brand-400/30'
      : 'text-gray-600 hover:bg-black/[0.04] hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white/90'
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
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={sidebarLinkClass(active, compact)}
    >
      {active && !compact ? (
        <span
          className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-ta-brand-500"
          aria-hidden
        />
      ) : null}
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          active ? 'text-ta-brand-600 dark:text-ta-brand-400' : 'text-gray-400 dark:text-gray-500'
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
        'flex h-full shrink-0 flex-col overflow-hidden border-r border-gray-200/80 bg-[var(--ta-sidebar-bg)] transition-[width] duration-200 ease-out dark:border-gray-800 dark:bg-gray-950',
        showLabels ? 'w-[var(--ta-sidebar-expanded)]' : 'w-[var(--ta-sidebar-collapsed)]',
        className
      )}
    >
      <div
        className={cn(
          'flex h-[var(--ta-header-height)] items-center border-b border-gray-200/80 dark:border-gray-800',
          showLabels ? 'gap-2.5 px-3.5' : 'justify-center px-2'
        )}
      >
        <Link
          href={routes.dashboard}
          className={cn('flex min-w-0 items-center', showLabels ? 'gap-3' : 'justify-center')}
          onClick={onNavigate}
          aria-label="Nestlancer dashboard"
        >
          {showLabels ? (
            <NestlancerLogo variant="full" size="md" />
          ) : (
            <NestlancerLogo variant="icon" size="md" />
          )}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2.5" aria-label="Main">
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
