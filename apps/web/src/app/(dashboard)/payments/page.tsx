import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Payments' };

import { Suspense } from 'react';

import { Spinner } from '@nestlancer/ui';

import { PaymentsListClient } from '@/features/payments/PaymentsListClient';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      }
    >
      <PaymentsListClient />
    </Suspense>
  );
}
