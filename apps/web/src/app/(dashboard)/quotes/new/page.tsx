import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Clients receive quotes; they do not start a blank one. */
export const metadata: Metadata = { title: 'New quote' };

export default function QuotesNewPage() {
  redirect('/quotes');
}
