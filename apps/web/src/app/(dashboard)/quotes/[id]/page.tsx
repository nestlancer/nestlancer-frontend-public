import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isRouteUuid } from '@nestlancer/validators';

export const metadata: Metadata = { title: 'Quote' };

import { QuoteDetailClient } from '@/features/quotes/QuoteDetailClient';

export default function Page({ params }: { params: { id: string } }) {
  if (!isRouteUuid(params.id)) {
    notFound();
  }
  return <QuoteDetailClient id={params.id} />;
}
