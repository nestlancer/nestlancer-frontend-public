import type { Metadata } from 'next';
import { RequestQuoteEditClient } from '@/features/requests/RequestQuoteEditClient';

export const metadata: Metadata = { title: 'Edit quote' };

export default function AdminRequestQuoteEditPage({ params }: { params: { id: string } }) {
  return <RequestQuoteEditClient requestId={params.id} />;
}
