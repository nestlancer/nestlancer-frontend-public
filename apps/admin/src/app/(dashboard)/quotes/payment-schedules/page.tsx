import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Payment schedules are edited on the quote they belong to. */
export const metadata: Metadata = { title: 'Payment schedules' };

export default function AdminQuoteSchedulesPage() {
  redirect('/quotes');
}
