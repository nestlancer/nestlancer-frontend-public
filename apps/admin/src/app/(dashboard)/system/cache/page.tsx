import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Deep-link alias — cache controls live under System → Operations. */
export const metadata: Metadata = { title: 'Cache' };

export default function SystemCacheAliasPage() {
  redirect('/system?tab=operations');
}
