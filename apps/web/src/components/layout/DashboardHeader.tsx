'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronLeft, LayoutDashboard, Menu } from '@nestlancer/ui/icons';

import { routes } from '@nestlancer/constants';
import { Button, NestlancerLogo, cn } from '@nestlancer/ui';

import { ThemeToggle } from '@/components/theme-toggle';
import { findActiveNavItem } from '@/config/dashboard-nav';

import { DashboardMessageLink } from './DashboardMessageLink';
import { DashboardNotificationLink } from './DashboardNotificationLink';
import { NavbarUserMenu } from './NavbarUserMenu';
import { useSidebar } from './SidebarContext';

export function DashboardHeader({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const pathname = usePathname();
  const active = findActiveNavItem(pathname);
  const isRoot = pathname === routes.dashboard;
  const { isExpanded, toggleSidebar } = useSidebar();

  return (
    <header className="z-40 shrink-0 border-b border-gray-200 bg-white transition-theme dark:border-gray-800/80 dark:bg-gray-900">
      <div className="flex h-[var(--ta-header-height)] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden h-10 w-10 shrink-0 rounded-lg border-gray-200 text-gray-500 lg:inline-flex dark:border-gray-700 dark:text-gray-400"
          onClick={toggleSidebar}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? (
            <ChevronLeft className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-lg lg:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <Link
            href={routes.dashboard}
            className="font-semibold tracking-tight text-gray-800 dark:text-white/90 lg:hidden"
            aria-label="Nestlancer dashboard"
          >
            <NestlancerLogo variant="full" size="sm" />
          </Link>

          {!isRoot && active ? (
            <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-sm lg:flex">
              <Link
                href={routes.dashboard}
                className="flex items-center gap-1 text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
              >
                <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
                <span>Dashboard</span>
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" aria-hidden />
              <span className="font-medium text-gray-800 dark:text-white/90">{active.label}</span>
            </nav>
          ) : (
            <span className="hidden text-sm font-medium text-gray-800 dark:text-white/90 lg:block">
              Overview
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'hidden h-10 gap-2 rounded-lg border-gray-200 text-gray-500 hover:border-ta-brand-500/30 hover:shadow-sm md:inline-flex dark:border-gray-700 dark:text-gray-400'
            )}
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
            }}
            aria-label="Open command menu"
          >
            <span>Search</span>
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 text-[0.625rem] font-medium dark:border-gray-700 dark:bg-gray-800">
              ⌘K
            </kbd>
          </Button>
          <ThemeToggle />
          <DashboardMessageLink />
          <DashboardNotificationLink />
          <NavbarUserMenu />
        </div>
      </div>
    </header>
  );
}
