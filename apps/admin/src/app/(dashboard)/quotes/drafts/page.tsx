import type { Metadata } from 'next';
import { QuotesClient } from '@/features/quotes/QuotesClient';

export const metadata: Metadata = { title: 'Quote drafts' };

export default function AdminQuoteDraftsPage() {
  return <QuotesClient initialStatus="draft" title="Draft quotes" />;
}
