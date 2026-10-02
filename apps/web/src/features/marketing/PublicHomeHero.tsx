'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@nestlancer/ui';
import { routes } from '@nestlancer/constants';

import { FadeUp, KineticHeadline, StageEnter } from '@/components/motion/MotionPrimitives';
import { HomepagePrimaryCta } from '@/features/marketing/HomepagePrimaryCta';

export function PublicHomeHero({ stage }: { stage?: ReactNode }) {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-12">
      <div className="flex flex-col justify-center space-y-8">
        <div className="space-y-4">
          <FadeUp className="intake-badge w-fit" delay={0.05}>
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[hsl(var(--success))] opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[hsl(var(--success))]" />
            </span>
            Dedicated product studio
          </FadeUp>
          <KineticHeadline
            ariaLabel="Your dedicated studio — from brief to delivery."
            className="text-balance text-5xl font-bold tracking-[-0.05em] sm:text-6xl xl:text-7xl"
            words={[
              { text: 'Your' },
              { text: 'dedicated' },
              { text: 'studio' },
              { text: '—' },
              { text: 'from', highlight: true },
              { text: 'brief', highlight: true },
              { text: 'to', highlight: true },
              { text: 'delivery.', highlight: true },
            ]}
          />
          <FadeUp delay={0.35}>
            <p className="max-w-xl text-balance text-lg text-muted-foreground sm:text-xl">
              Nestlancer is a dedicated studio for serious clients. Clear quotes, milestone
              payments, and collaboration in one premium workspace.
            </p>
          </FadeUp>
        </div>

        <FadeUp delay={0.45} className="flex flex-col gap-4 sm:flex-row">
          <HomepagePrimaryCta className="h-14 rounded-full px-8 text-base shadow-[0_0_28px_hsl(var(--primary)/0.25)] transition-transform hover:-translate-y-0.5" />
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 rounded-full bg-transparent px-8 text-base text-foreground transition-transform hover:-translate-y-0.5"
          >
            <Link href={routes.portfolio}>Browse portfolio</Link>
          </Button>
        </FadeUp>

        <FadeUp
          delay={0.55}
          className="flex flex-wrap items-center gap-3 pt-2 text-sm text-muted-foreground"
        >
          <span>Fixed-price quotes · Milestone payments · Made in India</span>
        </FadeUp>
      </div>

      <StageEnter
        from="right"
        delay={0.2}
        className="relative mx-auto w-full max-w-lg lg:max-w-none"
      >
        {stage ?? (
          <>
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background blur-2xl" />
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-3">
                <div className="relative col-span-1 row-span-2 overflow-hidden rounded-xl border border-border bg-surface p-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent" />
                  <div className="relative z-10 flex h-full flex-col justify-end">
                    <p className="text-sm font-semibold">Unified flow</p>
                    <p className="text-xs text-muted-foreground">Request → Quote → Delivery</p>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface p-3">
                  <p className="text-sm font-semibold">Studio</p>
                  <p className="text-xs text-muted-foreground">One team</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-3">
                  <p className="text-sm font-semibold">Milestones</p>
                  <p className="text-xs text-muted-foreground">Scheduled pay</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-border/50 bg-surface/80 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center gap-2 border-b border-border/50 bg-surface-muted/50 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-danger/80" />
                    <div className="h-3 w-3 rounded-full bg-warning/80" />
                    <div className="h-3 w-3 rounded-full bg-success/80" />
                  </div>
                </div>
                <div className="grid gap-4 p-6">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-32 rounded bg-border" />
                    <div className="h-8 w-24 rounded-md bg-primary/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 rounded-lg border border-border/50 bg-surface p-4 shadow-sm">
                      <div className="h-4 w-1/2 rounded bg-border" />
                      <div className="mt-2 h-6 w-3/4 rounded bg-border/50" />
                    </div>
                    <div className="h-24 rounded-lg border border-border/50 bg-surface p-4 shadow-sm">
                      <div className="h-4 w-1/2 rounded bg-border" />
                      <div className="mt-2 h-6 w-3/4 rounded bg-border/50" />
                    </div>
                  </div>
                  <div className="h-28 rounded-lg border border-border/50 bg-surface p-4 shadow-sm">
                    <div className="mb-3 h-4 w-1/3 rounded bg-border" />
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-border/40" />
                      <div className="h-3 w-4/5 rounded bg-border/40" />
                      <div className="h-3 w-5/6 rounded bg-border/40" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </StageEnter>
    </div>
  );
}
