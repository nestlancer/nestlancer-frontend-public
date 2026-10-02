import type { Metadata } from 'next';
import { GePageHeader as PageHeader } from '@/components/admin/AdminGentelellaUI';

/** Coming-soon placeholder so /api-keys is not a hard 404 (NL-BUG-UI-017). */
export const metadata: Metadata = { title: 'API keys' };

export default function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="Integrations"
        title="API keys"
        description="Programmatic access keys for Nestlancer integrations."
      />
      <div className="rounded-lg border border-border/80 bg-muted/20 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-foreground">Coming soon</p>
        <p className="mt-2 text-sm text-muted-foreground">
          API key management is not available yet. Use the Integrations page for connected services
          in the meantime.
        </p>
      </div>
    </div>
  );
}
