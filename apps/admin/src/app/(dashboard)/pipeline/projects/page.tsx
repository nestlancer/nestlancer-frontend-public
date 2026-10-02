import type { Metadata } from 'next';
import { PipelineProjectPickerClient } from '@/features/pipeline/PipelineProjectPickerClient';

export const metadata: Metadata = { title: 'Pipeline projects' };

export default function PipelineProjectsPage() {
  return <PipelineProjectPickerClient />;
}
