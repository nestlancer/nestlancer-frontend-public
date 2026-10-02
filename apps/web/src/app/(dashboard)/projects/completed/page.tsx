import type { Metadata } from 'next';

import { ProjectsListClient } from '../ProjectsListClient';

export const metadata: Metadata = { title: 'Completed projects' };

export default function CompletedProjectsPage() {
  return <ProjectsListClient status="COMPLETED" />;
}
