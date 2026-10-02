import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Deep-link alias — capacity dashboard lives on `/requests` (post-fix P2). */
export const metadata: Metadata = { title: 'Capacity' };

export default function RequestsCapacityAliasPage() {
  redirect('/requests');
}
