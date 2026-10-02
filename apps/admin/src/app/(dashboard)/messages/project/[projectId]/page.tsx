import type { Metadata } from 'next';
import { AdminProjectThreadClient } from '@/features/messages/AdminProjectThreadClient';

export const metadata: Metadata = { title: 'Project messages' };

export default function Page({ params }: { params: { projectId: string } }) {
  return <AdminProjectThreadClient projectId={params.projectId} />;
}
