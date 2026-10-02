'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Clock, FileText, Sparkles } from '@nestlancer/ui/icons';

import { routes } from '@nestlancer/constants';
import { Button, PageHeader, cn } from '@nestlancer/ui';

import { WebPanel } from '@/components/web/WebPanel';
import { apiServices } from '@/lib/axios';
import { webPrimaryButtonClass } from '@/lib/tailadmin-classes';

function asQuoteItems(
  data: unknown
): Array<{ id: string; status: string; title?: string; amount?: number }> {
  const items = Array.isArray((data as Record<string, unknown>)?.items)
    ? (data as Record<string, unknown>).items
    : [];
  return (items as Array<Record<string, unknown>>).map((q) => ({
    id: String(q.id ?? ''),
    status: String(q.status ?? ''),
    title: (q.title as string | undefined) ?? (q.requestTitle as string | undefined) ?? undefined,
    amount: (q.totalAmount as number | undefined) ?? (q.amount as number | undefined) ?? undefined,
  }));
}

export function ProjectsNewClient() {
  const quotesQ = useQuery({
    queryKey: ['quotes', 'list', 'new-project-check'],
    queryFn: () => apiServices.quotes.list({ limit: 10 }),
  });

  const quotes = asQuoteItems(quotesQ.data);
  const pendingQuotes = quotes.filter((q) =>
    ['PENDING', 'SENT', 'VIEWED'].includes(q.status.toUpperCase())
  );
  const acceptedQuotes = quotes.filter((q) => q.status.toUpperCase() === 'ACCEPTED');

  return (
    <div className="space-y-6">
      <PageHeader
        title="New project"
        description="Projects are created automatically when you accept a quote from Nestlancer."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.projects}>View projects</Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-2xl space-y-4">
        {acceptedQuotes.length > 0 ? (
          <WebPanel padding="md">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
                <Clock className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Your project is being prepared
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  You have {acceptedQuotes.length} accepted quote
                  {acceptedQuotes.length > 1 ? 's' : ''}. It will appear under Projects shortly.
                </p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href={routes.projects}>
                    Go to Projects
                    <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </WebPanel>
        ) : null}

        {pendingQuotes.length > 0 ? (
          <WebPanel padding="md" className="border-ta-brand-500/30">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ta-brand-50 text-ta-brand-600 ring-1 ring-ta-brand-500/15 dark:bg-ta-brand-500/[0.12] dark:text-ta-brand-400">
                <FileText className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Quotes awaiting review
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {pendingQuotes.length} quote{pendingQuotes.length > 1 ? 's are' : ' is'} ready.
                  Accepting a quote opens your project automatically.
                </p>
                <Button size="sm" className={cn('mt-3', webPrimaryButtonClass)} asChild>
                  <Link href={routes.quotes}>
                    Review quotes
                    <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </WebPanel>
        ) : null}

        <WebPanel padding="md">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ta-brand-600 dark:text-ta-brand-400">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            How it works
          </p>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-gray-600 dark:text-gray-400">
            <li>
              Post a{' '}
              <Link
                className="font-medium text-ta-brand-500 hover:text-ta-brand-600"
                href={routes.requestNew}
              >
                new request
              </Link>{' '}
              describing what you need.
            </li>
            <li>Nestlancer sends a quote — you&apos;ll get an email when it&apos;s ready.</li>
            <li>Review and accept the quote. Your project opens automatically.</li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button className={webPrimaryButtonClass} asChild>
              <Link href={routes.requestNew}>
                Post a request
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={routes.quotes}>View quotes</Link>
            </Button>
          </div>
        </WebPanel>
      </div>
    </div>
  );
}
