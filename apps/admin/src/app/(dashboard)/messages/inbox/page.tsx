import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AdminMessagesPanelClient } from '@/features/messages/AdminMessagesPanelClient';
import { Skeleton } from '@nestlancer/ui';

export const metadata: Metadata = { title: 'Inbox' };

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <AdminMessagesPanelClient />
    </Suspense>
  );
}
