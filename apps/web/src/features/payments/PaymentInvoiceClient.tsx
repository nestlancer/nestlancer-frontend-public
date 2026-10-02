'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from '@nestlancer/ui/icons';

import { getApiErrorCode, getApiErrorMessage } from '@nestlancer/api-client';
import { routes } from '@nestlancer/constants';
import { safeHttpUrl } from '@nestlancer/utils';
import { notFound } from 'next/navigation';

import { ErrorState, PageHeader, Spinner } from '@nestlancer/ui';
import { WebPanel } from '@/components/web/WebPanel';
import { apiServices } from '@/lib/axios';

import { PaymentTrustStrip } from './components/PaymentTrustStrip';

export function PaymentInvoiceClient({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const u = await apiServices.payments.getInvoiceUrl(id);
        const safe = safeHttpUrl(u);
        // NL-BUG-UI-015: null URL without throw left the spinner forever.
        if (!safe) {
          setMissing(true);
          return;
        }
        setUrl(safe);
        window.location.replace(safe);
      } catch (e) {
        const code = getApiErrorCode(e);
        if (
          code === 'HTTP_404' ||
          code === 'PAYMENT_001' ||
          /not found/i.test(getApiErrorMessage(e))
        ) {
          setMissing(true);
          return;
        }
        setErr(getApiErrorMessage(e, 'Could not load invoice'));
      }
    })();
  }, [id]);

  if (missing) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <Link
        href={routes.payment(id)}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to payment
      </Link>

      {err ? (
        <ErrorState
          title="Invoice unavailable"
          message={err}
          onRetry={() => {
            setErr(null);
            void (async () => {
              try {
                const u = await apiServices.payments.getInvoiceUrl(id);
                const safe = safeHttpUrl(u);
                if (!safe) {
                  setMissing(true);
                  return;
                }
                setUrl(safe);
                window.location.replace(safe);
              } catch (e) {
                setErr(getApiErrorMessage(e, 'Could not load invoice'));
              }
            })();
          }}
        />
      ) : (
        <WebPanel padding="lg" className="rounded-3xl text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/25">
            <Spinner className="h-7 w-7 border-2 border-primary/30 border-t-primary" />
          </span>
          <PageHeader
            className="mb-0 mt-6 !block text-center"
            title="Invoice"
            description="Opening your invoice in a new tab. This usually takes a moment."
          />
          {!err && url ? (
            <p className="mt-4 text-sm text-muted-foreground">
              If you were not redirected,{' '}
              <a className="font-semibold text-primary underline underline-offset-2" href={url}>
                open invoice manually
              </a>
              .
            </p>
          ) : null}
        </WebPanel>
      )}

      <PaymentTrustStrip />
    </div>
  );
}
