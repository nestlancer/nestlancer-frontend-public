import type { Metadata } from 'next';
import { PipelineHubClient } from '@/features/pipeline/PipelineHubClient';

export const metadata: Metadata = { title: 'Pipeline' };

export default function PipelinePage() {
  return <PipelineHubClient />;
}
