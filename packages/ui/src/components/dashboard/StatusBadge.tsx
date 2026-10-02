import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

export type StatusBadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'purple' | 'neutral';

const variantClass: Record<StatusBadgeVariant, string> = {
  success:
    'border-[hsl(var(--status-success-border))] bg-[hsl(var(--status-success-bg))] text-[hsl(var(--status-success))]',
  warning:
    'border-[hsl(var(--status-warning-border))] bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning))]',
  error: 'border-[hsl(var(--status-error-border))] bg-[hsl(var(--status-error-bg))] text-[hsl(var(--status-error))]',
  info: 'border-[hsl(var(--status-info-border))] bg-[hsl(var(--status-info-bg))] text-[hsl(var(--status-info))]',
  purple:
    'border-[hsl(var(--status-purple-border))] bg-[hsl(var(--status-purple-bg))] text-[hsl(var(--status-purple))]',
  neutral:
    'border-[hsl(var(--status-neutral-border))] bg-[hsl(var(--status-neutral-bg))] text-[hsl(var(--status-neutral))]',
};

const baseClass =
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors';

export type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: StatusBadgeVariant;
  dot?: boolean;
};

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant = 'neutral', dot = false, children, ...props }, ref) => (
    <span ref={ref} className={cn(baseClass, variantClass[variant], dot && 'pl-2', className)} {...props}>
      {dot ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  )
);
StatusBadge.displayName = 'StatusBadge';
