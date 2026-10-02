import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Security' };

import { SettingsSecurityClient } from '@/features/settings/SettingsSecurityClient';

export default function Page() {
  return <SettingsSecurityClient />;
}
