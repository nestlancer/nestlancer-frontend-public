import type { ReactNode } from 'react';

import { DashboardShell } from './DashboardShell';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
