import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { routes } from '@nestlancer/constants';

export const metadata: Metadata = { title: 'Settings' };

/** Settings hub lands on Account — Profile lives at /profile. */
export default function Page() {
  redirect(routes.settingsAccount);
}
