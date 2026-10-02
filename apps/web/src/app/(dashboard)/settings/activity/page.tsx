import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Activity' };

import { SettingsActivityClient } from '@/features/settings/SettingsActivityClient';

export default function Page() {
  return <SettingsActivityClient />;
}
