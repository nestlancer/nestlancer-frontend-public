import type { Metadata } from 'next';
import { QuotesClient } from '@/features/quotes/QuotesClient';

export const metadata: Metadata = { title: 'Quotes' };

export default function AdminQuotesPage() {
  return <QuotesClient />;
}
