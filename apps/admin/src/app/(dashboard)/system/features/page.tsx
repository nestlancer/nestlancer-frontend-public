import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Deep-link alias — features live as a tab on `/system`. */
export const metadata: Metadata = { title: 'Features' };

export default function SystemFeaturesAliasPage() {
  redirect('/system?tab=features');
}
