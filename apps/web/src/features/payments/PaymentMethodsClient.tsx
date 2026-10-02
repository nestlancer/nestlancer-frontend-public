'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Landmark, Smartphone, Star, Wallet } from '@nestlancer/ui/icons';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys, routes } from '@nestlancer/constants';
import { Button, EmptyState, ErrorState, Skeleton, cn } from '@nestlancer/ui';

import { PageHeader } from '@nestlancer/ui';
import { apiServices } from '@/lib/axios';

import { useWebConfirm } from '@/components/web/WebConfirmProvider';
import { WebPanel } from '@/components/web/WebPanel';
import { webPanelClass, webPrimaryButtonClass } from '@/lib/tailadmin-classes';

import { PaymentStatsHero } from './components/PaymentStatsHero';
import { PaymentTrustStrip } from './components/PaymentTrustStrip';

type PaymentMethodRow = {
  id: string;
  type?: string;
  last4?: string;
  brand?: string;
  isDefault?: boolean;
};

function asMethods(data: unknown): PaymentMethodRow[] {
  if (!Array.isArray(data)) return [];
  return data.map((item, i) => {
    const o = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    return {
      id: String(o.id ?? `method-${i}`),
      type: o.type != null ? String(o.type) : undefined,
      last4: o.last4 != null ? String(o.last4) : undefined,
      brand: o.brand != null ? String(o.brand) : undefined,
      isDefault: Boolean(o.isDefault),
    };
  });
}

function methodIcon(type?: string) {
  const t = (type ?? '').toLowerCase();
  if (t.includes('upi')) return Smartphone;
  if (t.includes('net')) return Landmark;
  if (t.includes('wallet')) return Wallet;
  return CreditCard;
}

export function PaymentMethodsClient() {
  const confirm = useWebConfirm();
  const qc = useQueryClient();
  const methodsQ = useQuery({
    queryKey: queryKeys.payments.methods,
    queryFn: () => apiServices.payments.listMethods(),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => apiServices.payments.deleteMethod(id),
    onSuccess: () => {
      toast.success('Payment method removed');
      void qc.invalidateQueries({ queryKey: queryKeys.payments.methods });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not remove payment method')),
  });

  const setDefaultM = useMutation({
    mutationFn: (id: string) => apiServices.payments.setDefaultMethod(id),
    onSuccess: () => {
      toast.success('Default payment method updated');
      void qc.invalidateQueries({ queryKey: queryKeys.payments.methods });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update default')),
  });

  const methods = asMethods(methodsQ.data);

  return (
    <div className="space-y-8">
      <Link
        href={routes.payments}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to payments
      </Link>

      <PageHeader
        title="Payment methods"
        description="Manage saved options for faster Razorpay checkout on milestones and invoices."
      />

      <PaymentStatsHero className="!py-6" />

      {methodsQ.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {methodsQ.isError ? (
        <ErrorState
          title="Could not load payment methods"
          message={getApiErrorMessage(methodsQ.error, 'Could not load payment methods')}
          onRetry={() => void methodsQ.refetch()}
        />
      ) : null}

      {!methodsQ.isPending && !methodsQ.isError ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {methods.length === 0 ? (
            <li className="col-span-full">
              <EmptyState
                variant="no-data"
                title="No saved methods yet"
                description="Complete a Razorpay checkout and choose to save your card to add a payment method here."
              />
            </li>
          ) : (
            methods.map((m) => {
              const Icon = methodIcon(m.type);
              return (
                <li
                  key={m.id}
                  className={cn(
                    webPanelClass,
                    'relative flex flex-col gap-4 p-5',
                    m.isDefault && 'ring-2 ring-ta-brand-500/30'
                  )}
                >
                  {m.isDefault ? (
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary">
                      <Star className="h-3 w-3 fill-current" aria-hidden />
                      Default
                    </span>
                  ) : null}
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold capitalize text-foreground">
                      {[m.brand, m.type].filter(Boolean).join(' ') || 'Payment method'}
                    </p>
                    {m.last4 ? (
                      <p className="mt-0.5 font-mono text-sm text-muted-foreground">
                        •••• {m.last4}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted-foreground">{m.id.slice(0, 12)}…</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!m.isDefault ? (
                      <button
                        type="button"
                        className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                        disabled={setDefaultM.isPending}
                        onClick={() => setDefaultM.mutate(m.id)}
                      >
                        Set as default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="text-xs font-semibold text-destructive hover:underline disabled:opacity-50"
                      disabled={deleteM.isPending}
                      onClick={async () => {
                        if (
                          await confirm({
                            title: 'Remove this payment method?',
                            destructive: true,
                          })
                        ) {
                          deleteM.mutate(m.id);
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      <AddMethodForm />

      <PaymentTrustStrip />
    </div>
  );
}

function AddMethodForm() {
  return (
    <WebPanel padding="md">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
        Add a payment method
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Payment methods are saved automatically when you complete a Razorpay checkout and choose to
        save your card. Manual token entry is not supported.
      </p>
      <Button asChild className={cn('mt-4', webPrimaryButtonClass)}>
        <Link href={routes.payments}>Go to payments</Link>
      </Button>
    </WebPanel>
  );
}
