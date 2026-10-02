import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Quarantine' };

export default function MediaQuarantineRedirect() {
  redirect('/media?tab=quarantine');
}
