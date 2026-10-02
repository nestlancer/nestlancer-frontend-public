import type { ReactNode } from 'react';

import { AdminAuthGuard } from '@/components/auth/AdminAuthGuard';

import { AdminConsoleLayout } from './AdminConsoleLayout';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminConsoleLayout>{children}</AdminConsoleLayout>
    </AdminAuthGuard>
  );
}
