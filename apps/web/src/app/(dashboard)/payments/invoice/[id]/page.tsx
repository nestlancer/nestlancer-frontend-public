import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Invoice' };

import { PaymentInvoiceClient } from '@/features/payments/PaymentInvoiceClient';

export default function Page({ params }: { params: { id: string } }) {
  return <PaymentInvoiceClient id={params.id} />;
}
