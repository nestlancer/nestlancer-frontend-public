import type { Metadata } from 'next';
import { ProjectsClient } from '@/features/projects/ProjectsClient';

export const metadata: Metadata = { title: 'Archived projects' };

export default function AdminArchivedProjectsPage() {
  return <ProjectsClient initialStatus="archived" title="Archived projects" />;
}
