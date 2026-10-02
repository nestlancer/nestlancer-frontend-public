import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Payment methods' };

import { PaymentMethodsClient } from '@/features/payments/PaymentMethodsClient';

export default function Page() {
  return <PaymentMethodsClient />;
}
