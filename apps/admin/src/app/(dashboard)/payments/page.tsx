import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PaymentsClient } from '@/features/payments/PaymentsClient';
import { SkeletonTable } from '@nestlancer/ui';

export const metadata: Metadata = { title: 'Payments' };

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={6} cols={6} />}>
      <PaymentsClient />
    </Suspense>
  );
}
