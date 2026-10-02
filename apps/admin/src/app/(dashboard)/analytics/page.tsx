import type { Metadata } from 'next';
import { AnalyticsClient } from '@/features/analytics/AnalyticsClient';

export const metadata: Metadata = { title: 'Analytics' };

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
