import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New request' };

import { NewRequestClient } from '@/features/requests/NewRequestClient';

export default function Page() {
  return <NewRequestClient />;
}
