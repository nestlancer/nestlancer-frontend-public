import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Storage' };

export default function MediaStorageRedirect() {
  redirect('/media');
}
