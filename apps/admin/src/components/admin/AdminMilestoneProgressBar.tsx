'use client';

import { cn, PctProgressFill } from '@nestlancer/ui';

export function AdminMilestoneProgressBar({
  percent,
  variant = 'default',
  showLabel = true,
  className,
}: {
  percent: number;
  variant?: 'default' | 'success' | 'info' | 'warning';
  showLabel?: boolean;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const fillClass =
    variant === 'success'
      ? 'fill-emerald-500'
      : variant === 'info'
        ? 'fill-blue-500'
        : variant === 'warning'
          ? 'fill-amber-500'
          : clamped >= 100
            ? 'fill-emerald-500'
            : clamped > 0
              ? 'fill-primary'
              : 'fill-muted-foreground/40';

  return (
    <div className={cn('flex min-w-[7rem] items-center gap-2', className)}>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <PctProgressFill pct={clamped} fillClassName={fillClass} className="h-full" />
      </div>
      {showLabel ? (
        <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
          {clamped}%
        </span>
      ) : null}
    </div>
  );
}
