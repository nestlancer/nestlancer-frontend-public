import type { ReactNode } from 'react';

import { cn } from '@nestlancer/ui';

/** Consistent vertical rhythm for client dashboard list/index pages. */
export function ClientListPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('space-y-6', className)}>{children}</div>;
}
