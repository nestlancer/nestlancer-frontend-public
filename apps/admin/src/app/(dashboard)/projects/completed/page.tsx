import type { Metadata } from 'next';
import { ProjectsClient } from '@/features/projects/ProjectsClient';

export const metadata: Metadata = { title: 'Completed projects' };

export default function AdminCompletedProjectsPage() {
  return <ProjectsClient initialStatus="completed" title="Completed projects" />;
}
