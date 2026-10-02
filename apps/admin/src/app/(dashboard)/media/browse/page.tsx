import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Browse media' };

export default function MediaBrowseRedirect() {
  redirect('/media');
}
