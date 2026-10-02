import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Media settings' };

export default function MediaSettingsRedirect() {
  redirect('/media');
}
