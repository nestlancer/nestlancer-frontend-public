import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AdminMessagesOverviewClient } from '@/features/messages/AdminMessagesOverviewClient';
import { Skeleton } from '@nestlancer/ui';

export const metadata: Metadata = { title: 'Messages' };

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      }
    >
      <AdminMessagesOverviewClient />
    </Suspense>
  );
}
