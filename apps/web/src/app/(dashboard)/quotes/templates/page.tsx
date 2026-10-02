import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Quote templates' };

export default function QuotesTemplatesPage() {
  redirect('/quotes');
}
