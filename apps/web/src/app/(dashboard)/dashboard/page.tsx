import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

import { DashboardOverview } from './DashboardOverview';

export default function Page() {
  return <DashboardOverview />;
}
