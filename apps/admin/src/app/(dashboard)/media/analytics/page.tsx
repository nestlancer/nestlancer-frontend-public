import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Media analytics' };

export default function MediaAnalyticsRedirect() {
  redirect('/media?tab=analytics');
}
