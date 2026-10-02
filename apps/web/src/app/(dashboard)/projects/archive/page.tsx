import type { Metadata } from 'next';

import { ProjectsListClient } from '../ProjectsListClient';

export const metadata: Metadata = { title: 'Archived projects' };

export default function ArchivedProjectsPage() {
  return <ProjectsListClient status="ARCHIVED" />;
}
