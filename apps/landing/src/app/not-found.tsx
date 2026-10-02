import type { Metadata } from 'next';
import Link from 'next/link';

import { Button, NestlancerLogo } from '@nestlancer/ui';

import { MarketingFooter } from '../components/marketing/MarketingFooter';
import { MarketingHeader } from '../components/marketing/MarketingHeader';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Page not found',
  description: 'The page you requested could not be found on Nestlancer.',
  path: '/404',
  noIndex: true,
});

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MarketingHeader />
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center"
      >
        <NestlancerLogo variant="icon" size="lg" className="mb-2" />
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Error 404
        </p>
        <h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Page not found</h1>
        <p className="max-w-[36ch] text-muted-foreground">
          This route doesn&apos;t exist on the Nestlancer public surface.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link href="/">Home</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/contact">Contact</Link>
          </Button>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
