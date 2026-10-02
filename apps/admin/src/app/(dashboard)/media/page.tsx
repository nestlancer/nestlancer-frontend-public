import type { Metadata } from 'next';
import { Suspense } from 'react';

import AdminMediaPageClient from './MediaPageClient';

export const metadata: Metadata = { title: 'Media' };

export default function AdminMediaPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border border-border bg-card px-4 py-8 text-sm text-muted-foreground">
          Loading media library…
        </div>
      }
    >
      <AdminMediaPageClient />
    </Suspense>
  );
}
