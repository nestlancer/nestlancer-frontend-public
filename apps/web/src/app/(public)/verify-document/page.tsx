import type { Metadata } from 'next';

import { DocumentVerifyClient } from '@/features/documents/DocumentVerifyClient';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Verify Document',
  description:
    'Verify the authenticity of a Nestlancer invoice, quote, or contract using the link from your PDF.',
  path: '/verify-document',
  noIndex: true,
});

type PageProps = {
  searchParams?: Promise<{ number?: string; t?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  return (
    <div className="container py-16">
      <DocumentVerifyClient initialNumber={params.number ?? ''} initialToken={params.t ?? ''} />
    </div>
  );
}
