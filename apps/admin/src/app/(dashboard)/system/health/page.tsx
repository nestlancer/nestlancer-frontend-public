import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Deep-link alias — health is the default System tab (NL-UI-002). */
export const metadata: Metadata = { title: 'Health' };

export default function SystemHealthAliasPage() {
  redirect('/system');
}
