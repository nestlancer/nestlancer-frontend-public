'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { Button, NestlancerLogo } from '@nestlancer/ui';

export default function LandingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 py-20 text-center text-foreground"
    >
      <NestlancerLogo variant="icon" size="lg" className="mb-2" />
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        This page hit an unexpected error. You can retry or return home.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button type="button" className="rounded-full" onClick={() => reset()}>
          Retry
        </Button>
        <Button variant="outline" className="rounded-full" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </main>
  );
}
