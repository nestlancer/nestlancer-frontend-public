'use client';

import { useState } from 'react';

import { Button } from '@nestlancer/ui';

import { stopActingAsUser, useImpersonationMeta } from '@/lib/impersonationSession';

function formatExpiry(expiresAt: string): string {
  const time = Date.parse(expiresAt);
  if (Number.isNaN(time)) return '';
  return new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function ImpersonationBanner() {
  const meta = useImpersonationMeta();
  const [stopping, setStopping] = useState(false);

  if (!meta) return null;

  const who = meta.email || 'this client';
  const until = formatExpiry(meta.expiresAt);

  return (
    <div
      role="status"
      className="flex flex-col gap-3 border-b border-amber-500/40 bg-amber-500/15 px-4 py-3 text-amber-950 dark:text-amber-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <p className="text-sm">
        You are finishing <span className="font-semibold">{who}</span>
        {"'s account for support."}
        {until ? ` This session ends at ${until}.` : ''} Keep the admin tab open until you stop.
      </p>
      <Button
        size="sm"
        variant="outline"
        disabled={stopping}
        onClick={() => {
          setStopping(true);
          void stopActingAsUser().then((result) => {
            window.location.assign(`/impersonate?done=${result}`);
          });
        }}
      >
        {stopping ? 'Stopping…' : 'Stop and return'}
      </Button>
    </div>
  );
}
