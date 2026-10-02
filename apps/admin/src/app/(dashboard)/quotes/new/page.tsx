import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** A quote is started from the request it belongs to. */
export const metadata: Metadata = { title: 'New quote' };

export default function AdminQuotesNewPage() {
  redirect('/requests');
}
