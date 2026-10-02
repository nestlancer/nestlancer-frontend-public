import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { WebAuthGuard } from '@/components/auth/WebAuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s · Nestlancer',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function DashboardRouteLayout({ children }: { children: ReactNode }) {
  return (
    <WebAuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </WebAuthGuard>
  );
}
