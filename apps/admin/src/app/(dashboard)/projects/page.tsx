import type { Metadata } from 'next';
import { ProjectsClient } from '@/features/projects/ProjectsClient';

export const metadata: Metadata = { title: 'Projects' };

export default function AdminProjectsPage() {
  return <ProjectsClient />;
}
