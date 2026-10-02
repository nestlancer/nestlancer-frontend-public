import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Notification preferences' };

import { SettingsNotificationsClient } from '@/features/settings/SettingsNotificationsClient';

export default function Page() {
  return <SettingsNotificationsClient />;
}
