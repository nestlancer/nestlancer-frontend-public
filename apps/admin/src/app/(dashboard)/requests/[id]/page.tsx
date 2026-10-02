import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { isRouteUuid } from '@nestlancer/validators';

import { RequestDetailClient } from '@/features/requests/RequestDetailClient';

/** Static segments that must not be treated as request UUIDs. */
const RESERVED_REQUEST_SEGMENTS = new Set(['capacity', 'stats', 'archive', 'settings', 'new']);

export const metadata: Metadata = { title: 'Request detail' };

export default function AdminRequestDetailPage({ params }: { params: { id: string } }) {
  if (RESERVED_REQUEST_SEGMENTS.has(params.id)) {
    redirect('/requests');
  }
  if (!isRouteUuid(params.id)) {
    notFound();
  }
  return <RequestDetailClient requestId={params.id} />;
}
