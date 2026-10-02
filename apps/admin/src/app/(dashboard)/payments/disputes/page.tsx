import type { Metadata } from 'next';
import Link from 'next/link';

import { GePageHeader as PageHeader } from '@/components/admin/AdminGentelellaUI';
import { AdminDisputesSection } from '@/features/payments/AdminDisputesSection';

/** Dedicated disputes queue — must not fall through to /payments/[id] (NL-BUG-UI-014). */
export const metadata: Metadata = { title: 'Disputes' };

export default function PaymentsDisputesPage() {
  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/payments" className="font-medium text-primary hover:underline">
          ← Back to payments
        </Link>
      </nav>
      <PageHeader
        pretitle="Operations"
        title="Payment disputes"
        description="Open and resolved client payment disputes awaiting operator response."
      />
      <AdminDisputesSection />
    </div>
  );
}
