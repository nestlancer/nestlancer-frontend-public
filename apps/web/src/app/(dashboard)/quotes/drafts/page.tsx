import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Draft quotes stay with the operator until they are sent. */
export const metadata: Metadata = { title: 'Quote drafts' };

export default function QuotesDraftsPage() {
  redirect('/quotes');
}
