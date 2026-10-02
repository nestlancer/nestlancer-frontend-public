'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AdminOpenInboxRedirect({ openId }: { openId: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/messages?open=${encodeURIComponent(openId)}`);
  }, [openId, router]);

  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
      Opening conversation in inbox…
    </div>
  );
}
