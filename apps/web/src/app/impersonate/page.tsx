import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ImpersonateHandoff } from './ImpersonateHandoff';

export const metadata: Metadata = {
  title: 'Support access',
  robots: { index: false, follow: false },
};

export default function ImpersonatePage() {
  return (
    <Suspense
      fallback={
        <main
          id="main-content"
          className="flex min-h-screen items-center justify-center bg-background px-4"
        >
          <p className="text-sm text-muted-foreground">Opening the client account…</p>
        </main>
      }
    >
      <ImpersonateHandoff />
    </Suspense>
  );
}
