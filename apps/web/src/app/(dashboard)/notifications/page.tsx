import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Notifications' };

import { Suspense } from 'react';

import { Spinner } from '@nestlancer/ui';

import { NotificationsClient } from '@/features/notifications/NotificationsClient';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      <NotificationsClient />
    </Suspense>
  );
}
