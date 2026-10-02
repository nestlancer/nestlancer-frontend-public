import type { Metadata } from 'next';
import { QuotesClient } from '@/features/quotes/QuotesClient';

export const metadata: Metadata = { title: 'Quote stats' };

export default function AdminQuoteStatsPage() {
  return <QuotesClient title="Quote statistics" />;
}
