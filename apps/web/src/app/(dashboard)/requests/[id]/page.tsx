import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isRouteUuid } from '@nestlancer/validators';

export const metadata: Metadata = { title: 'Request' };

import { RequestDetailClient } from '@/features/requests/RequestDetailClient';

export default function Page({ params }: { params: { id: string } }) {
  if (!isRouteUuid(params.id)) {
    notFound();
  }
  return <RequestDetailClient id={params.id} />;
}
