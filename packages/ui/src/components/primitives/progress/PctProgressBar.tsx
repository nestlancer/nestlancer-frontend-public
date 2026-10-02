'use client';

import { cn } from '../../../utils/cn';

type PctProgressBarProps = {
  pct: number;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  heightClassName?: string;
  minPct?: number;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>;

/** Horizontal progress bar using SVG attributes (CSP-friendly — no inline style). */
export function PctProgressBar({
  pct,
  className,
  trackClassName,
  fillClassName = 'fill-primary',
  heightClassName = 'h-2',
  minPct = 0,
  role = 'progressbar',
  'aria-valuenow': ariaValueNow,
  'aria-valuemin': ariaValueMin = 0,
  'aria-valuemax': ariaValueMax = 100,
  ...rest
}: PctProgressBarProps) {
  const clamped = Math.min(100, Math.max(minPct, pct));

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-muted/70',
        heightClassName,
        trackClassName,
        className
      )}
      role={role}
      aria-valuenow={ariaValueNow ?? clamped}
      aria-valuemin={ariaValueMin}
      aria-valuemax={ariaValueMax}
      {...rest}
    >
      <svg viewBox="0 0 100 4" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
        <rect width={clamped} height="4" className={fillClassName} rx="2" />
      </svg>
    </div>
  );
}

type PctProgressFillProps = {
  pct: number;
  className?: string;
  fillClassName?: string;
  minPct?: number;
};

/** Inner fill for custom progress tracks (SVG rect width — no inline style). */
export function PctProgressFill({
  pct,
  className,
  fillClassName = 'fill-current',
  minPct = 0,
}: PctProgressFillProps) {
  const clamped = Math.min(100, Math.max(minPct, pct));

  return (
    <svg
      viewBox="0 0 100 4"
      className={cn('block h-full w-full', className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect width={clamped} height="4" className={fillClassName} rx="2" />
    </svg>
  );
}
