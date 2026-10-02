import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Profile' };

import { ProfileViewClient } from '@/features/profile/ProfileViewClient';

export default function Page() {
  return <ProfileViewClient />;
}
