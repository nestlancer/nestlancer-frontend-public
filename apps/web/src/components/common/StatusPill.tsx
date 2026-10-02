import { cn } from '@nestlancer/ui';

const TONES: Record<string, string> = {
  draft: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 ring-1 ring-slate-500/20',
  active: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/25',
  in_progress: 'bg-sky-500/15 text-sky-800 dark:text-sky-200 ring-1 ring-sky-500/25',
  inprogress: 'bg-sky-500/15 text-sky-800 dark:text-sky-200 ring-1 ring-sky-500/25',
  pending: 'bg-amber-500/15 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/30',
  awaiting_review: 'bg-violet-500/15 text-violet-900 dark:text-violet-200 ring-1 ring-violet-500/25',
  completed: 'bg-teal-500/12 text-teal-900 dark:text-teal-200 ring-1 ring-teal-500/20',
  cancelled: 'bg-destructive/12 text-destructive ring-1 ring-destructive/25',
  rejected: 'bg-destructive/12 text-destructive ring-1 ring-destructive/25',
  accepted: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/25',
  sent: 'bg-blue-500/12 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500/25',
  open: 'bg-cyan-500/12 text-cyan-900 dark:text-cyan-200 ring-1 ring-cyan-500/25',
};

function normalizeStatus(raw: string) {
  return raw.toLowerCase().replace(/\s+/g, '_');
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const key = normalizeStatus(status);
  const label = status.replace(/_/g, ' ');
  return (
    <span
      className={cn(
        'inline-flex max-w-full truncate rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold capitalize leading-tight',
        TONES[key] ?? 'bg-muted/80 text-muted-foreground ring-1 ring-border/80',
        className
      )}
      title={label}
    >
      {label}
    </span>
  );
}
