import type { Metadata } from 'next';
import { PipelineUserPickerClient } from '@/features/pipeline/PipelineUserPickerClient';

export const metadata: Metadata = { title: 'Pipeline users' };

export default function PipelineUsersPage() {
  return <PipelineUserPickerClient />;
}
