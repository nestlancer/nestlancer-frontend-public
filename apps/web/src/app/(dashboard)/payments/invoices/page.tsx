import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { routes } from '@nestlancer/constants';

/** Deep-link alias — invoice list lives at `/invoices` (audit ROUTE-03). */
export const metadata: Metadata = { title: 'Invoices' };

export default function PaymentsInvoicesAliasPage() {
  redirect(routes.invoices);
}
