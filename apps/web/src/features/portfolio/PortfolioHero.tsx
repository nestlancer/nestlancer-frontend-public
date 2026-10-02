import { Container, FigLabel } from '@nestlancer/ui';

import { KineticHeadline } from '@/components/motion/MotionPrimitives';

export function PortfolioHero({
  projectCount,
  yearSpan,
}: {
  projectCount: number;
  yearSpan?: string | null;
}) {
  return (
    <section className="hero-orbs relative overflow-hidden border-b border-border py-12 sm:py-16">
      <Container className="relative z-10">
        <div className="max-w-3xl">
          <FigLabel>FIG · Work</FigLabel>
          <KineticHeadline
            as="h1"
            ariaLabel="Selected work"
            className="mt-1 text-4xl font-bold tracking-[-0.05em] sm:text-5xl lg:text-6xl"
            words={[{ text: 'Selected' }, { text: 'work', highlight: true }]}
          />
          <p className="mt-5 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            Case studies in sequence — product language, stack, and outcomes. Scroll the timeline;
            each project arrives on its own beat.
          </p>
          {projectCount > 0 ? (
            <p className="mt-6 font-mono text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">{projectCount}</span>
              {projectCount === 1 ? ' project' : ' projects'}
              {yearSpan ? (
                <>
                  <span className="mx-2 text-border">/</span>
                  <span className="tabular-nums">{yearSpan}</span>
                </>
              ) : (
                ' on the timeline'
              )}
            </p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
