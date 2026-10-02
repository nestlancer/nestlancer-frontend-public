import type { Metadata } from 'next';
import { AuditClient } from '@/features/audit/AuditClient';

export const metadata: Metadata = { title: 'Audit' };

export default function AuditPage() {
  return <AuditClient />;
}
