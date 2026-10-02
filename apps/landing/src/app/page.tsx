import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { BRAND } from '@nestlancer/constants';
import { Button, Container } from '@nestlancer/ui';

import { HeroSection } from '../components/marketing/HeroSection';
import { HomeBelowFold } from '../components/marketing/HomeBelowFold';
import { MarketingHeader } from '../components/marketing/MarketingHeader';
import { ScrollProgress } from '../components/motion/MotionPrimitives';
import { webAppUrl } from '../lib/web-app-url';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.longDescription,
  path: '/',
});

export const revalidate = 300;

const heroRevampEnabled = (() => {
  const raw = process.env.NEXT_PUBLIC_FEATURE_LANDING_HERO_REVAMP;
  if (!raw) return true;
  const value = raw.trim().toLowerCase();
  if (value === '0' || value === 'false' || value === 'no' || value === 'off') return false;
  return true;
})();

function BelowFoldFallback() {
  return <div className="section-py min-h-[40vh]" aria-hidden />;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <ScrollProgress />
      <MarketingHeader />
      <main id="main-content">
        {heroRevampEnabled ? (
          <HeroSection />
        ) : (
          <section className="relative overflow-hidden py-20 lg:py-28">
            <Container>
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
                  Work with the Nestlancer studio — from brief to delivery.
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                  Nestlancer helps teams run requests, quotes, and project delivery in one place.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button asChild size="lg" className="rounded-full">
                    <Link href={webAppUrl('/register')}>Get started</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full">
                    <Link href={webAppUrl('/portfolio')}>View portfolio</Link>
                  </Button>
                </div>
              </div>
            </Container>
          </section>
        )}

        <Suspense fallback={<BelowFoldFallback />}>
          <HomeBelowFold />
        </Suspense>
      </main>
    </div>
  );
}
