'use client';

import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { routes } from '@nestlancer/constants';
import { Button, ErrorState, PageHeader } from '@nestlancer/ui';

import { WebPanel } from '@/components/web/WebPanel';
import { apiServices } from '@/lib/axios';
import { webPrimaryButtonClass } from '@/lib/tailadmin-classes';

/**
 * Client direct-message composer.
 * Clients message platform support (no peer picker); admins use /messages/new-direct.
 * Starts only on explicit click to avoid mount-time rate-limit bursts.
 */
export function MessageNewDirectClient() {
  const router = useRouter();

  const start = useMutation({
    mutationFn: () => apiServices.messaging.createDirectThread(),
    onSuccess: (thread) => {
      toast.success('Support conversation opened');
      void router.replace(routes.messageThread(thread.id));
    },
    onError: (e) => {
      const msg = getApiErrorMessage(e, 'Could not open support chat');
      const soft =
        /rate limit/i.test(msg) || /429/.test(msg)
          ? 'Too many message requests just now. Wait a moment, then try again.'
          : msg;
      toast.error(soft);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="New message"
        description="Start a direct conversation with Nestlancer support. Existing support threads reopen automatically."
      />
      <div className="mx-auto max-w-lg space-y-4">
        <WebPanel padding="md" className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              To
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">Nestlancer Support</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Platform support admin for your account. Client-to-client messaging is not available.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className={webPrimaryButtonClass}
              disabled={start.isPending}
              onClick={() => start.mutate()}
            >
              {start.isPending ? 'Opening…' : 'Start conversation'}
            </Button>
            <Button variant="outline" asChild>
              <Link href={routes.messages}>Cancel</Link>
            </Button>
          </div>
        </WebPanel>
        {start.isError ? (
          <ErrorState
            title="Could not open conversation"
            message={
              /rate limit/i.test(getApiErrorMessage(start.error, ''))
                ? 'Too many message requests just now. Wait a moment, then try again.'
                : getApiErrorMessage(start.error, 'Something went wrong')
            }
            onRetry={() => start.mutate()}
          />
        ) : null}
      </div>
    </div>
  );
}
