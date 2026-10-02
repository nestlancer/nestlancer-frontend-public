import type { Metadata } from 'next';
import { IntegrationsClient } from '@/features/integrations/IntegrationsClient';

export const metadata: Metadata = { title: 'Integrations' };

export default function IntegrationsPage() {
  return <IntegrationsClient />;
}
