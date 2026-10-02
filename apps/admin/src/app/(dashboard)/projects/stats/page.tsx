import type { Metadata } from 'next';
import { ProjectsClient } from '@/features/projects/ProjectsClient';

export const metadata: Metadata = { title: 'Project stats' };

export default function AdminProjectStatsPage() {
  return <ProjectsClient title="Project statistics" />;
}
