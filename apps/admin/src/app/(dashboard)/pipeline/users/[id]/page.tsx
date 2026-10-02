import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isRouteUuid } from '@nestlancer/validators';

import { UserPipelineHubClient } from '@/features/pipeline/UserPipelineHubClient';

export const metadata: Metadata = { title: 'Pipeline user' };

export default function PipelineUserDetailPage({ params }: { params: { id: string } }) {
  if (!isRouteUuid(params.id)) {
    notFound();
  }
  return <UserPipelineHubClient userId={params.id} />;
}
