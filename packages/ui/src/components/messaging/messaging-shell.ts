/** Tailwind + CSS utility class strings for messaging layouts. */

export const messagingPanelClass = 'messaging-panel-elevated min-h-0 overflow-hidden';

export const messagingInboxAsideClass =
  'flex min-h-0 flex-col border-b border-border p-4 lg:border-b-0 lg:border-r';

export const messagingConvItemClass =
  'conv-item flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors';

export const messagingConvItemActiveClass = 'active border-primary/20';

export const messagingThreadFillClass =
  'messaging-panel-elevated flex min-h-0 h-full flex-1 flex-col overflow-hidden';

export const messagingKindBadgeClass = {
  Direct: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  Project: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  Group: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
} as const;
