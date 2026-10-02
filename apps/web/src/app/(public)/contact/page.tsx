import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Container, EngineeredPanel, FigLabel } from '@nestlancer/ui';

import { Reveal, ZigReveal } from '@/components/motion/MotionPrimitives';
import { ContactFormClient } from '@/features/contact/ContactFormClient';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact',
  description:
    'Contact the Nestlancer studio for project inquiries, support, and partnerships. We typically respond within one business day.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <>
      <section className="hero-orbs border-b border-border py-12 sm:py-16">
        <Container className="relative z-10 mx-auto max-w-lg">
          <Reveal>
            <FigLabel>FIG · Contact</FigLabel>
            <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Contact</h1>
            <p className="mt-2 text-muted-foreground">
              Sales, support, and partnership inquiries. We typically respond within one business
              day.
            </p>
          </Reveal>
        </Container>
      </section>
      <Container className="py-12 sm:py-14">
        <div className="mx-auto grid max-w-4xl min-w-0 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <ZigReveal index={0} className="min-w-0">
            <EngineeredPanel className="h-full min-w-0 overflow-x-clip p-6 sm:p-8">
              <Suspense
                fallback={
                  <div className="h-48 animate-pulse rounded-xl bg-surface-muted" aria-hidden />
                }
              >
                <ContactFormClient />
              </Suspense>
            </EngineeredPanel>
          </ZigReveal>
          <ZigReveal index={1} className="space-y-4">
            <EngineeredPanel className="p-5">
              <h2 className="text-sm font-semibold">Studio</h2>
              <p className="mt-2 text-sm text-muted-foreground">hello@nestlancer.com</p>
              <span className="mt-3 inline-flex rounded-full border border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.08)] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--success))]">
                Typical reply &lt; 24h
              </span>
            </EngineeredPanel>
            <div className="flex min-w-0 flex-wrap gap-2 overflow-x-clip">
              {['Reply in 24h', 'Fixed-price', 'Made in India'].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-[0.7rem] font-semibold text-muted-foreground"
                >
                  ✓ {t}
                </span>
              ))}
            </div>
          </ZigReveal>
        </div>
      </Container>
    </>
  );
}
