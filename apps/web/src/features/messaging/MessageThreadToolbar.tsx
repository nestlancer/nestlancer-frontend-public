'use client';

import Link from 'next/link';
import { ArrowLeft } from '@nestlancer/ui/icons';

import { routes } from '@nestlancer/constants';
import { Button } from '@nestlancer/ui';

export function MessageThreadToolbar({
  title,
  subtitle,
  onMarkRead,
  markReadPending,
}: {
  title: string;
  subtitle?: string;
  onMarkRead: () => void;
  markReadPending?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Button variant="ghost" size="icon" className="mt-0.5 h-9 w-9 shrink-0 lg:hidden" asChild>
          <Link href={routes.messagesInbox} aria-label="Back to messaging panel">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        disabled={markReadPending}
        onClick={() => onMarkRead()}
      >
        Mark read
      </Button>
    </div>
  );
}
