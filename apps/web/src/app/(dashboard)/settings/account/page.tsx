import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Account settings' };

import { SettingsAccountClient } from '@/features/settings/SettingsAccountClient';

export default function Page() {
  return <SettingsAccountClient />;
}
