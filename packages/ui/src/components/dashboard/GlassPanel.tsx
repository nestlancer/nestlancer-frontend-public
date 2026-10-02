import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

export const GlassPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-[var(--radius-lg,0.875rem)] border border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)] transition-theme',
        className
      )}
      {...props}
    />
  )
);
GlassPanel.displayName = 'GlassPanel';
