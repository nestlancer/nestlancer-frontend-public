import type { Metadata } from 'next';

import { landingUrl } from '@nestlancer/constants';
import { Button, NestlancerLogo } from '@nestlancer/ui';

import { Footer } from '@/components/layout/Footer';
import { PublicHeader } from '@/components/layout/PublicHeader';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="public-editorial flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
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
            <a href={landingUrl('/')}>Home</a>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <a href="/contact">Contact</a>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
