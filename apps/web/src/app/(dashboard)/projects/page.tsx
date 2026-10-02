import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Projects' };

import { ProjectsListClient } from './ProjectsListClient';

export default function Page() {
  return <ProjectsListClient />;
}
