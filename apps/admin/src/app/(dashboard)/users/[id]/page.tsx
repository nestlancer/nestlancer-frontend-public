import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isRouteUuid } from '@nestlancer/validators';

import { UserDetailClient } from '@/features/users/UserDetailClient';

/**
 * Static segments that must not be treated as user UUIDs (NL-UI-001).
 * Bulk ops live on the directory; role changes live on the detail page.
 */
const RESERVED_USER_SEGMENTS = new Set(['bulk', 'roles', 'search', 'new']);

export const metadata: Metadata = { title: 'User detail' };

export default function UserDetailPage({ params }: { params: { id: string } }) {
  if (RESERVED_USER_SEGMENTS.has(params.id) || !isRouteUuid(params.id)) {
    notFound();
  }
  return <UserDetailClient userId={params.id} />;
}
