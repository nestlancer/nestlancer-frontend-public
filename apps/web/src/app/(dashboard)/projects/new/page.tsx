import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New project' };

import { ProjectsNewClient } from '@/features/projects/ProjectsNewClient';

export default function Page() {
  return <ProjectsNewClient />;
}
