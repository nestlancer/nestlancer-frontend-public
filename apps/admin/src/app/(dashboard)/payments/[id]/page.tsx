import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { isRouteUuid } from '@nestlancer/validators';

import { PaymentDetailClient } from '@/features/payments/PaymentDetailClient';

/**
 * Static / probe segments that must not be treated as payment UUIDs.
 * Hub features live on `/payments` (and dedicated sibling routes).
 */
const RESERVED_PAYMENT_SEGMENTS = new Set([
  'projects',
  'disputes',
  'accounts',
  'company-legal',
  'by-project',
  'methods',
  'settings',
  'revenue',
  'stats',
  'manual',
  'reconciliation',
  'milestones',
  'new',
]);

const PAYMENT_HUB_REDIRECTS: Record<string, string> = {
  disputes: '/payments/disputes',
  accounts: '/payments/accounts',
  'company-legal': '/payments/company-legal',
  reconciliation: '/payments?view=reconciliation',
  projects: '/payments?view=projects',
  'by-project': '/payments',
};

export const metadata: Metadata = { title: 'Payment detail' };

export default function PaymentDetailPage({ params }: { params: { id: string } }) {
  if (RESERVED_PAYMENT_SEGMENTS.has(params.id)) {
    redirect(PAYMENT_HUB_REDIRECTS[params.id] ?? '/payments');
  }
  if (!isRouteUuid(params.id)) {
    notFound();
  }
  return <PaymentDetailClient paymentId={params.id} />;
}
