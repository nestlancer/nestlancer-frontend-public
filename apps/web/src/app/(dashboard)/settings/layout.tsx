import type { ReactNode } from 'react';

import { SettingsLayoutClient } from '@/features/settings/SettingsLayoutClient';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsLayoutClient>{children}</SettingsLayoutClient>;
}
