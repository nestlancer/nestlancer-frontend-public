'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../../utils/cn';
import { Button } from '../../primitives/button';

export type ErrorStateProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  message: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
};

export const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    {
      className,
      title = 'Something went wrong',
      message,
      onRetry,
      retryLabel = 'Try again',
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-destructive/30 bg-destructive/5 px-6 py-10 text-center',
        className
      )}
      {...props}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" className="mt-6" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
);
ErrorState.displayName = 'ErrorState';
