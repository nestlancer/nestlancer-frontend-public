import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Media folders' };

export default function MediaFoldersRedirect() {
  redirect('/media');
}
