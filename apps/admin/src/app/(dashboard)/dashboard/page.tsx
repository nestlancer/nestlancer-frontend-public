import type { Metadata } from 'next';
import { DashboardClient } from '@/features/dashboard/DashboardClient';

export const metadata: Metadata = { title: 'Command center' };

export default function AdminDashboardPage() {
  return <DashboardClient />;
}
