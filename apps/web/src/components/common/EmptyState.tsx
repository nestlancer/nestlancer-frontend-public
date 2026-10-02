import type { ReactNode } from 'react';

import { cn } from '@nestlancer/ui';

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/30 px-6 py-16 text-center',
        className
      )}
    >
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description ? <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
