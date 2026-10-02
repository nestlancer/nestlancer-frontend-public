'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from '@nestlancer/ui/icons';

import { DEFAULT_CURRENCY } from '@nestlancer/constants';
import { Button } from '@nestlancer/ui';

import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { GeCard, GePageHeader } from '@/components/admin/AdminGentelellaUI';
import { AdminCreateQuoteForm } from '@/features/requests/AdminCreateQuoteForm';
import { RequestBriefSidebar } from '@/features/requests/RequestBriefSidebar';
import { canAdminCreateQuoteForRequest } from '@/lib/admin-queue-filters';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRecord } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

function clientLabel(user: Record<string, unknown> | undefined): string {
  if (!user) return '—';
  const name = [user.firstName, user.lastName].filter((x) => typeof x === 'string' && x).join(' ');
  const email = typeof user.email === 'string' ? user.email : '';
  if (name && email) return `${name} (${email})`;
  return name || email || '—';
}

export function RequestQuoteBuilderClient({ requestId }: { requestId: string }) {
  const router = useRouter();

  const q = useQuery({
    queryKey: adminKeys.request(requestId),
    queryFn: () => apiServices.admin.getAdminRequest(requestId),
  });

  const record = pickAdminRecord(q.data) ?? {};
  const user = record.user as Record<string, unknown> | undefined;
  const budget = (record.budget as Record<string, unknown> | undefined) ?? {};
  const timeline = (record.timeline as Record<string, unknown> | undefined) ?? {};
  const requirements = Array.isArray(record.requirements)
    ? (record.requirements as string[]).filter(Boolean)
    : [];
  const attachments = Array.isArray(record.attachments)
    ? (record.attachments as Record<string, unknown>[])
    : [];
  const budgetCurrency = typeof budget.currency === 'string' ? budget.currency : DEFAULT_CURRENCY;

  const quotesArr = Array.isArray(record.quotes) ? record.quotes : [];
  const quote = (quotesArr[0] as Record<string, unknown> | undefined) ?? null;
  const quoteId = quote && typeof quote.id === 'string' ? quote.id : null;
  const canCreate = !quoteId && canAdminCreateQuoteForRequest(record.status);

  return (
    <div className="space-y-6">
      <GePageHeader
        pretitle="Quote builder"
        title={String(record.title ?? 'Request')}
        description="Drag phases to reorder · duplicate to copy scope · send when ready."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/requests/${encodeURIComponent(requestId)}`}>
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
              Back to request
            </Link>
          </Button>
        }
      />

      <AdminQueryState isLoading={q.isLoading} error={q.error}>
        {!canCreate && !q.isLoading ? (
          <GeCard className="mx-auto max-w-lg text-center">
            <p className="text-sm text-muted-foreground">
              {quoteId
                ? 'This request already has a quote. Open the request to edit or send it.'
                : 'This request is not ready for a new quote yet.'}
            </p>
            <Button className="mt-4" asChild>
              <Link href={`/requests/${encodeURIComponent(requestId)}`}>Back to request</Link>
            </Button>
          </GeCard>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,300px)_1fr]">
            <RequestBriefSidebar
              title={String(record.title ?? 'Request')}
              description={String(record.description ?? '')}
              category={String(record.category ?? '')}
              clientLabel={clientLabel(user)}
              budget={{
                min: typeof budget.min === 'number' ? budget.min : undefined,
                max: typeof budget.max === 'number' ? budget.max : undefined,
                currency: budgetCurrency,
              }}
              timeline={{
                preferredStartDate:
                  typeof timeline.preferredStartDate === 'string'
                    ? timeline.preferredStartDate
                    : undefined,
                deadline: typeof timeline.deadline === 'string' ? timeline.deadline : undefined,
              }}
              requirements={requirements}
              attachmentCount={attachments.length}
              className="lg:sticky lg:top-4 lg:self-start"
            />
            <AdminCreateQuoteForm
              variant="fullscreen"
              requestId={requestId}
              requestTitle={String(record.title ?? '')}
              category={String(record.category ?? '')}
              clientBudget={{
                min: typeof budget.min === 'number' ? budget.min : undefined,
                max: typeof budget.max === 'number' ? budget.max : undefined,
                currency: budgetCurrency,
                flexible: Boolean(budget.flexible),
              }}
              onCreated={() => router.push(`/requests/${encodeURIComponent(requestId)}`)}
            />
          </div>
        )}
      </AdminQueryState>
    </div>
  );
}
