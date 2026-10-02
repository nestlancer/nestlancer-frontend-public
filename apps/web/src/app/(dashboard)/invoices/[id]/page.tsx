import { notFound, redirect } from 'next/navigation';

import { routes } from '@nestlancer/constants';
import { isRouteUuid } from '@nestlancer/validators';

/**
 * Invoice detail lives under /payments/invoice/[id].
 * Keep /invoices/[id] inside authenticated chrome (not marketing 404).
 */
export default function InvoiceAliasPage({ params }: { params: { id: string } }) {
  const id = params.id?.trim();
  if (!id) {
    redirect(routes.invoices);
  }
  // Reserved slugs must not hit GET /payments/new/invoice (audit route delta / Docker 404).
  if (id === 'new' || id === 'create') {
    notFound();
  }
  if (!isRouteUuid(id)) {
    notFound();
  }
  redirect(routes.invoice(id));
}
