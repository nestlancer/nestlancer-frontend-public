import type { Metadata } from 'next';
import { UsersListClient } from '@/features/users/UsersListClient';

export const metadata: Metadata = { title: 'Users' };

export default function UsersPage() {
  return <UsersListClient />;
}
