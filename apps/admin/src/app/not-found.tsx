import type { Metadata } from 'next';
import Link from 'next/link';

import { Button, NestlancerLogo } from '@nestlancer/ui';

export const metadata: Metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center"
    >
      <NestlancerLogo variant="icon" size="lg" className="mb-2" />
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Nestlancer Admin
      </p>
      <h1 className="text-4xl font-bold text-foreground">Page not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The operator route you requested does not exist or you may not have access to it.
      </p>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </main>
  );
}
