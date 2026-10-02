import type { HTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

export type DashboardShellFooterVariant = 'client' | 'admin';

export type DashboardShellFooterProps = HTMLAttributes<HTMLElement> & {
  /** Short label after the year, e.g. "Nestlancer" or "Nestlancer Admin". */
  brand?: string;
  variant?: DashboardShellFooterVariant;
};

const variantSurface: Record<DashboardShellFooterVariant, string> = {
  client: 'border-gray-200/80 bg-white dark:border-gray-800/80 dark:bg-gray-900',
  admin: 'border-border/80 bg-card',
};

/**
 * Shared app-shell footer for authenticated dashboards (client + admin).
 * Mount once in the dashboard layout so all pages inherit the same chrome.
 */
export function DashboardShellFooter({
  brand = 'Nestlancer',
  variant = 'client',
  className,
  ...props
}: DashboardShellFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'dashboard-shell-footer shrink-0 border-t min-h-8',
        'px-4 py-2 text-[11px] leading-tight text-muted-foreground sm:px-6 lg:px-8',
        variantSurface[variant],
        className
      )}
      {...props}
    >
      <p className="truncate">
        © {year} {brand}
      </p>
    </footer>
  );
}
