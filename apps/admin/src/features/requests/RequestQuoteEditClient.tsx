'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';
import { ArrowLeft } from '@nestlancer/ui/icons';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { DEFAULT_CURRENCY } from '@nestlancer/constants';
import { Button } from '@nestlancer/ui';

import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { GeCard, GePageHeader } from '@/components/admin/AdminGentelellaUI';
import { AdminEditQuoteForm } from '@/features/quotes/AdminEditQuoteForm';
import { isQuoteEditable } from '@/features/quotes/admin-quote-utils';
import { RequestBriefSidebar } from '@/features/requests/RequestBriefSidebar';
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

export function RequestQuoteEditClient({ requestId }: { requestId: string }) {
  const qc = useQueryClient();
  const sendQuoteInFlight = useRef(false);

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
  const quoteStatus = quote ? String(quote.status ?? '') : '';
  const canEdit = quoteId ? isQuoteEditable(quoteStatus) : false;

  const sendQuoteM = useMutation({
    mutationFn: () => apiServices.admin.sendAdminQuote(quoteId!),
    onSuccess: () => {
      toast.success('Quote sent to client.');
      void qc.invalidateQueries({ queryKey: adminKeys.request(requestId) });
      void qc.invalidateQueries({ queryKey: adminKeys.quote(quoteId!) });
      void qc.invalidateQueries({ queryKey: adminKeys.quotes() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not send quote')),
    onSettled: () => {
      sendQuoteInFlight.current = false;
    },
  });

  function sendQuoteOnce() {
    if (!quoteId || sendQuoteInFlight.current || sendQuoteM.isPending) return;
    sendQuoteInFlight.current = true;
    sendQuoteM.mutate();
  }

  return (
    <div className="space-y-6">
      <GePageHeader
        pretitle="Quote editor"
        title={String(record.title ?? 'Request')}
        description="Phases, pricing, and client feedback in one workspace."
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
        {!quoteId || !canEdit ? (
          <GeCard className="mx-auto max-w-lg text-center">
            <p className="text-sm text-muted-foreground">
              {!quoteId
                ? 'No quote exists for this request yet.'
                : 'This quote can no longer be edited from here.'}
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
            <AdminEditQuoteForm
              variant="fullscreen"
              quoteId={quoteId}
              onSaved={() => void qc.invalidateQueries({ queryKey: adminKeys.request(requestId) })}
              onSend={sendQuoteOnce}
              sendPending={sendQuoteM.isPending}
            />
          </div>
        )}
      </AdminQueryState>
    </div>
  );
}
