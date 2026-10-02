'use client';

import Link from 'next/link';

import { Button, cn, EngineeredPanel } from '@nestlancer/ui';

import { Reveal, ZigReveal } from '@/components/motion/MotionPrimitives';
import { STUDIO_OFFERS } from '@/lib/studio-offers';

export function PricingPlans() {
  return (
    <div>
      <Reveal>
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-muted-foreground">
          Nestlancer prices project work — not SaaS seats. Packages and custom quotes use a clear
          milestone payment schedule (deposit, mid, final).
        </p>
      </Reveal>

      <div className="grid min-w-0 gap-6 md:grid-cols-3">
        {STUDIO_OFFERS.map((offer, i) => (
          <ZigReveal key={offer.slug} index={i} className="min-w-0">
            <EngineeredPanel
              className={cn(
                'relative flex h-full min-w-0 flex-col overflow-x-clip p-6',
                offer.highlighted &&
                  'border-primary/45 bg-[linear-gradient(180deg,hsl(var(--primary)/0.08),transparent_40%)] shadow-[0_0_0_1px_hsl(var(--primary)/0.15),var(--elevation-2)]'
              )}
            >
              {offer.highlighted ? (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-primary-foreground">
                  Popular
                </span>
              ) : null}
              <h2 className="text-lg font-semibold">{offer.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{offer.description}</p>
              <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums">{offer.price}</p>
              <p className="text-xs text-muted-foreground">{offer.timeline}</p>
              <ul className="mb-6 mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                {offer.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="font-bold text-[hsl(var(--success))]" aria-hidden>
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={offer.highlighted ? 'default' : 'outline'}
                className="w-full rounded-full"
              >
                <Link href={offer.href}>{offer.cta}</Link>
              </Button>
            </EngineeredPanel>
          </ZigReveal>
        ))}
      </div>
    </div>
  );
}
