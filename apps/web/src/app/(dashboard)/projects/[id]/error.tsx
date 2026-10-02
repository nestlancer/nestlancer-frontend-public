'use client';

import { useEffect } from 'react';

import { Button } from '@nestlancer/ui';

export default function ProjectDetailError({
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
    <div className="flex min-h-[40vh] flex-col items-start justify-center gap-3 py-10">
      <h2 className="text-lg font-semibold text-foreground">Could not load this project</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        The project page failed to render. Your data is unchanged — try again, or go back to your
        project list.
      </p>
      <Button type="button" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
