import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

export type IconContainerSize = 'sm' | 'md' | 'lg';
export type IconContainerVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'neutral';

const sizeClass: Record<IconContainerSize, string> = {
  sm: 'h-9 w-9 [&_svg]:h-4 [&_svg]:w-4',
  md: 'h-11 w-11 [&_svg]:h-5 [&_svg]:w-5',
  lg: 'h-[2.75rem] w-[2.75rem] [&_svg]:h-[1.25rem] [&_svg]:w-[1.25rem]',
};

const variantClass: Record<IconContainerVariant, string> = {
  default: 'bg-primary/12 text-primary',
  success: 'bg-[hsl(var(--status-success-bg))] text-[hsl(var(--status-success))]',
  warning: 'bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning))]',
  error: 'bg-[hsl(var(--status-error-bg))] text-[hsl(var(--status-error))]',
  info: 'bg-[hsl(var(--status-info-bg))] text-[hsl(var(--status-info))]',
  purple: 'bg-[hsl(var(--status-purple-bg))] text-[hsl(var(--status-purple))]',
  neutral: 'bg-muted text-muted-foreground',
};

const baseClass =
  'flex shrink-0 items-center justify-center rounded-[var(--radius-md,0.625rem)]';

export type IconContainerProps = HTMLAttributes<HTMLSpanElement> & {
  size?: IconContainerSize;
  variant?: IconContainerVariant;
};

export const IconContainer = forwardRef<HTMLSpanElement, IconContainerProps>(
  ({ className, size = 'lg', variant = 'default', children, ...props }, ref) => (
    <span ref={ref} className={cn(baseClass, sizeClass[size], variantClass[variant], className)} {...props}>
      {children}
    </span>
  )
);
IconContainer.displayName = 'IconContainer';
