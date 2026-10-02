import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Requests' };

import { Suspense } from 'react';

import { Spinner } from '@nestlancer/ui';

import { RequestsListClient } from '@/features/requests/RequestsListClient';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      <RequestsListClient />
    </Suspense>
  );
}
