'use client';

import { useEffect } from 'react';

import { Button, NestlancerLogo } from '@nestlancer/ui';

export default function GlobalError({
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
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <NestlancerLogo variant="icon" size="md" className="mb-2" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <Button type="button" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
