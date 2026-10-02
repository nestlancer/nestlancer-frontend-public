import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isRouteUuid } from '@nestlancer/validators';

import { ProjectPipelineHubClient } from '@/features/pipeline/ProjectPipelineHubClient';

export const metadata: Metadata = { title: 'Pipeline project' };

export default function PipelineProjectDetailPage({ params }: { params: { id: string } }) {
  if (!isRouteUuid(params.id)) {
    notFound();
  }
  return <ProjectPipelineHubClient projectId={params.id} />;
}
