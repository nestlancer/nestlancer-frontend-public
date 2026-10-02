import type { Metadata } from 'next';
import { RequestQuoteBuilderClient } from '@/features/requests/RequestQuoteBuilderClient';

export const metadata: Metadata = { title: 'Create quote' };

export default function AdminRequestQuoteNewPage({ params }: { params: { id: string } }) {
  return <RequestQuoteBuilderClient requestId={params.id} />;
}
