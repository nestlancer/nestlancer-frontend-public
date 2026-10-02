import type { Metadata } from 'next';
import { RequestsClient } from '@/features/requests/RequestsClient';

export const metadata: Metadata = { title: 'Requests' };

export default function AdminRequestsPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  return <RequestsClient initialStatus={searchParams?.status} />;
}
