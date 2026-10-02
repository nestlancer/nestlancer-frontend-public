'use client';

import type { ReactNode } from 'react';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { Spinner } from '@nestlancer/ui';
import { cn } from '@nestlancer/ui';

export function AdminSection({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('ge-card overflow-hidden', className)}>
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function AdminQueryState({
  isLoading,
  error,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  children: ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Spinner className="h-5 w-5" />
        Loading…
      </div>
    );
  }
  if (error) {
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {getApiErrorMessage(error, 'Request failed')}
      </p>
    );
  }
  return <>{children}</>;
}

export function JsonBlock({ value, className }: { value: unknown; className?: string }) {
  let text = '';
  try {
    text = JSON.stringify(value, null, 2) ?? '';
  } catch {
    text = String(value);
  }
  return (
    <pre
      className={cn(
        'max-h-[min(70vh,520px)] overflow-auto rounded-lg border border-border/60 bg-muted/30 p-4 text-left text-xs leading-relaxed text-muted-foreground',
        className
      )}
    >
      {text || 'null'}
    </pre>
  );
}
