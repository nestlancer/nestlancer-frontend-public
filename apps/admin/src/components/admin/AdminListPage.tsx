import type { ReactNode } from 'react';

import { cn } from '@nestlancer/ui';

/** Consistent vertical rhythm for admin console list/index pages. */
export function AdminListPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('space-y-6', className)}>{children}</div>;
}
