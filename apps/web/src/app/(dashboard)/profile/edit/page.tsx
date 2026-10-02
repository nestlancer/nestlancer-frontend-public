import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Edit profile' };

import { ProfileEditClient } from '@/features/profile/ProfileEditClient';

export default function Page() {
  return <ProfileEditClient />;
}
