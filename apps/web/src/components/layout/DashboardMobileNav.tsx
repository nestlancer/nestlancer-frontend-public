'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from '@nestlancer/ui/icons';

import { Button, NestlancerLogo, cn } from '@nestlancer/ui';

import {
  DASHBOARD_BOTTOM_NAV,
  DASHBOARD_NAV_SECTIONS,
  navItemActive,
} from '@/config/dashboard-nav';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

function mobileNavLinkClass(active: boolean) {
  return cn(
    'relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
    active
      ? 'bg-ta-brand-50 text-ta-brand-500 dark:bg-ta-brand-500/[0.12] dark:text-ta-brand-400'
      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
  );
}

export function DashboardMobileBottomNav({ onOpenFullMenu }: { onOpenFullMenu: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-gray-800 dark:bg-gray-900 lg:hidden"
      aria-label="Quick navigation"
    >
      <div className="flex h-[3.75rem] items-stretch justify-around px-1">
        {DASHBOARD_BOTTOM_NAV.map((item) => {
          const active = navItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[0.65rem] font-semibold transition-colors',
                active
                  ? 'text-ta-brand-500'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90'
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                  active
                    ? 'bg-ta-brand-50 text-ta-brand-500 dark:bg-ta-brand-500/[0.12]'
                    : 'bg-transparent'
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="max-w-full truncate px-0.5">{item.label}</span>
            </Link>
          );
        })}
        <Button
          type="button"
          variant="ghost"
          className="flex h-auto min-w-0 flex-1 flex-col gap-0.5 rounded-xl py-1 text-[0.65rem] font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
          onClick={onOpenFullMenu}
          aria-label="Open full menu"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Menu className="h-5 w-5" aria-hidden />
          </span>
          Menu
        </Button>
      </div>
    </nav>
  );
}

export function DashboardMobileNavSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full overflow-y-auto border-gray-200 bg-white p-0 sm:w-[min(100%,var(--ta-sidebar-expanded))] dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="border-b border-gray-200 px-6 pb-6 pt-8 dark:border-gray-800">
          <SheetHeader className="pr-10">
            <div className="flex items-center gap-3">
              <NestlancerLogo variant="icon" size="md" />
              <div>
                <SheetTitle className="text-xl text-gray-800 dark:text-white/90">
                  Nestlancer
                </SheetTitle>
                <SheetDescription>Client portal</SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>
        <nav className="flex flex-col gap-1 p-4 pb-10" aria-label="Main">
          {DASHBOARD_NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-3">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {section.title}
              </p>
              {section.items.map((item) => {
                const active = navItemActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    className={mobileNavLinkClass(active)}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
