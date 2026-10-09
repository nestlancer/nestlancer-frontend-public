/** Shared portal class strings for apps/web (Tailwind 3) — flat 2026 shells, not TailAdmin card soup. */

export const webPanelClass =
  'rounded-lg border border-gray-200/80 bg-white shadow-none dark:border-gray-800 dark:bg-white/[0.02]';

export const webSectionClass = `${webPanelClass} p-4 md:p-5`;

export const webListCardClass = `${webPanelClass} group relative block overflow-hidden p-3.5 md:p-4 transition-theme hover:border-ta-brand-500/40 hover:bg-ta-brand-25/40 dark:hover:bg-ta-brand-500/[0.04]`;

export const webFilterBarClass = `${webPanelClass} flex flex-wrap items-center gap-2.5 p-2.5 md:p-3`;

export const webListShellClass = `${webPanelClass} overflow-hidden`;

/** Dense KPI strip — single shell, divided cells (2026 enterprise, not card soup). */
export const webMetricStripClass = `${webPanelClass} grid overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0 md:grid-cols-3 xl:grid-cols-5`;

export const webSelectClass =
  'nl-select-filter h-10 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-ta-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90';

export const webTabBarClass =
  'flex min-h-12 items-stretch gap-1 overflow-x-auto scrollbar-none border-b border-gray-200 pe-2 dark:border-gray-800';

export const webTabBarItemClass =
  'shrink-0 border-b-2 px-4 py-3.5 text-sm font-medium leading-snug transition-theme';

export const webTabBarItemActiveClass =
  'border-ta-brand-500 text-ta-brand-600 dark:text-ta-brand-400';

export const webTabBarItemInactiveClass =
  'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90';

export const webPrimaryButtonClass =
  'border-0 bg-ta-brand-500 text-white shadow-theme-xs hover:bg-ta-brand-600 focus-visible:ring-ta-brand-500/30';

export const webPrimaryTextClass = 'font-bold text-ta-brand-500 dark:text-ta-brand-400';

export const webProgressFillClass = 'h-full rounded-full bg-ta-brand-500';

export const webStickyActionBarClass =
  'sticky fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 lg:bottom-0';

export const authInputClass =
  'h-11 rounded-lg border-input bg-transparent text-foreground shadow-none placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-primary/15 dark:border-white/25';

export const authCheckboxClass =
  'mt-0.5 h-5 w-5 shrink-0 rounded-[4px] border border-gray-400 bg-background accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-gray-500';

export const authLabelClass = 'text-sm font-medium text-foreground';

export const authPrimaryButtonClass =
  'h-11 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.2)] transition-transform hover:-translate-y-0.5 hover:opacity-95 focus-visible:ring-primary/30';

export const authLinkClass = 'font-medium text-primary hover:opacity-90';

export const authPageTitleClass =
  'text-2xl font-bold tracking-[-0.04em] text-foreground sm:text-[1.75rem] sm:leading-tight';

export const authPageSubtitleClass = 'text-sm leading-relaxed text-muted-foreground';
