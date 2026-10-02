import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../utils/cn';

export type ActionBannerProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  tone?: 'warning' | 'info' | 'error';
};

const toneClasses = {
  warning:
    'border-[hsl(var(--status-warning-border))] bg-[hsl(var(--status-warning-bg))]',
  info: 'border-[hsl(var(--status-info-border))] bg-[hsl(var(--status-info-bg))]',
  error: 'border-[hsl(var(--status-error-border))] bg-[hsl(var(--status-error-bg))]',
} as const;

export const ActionBanner = forwardRef<HTMLDivElement, ActionBannerProps>(
  ({ className, title, description, icon, action, tone = 'warning', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-4 rounded-[var(--radius-lg,0.875rem)] border px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
        'animate-fade-in-up motion-reduce:animate-none',
        toneClasses[tone],
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? <span className="mt-0.5 shrink-0 text-[hsl(var(--status-warning))]">{icon}</span> : null}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
);
ActionBanner.displayName = 'ActionBanner';
