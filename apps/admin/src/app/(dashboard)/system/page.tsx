import type { Metadata } from 'next';
import { Suspense } from 'react';

import { SystemClient } from '@/features/system/SystemClient';

export const metadata: Metadata = { title: 'System' };

export default function SystemPage() {
  return (
    <Suspense fallback={null}>
      <SystemClient />
    </Suspense>
  );
}
