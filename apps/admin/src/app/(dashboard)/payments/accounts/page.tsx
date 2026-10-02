import type { Metadata } from 'next';
import { PlatformPaymentAccountsClient } from '@/features/payments/PlatformPaymentAccountsClient';

export const metadata: Metadata = { title: 'Payment accounts' };

export default function PlatformPaymentAccountsPage() {
  return <PlatformPaymentAccountsClient />;
}
