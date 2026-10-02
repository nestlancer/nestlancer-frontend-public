import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../utils/cn';

export type EmptyStateVariant = 'no-data' | 'no-results' | 'no-access';

const VARIANT_COPY: Record<EmptyStateVariant, { title: string; description: string }> = {
  'no-data': {
    title: 'Nothing here yet',
    description: 'Get started by creating your first item.',
  },
  'no-results': {
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
  },
  'no-access': {
    title: 'Access restricted',
    description: 'You do not have permission to view this content.',
  },
};

export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  /** Preset copy when title/description omitted */
  variant?: EmptyStateVariant;
};

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, title, description, icon, action, variant, ...props }, ref) => {
    const preset = variant ? VARIANT_COPY[variant] : null;
    const resolvedTitle = title ?? preset?.title ?? 'Empty';
    const resolvedDescription = description ?? preset?.description;

    return (
      <div
        ref={ref}
        role="status"
        className={cn(
          'flex flex-col items-center justify-center rounded-[var(--radius-lg,0.875rem)] border border-dashed border-border/80 bg-muted/30 px-6 py-12 text-center',
          className
        )}
        {...props}
      >
        {icon ? (
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <p className="text-sm font-semibold text-foreground">{resolvedTitle}</p>
        {resolvedDescription ? (
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{resolvedDescription}</p>
        ) : null}
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';
