import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Deep-link alias — email templates live under System → Templates. */
export const metadata: Metadata = { title: 'Email templates' };

export default function EmailTemplatesAliasPage() {
  redirect('/system?tab=templates');
}
