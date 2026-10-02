'use client';

import Link from 'next/link';

import { Button, Container, FigLabel, ProductStage, StatusPill } from '@nestlancer/ui';

import {
  FadeUp,
  KineticHeadline,
  ProgressFill,
  StageEnter,
} from '@/components/motion/MotionPrimitives';

/** Never ship localhost CTAs from a production build (audit NL-BUG-CMS-001). */
const webAppBase = (() => {
  const raw = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/\/$/, '');
  if (raw && !/localhost|127\.0\.0\.1/.test(raw)) return raw;
  if (process.env.NODE_ENV === 'production') return 'https://app.nestlancer.com';
  return raw || 'http://localhost:9000';
})();

const HEADLINE = [
  { text: 'Ship' },
  { text: 'with' },
  { text: 'clients' },
  { text: 'in', highlight: true },
  { text: 'the', highlight: true },
  { text: 'loop', highlight: true },
  { text: '—' },
  { text: 'and' },
  { text: 'money' },
  { text: 'under' },
  { text: 'control.' },
] as const;

export function HeroSection() {
  return (
    <section className="hero-orbs relative overflow-hidden pb-16 pt-12 text-center lg:pb-24 lg:pt-16">
      <Container className="relative z-10">
        <FadeUp className="intake-badge mx-auto" delay={0.05}>
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[hsl(var(--success))] opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[hsl(var(--success))]" />
          </span>
          Intake open
        </FadeUp>

        <FadeUp delay={0.12}>
          <FigLabel>FIG 01 · Nexus surface</FigLabel>
        </FadeUp>

        <KineticHeadline
          ariaLabel="Ship with clients in the loop — and money under control."
          className="mx-auto max-w-[15ch] text-balance text-4xl font-bold tracking-[-0.05em] sm:text-5xl lg:text-6xl xl:text-[4.2rem] xl:leading-[1.02]"
          words={[...HEADLINE]}
        />

        <FadeUp delay={0.35}>
          <p className="mx-auto mt-5 max-w-[46ch] text-base text-muted-foreground sm:text-lg">
            Nestlancer fuses a dedicated product studio with an operating system for delivery:
            fixed-price quotes, milestone payments, live Project Hub, and Razorpay / UPI.
          </p>
        </FadeUp>

        <FadeUp delay={0.45} className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="rounded-full px-6 shadow-[0_0_28px_hsl(var(--primary)/0.25)] transition-transform hover:-translate-y-0.5"
          >
            <Link href={`${webAppBase}/register`}>Start a project →</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full bg-transparent transition-transform hover:-translate-y-0.5"
          >
            <Link href="#how-it-works">Tour the product</Link>
          </Button>
        </FadeUp>

        <div className="mt-12 grid gap-4 text-left lg:grid-cols-[1.15fr_0.85fr]">
          <StageEnter delay={0.55} from="left">
            <ProductStage
              title="project-hub · NL-204"
              trailing={<span className="tabular-nums">68%</span>}
            >
              <div className="grid min-h-[280px] md:grid-cols-[160px_1fr]">
                <aside className="hidden border-r border-border bg-[hsl(0_0%_3%)] p-2.5 dark:bg-black/40 md:block">
                  {['Overview', 'Milestones', 'Messages', 'Payments', 'Files'].map((item, i) => (
                    <div
                      key={item}
                      className={`mb-0.5 rounded-md px-2 py-1.5 text-xs ${
                        i === 0
                          ? 'bg-surface-muted font-medium text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </aside>
                <div className="p-3.5">
                  <div className="rounded-[10px] border border-border bg-background p-4">
                    <p className="font-mono text-[0.7rem] text-muted-foreground">
                      NL-204 · Milestone 3
                    </p>
                    <p className="mt-1 text-sm font-semibold tracking-tight">
                      Frontend development — SaaS Landing Redesign
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <StatusPill tone="primary">In progress</StatusPill>
                      <StatusPill tone="success">Deposit paid</StatusPill>
                      <StatusPill>Due Fri</StatusPill>
                      <StatusPill mono>₹48,000</StatusPill>
                    </div>
                    <ProgressFill className="mt-3" percent={68} />
                    <ul className="mt-3 space-y-2.5 text-xs">
                      <li className="flex gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[0.55rem] font-bold text-muted-foreground">
                          NL
                        </span>
                        <span>
                          <strong className="block font-medium">Staging build pushed</strong>
                          <span className="text-muted-foreground">
                            14 min ago · deliverable linked
                          </span>
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[0.55rem] font-bold text-muted-foreground">
                          RH
                        </span>
                        <span>
                          <strong className="block font-medium">
                            Rahul: Hero CTA above the fold?
                          </strong>
                          <span className="text-muted-foreground">1h ago · thread</span>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </ProductStage>
          </StageEnter>

          <StageEnter delay={0.7} from="right" className="hidden md:block">
            <ProductStage
              title="⌘K · command"
              trailing={
                <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[0.65rem]">
                  esc
                </kbd>
              }
              trafficLights={false}
            >
              <div className="flex flex-col gap-2.5 p-3.5">
                <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground">
                  ⌕ Search Nestlancer…
                </div>
                {[
                  ['Open Project Hub', '↵'],
                  ['New request', 'R'],
                  ['Review quote NL-211', 'Q'],
                  ['Pay milestone 3', 'P'],
                ].map(([label, hint], i) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm ${
                      i === 0 ? 'bg-surface-muted text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {label}
                    <span className="font-mono text-[0.65rem] text-muted-foreground/70">
                      {hint}
                    </span>
                  </div>
                ))}
                <div className="mt-1 rounded-[10px] border border-border bg-background p-3 font-mono text-[0.78rem]">
                  <div className="text-muted-foreground">nl status — NL-204</div>
                  <div className="mt-1 text-[hsl(var(--success))]">✓ Discovery complete</div>
                  <div className="text-[hsl(var(--success))]">✓ UI Design complete</div>
                  <div className="text-primary">→ Frontend 68% active</div>
                  <div className="text-muted-foreground">○ QA &amp; handoff pending</div>
                </div>
              </div>
            </ProductStage>
          </StageEnter>
        </div>
      </Container>
    </section>
  );
}
