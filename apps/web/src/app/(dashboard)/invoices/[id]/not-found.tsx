import Link from 'next/link';

import { routes } from '@nestlancer/constants';
import { Button } from '@nestlancer/ui';

export default function NotFound() {
  return (
    <div className="space-y-4 py-12 text-center">
      <h2 className="text-lg font-semibold">Invoice not found</h2>
      <Button asChild>
        <Link href={routes.invoices}>Back to invoices</Link>
      </Button>
    </div>
  );
}
