import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isRouteUuid } from '@nestlancer/validators';

import { ProjectPaymentsClient } from '@/features/payments/ProjectPaymentsClient';

export const metadata: Metadata = { title: 'Project payments' };

export default function AdminProjectPaymentsPage({ params }: { params: { id: string } }) {
  if (!isRouteUuid(params.id)) {
    notFound();
  }
  return <ProjectPaymentsClient projectId={params.id} />;
}
