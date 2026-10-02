import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Deep-link alias — notification templates under System → Templates → Notifications. */
export const metadata: Metadata = { title: 'Notification templates' };

export default function NotificationTemplatesAliasPage() {
  redirect('/system?tab=templates&pane=notifications');
}
