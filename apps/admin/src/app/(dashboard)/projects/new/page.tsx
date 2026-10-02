import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Projects open from an accepted quote. */
export const metadata: Metadata = { title: 'New project' };

export default function AdminProjectsNewPage() {
  redirect('/projects');
}
