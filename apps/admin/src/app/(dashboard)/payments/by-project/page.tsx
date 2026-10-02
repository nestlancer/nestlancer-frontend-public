import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

/** Deep-link alias — billing-by-project lives at `/payments` (audit ROUTE-01). */
export const metadata: Metadata = { title: 'Payments by project' };

export default function PaymentsByProjectAliasPage() {
  redirect('/payments');
}
