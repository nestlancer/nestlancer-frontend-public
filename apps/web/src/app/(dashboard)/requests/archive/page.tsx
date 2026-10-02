import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Archived requests' };

/** Requests have no archive status. The list is the real screen. */
export default function RequestsArchivePage() {
  redirect('/requests');
}
