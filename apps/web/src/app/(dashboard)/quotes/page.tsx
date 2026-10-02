import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Quotes' };

import { QuotesListClient } from '@/features/quotes/QuotesListClient';

export default function Page() {
  return <QuotesListClient />;
}
