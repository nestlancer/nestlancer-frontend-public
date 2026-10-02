import type { Metadata } from 'next';
import { CompanyLegalProfilesClient } from '@/features/payments/CompanyLegalProfilesClient';

export const metadata: Metadata = { title: 'Company legal' };

export default function CompanyLegalProfilesPage() {
  return <CompanyLegalProfilesClient />;
}
