import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AdminNotificationsClient } from '@/features/notifications/AdminNotificationsClient';
import { Skeleton } from '@nestlancer/ui';

export const metadata: Metadata = { title: 'Notifications' };

export default function AdminNotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      }
    >
      <AdminNotificationsClient />
    </Suspense>
  );
}
