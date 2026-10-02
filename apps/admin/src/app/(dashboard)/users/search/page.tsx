import type { Metadata } from 'next';
import { UsersListClient } from '@/features/users/UsersListClient';

/** Search lives on the people list, not on a person named "search". */
export const metadata: Metadata = { title: 'User search' };

export default function UsersSearchPage() {
  return <UsersListClient />;
}
