import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { routes } from '@nestlancer/constants';
import { isRouteUuid } from '@nestlancer/validators';

export const metadata: Metadata = { title: 'Payment' };

import { PaymentDetailClient } from '@/features/payments/PaymentDetailClient';

/** Static segments that must not be treated as payment UUIDs. */
const RESERVED_PAYMENT_SEGMENTS = new Set(['methods', 'invoice', 'invoices', 'history']);

export default function Page({ params }: { params: { id: string } }) {
  if (RESERVED_PAYMENT_SEGMENTS.has(params.id)) {
    if (params.id === 'methods') {
      redirect(routes.paymentMethods);
    }
    if (params.id === 'invoices' || params.id === 'history') {
      redirect(routes.invoices);
    }
    if (params.id === 'invoice') {
      redirect(routes.invoices);
    }
    redirect(routes.payments);
  }
  if (!isRouteUuid(params.id)) {
    notFound();
  }
  return <PaymentDetailClient id={params.id} />;
}
