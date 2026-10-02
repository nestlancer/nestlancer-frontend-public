import { FigLabel, ProductStage, StatusPill } from '@nestlancer/ui';

const FEATURES = [
  {
    title: 'Project Hub',
    detail: 'Milestones, files, and threads in one surface.',
  },
  {
    title: 'Milestone payments',
    detail: 'Pay deposit, mid, and final as work is approved.',
  },
  {
    title: 'Razorpay / UPI',
    detail: 'Tabular money — deposits and payouts clear.',
  },
] as const;

/** Decorative right rail for auth pages — mirrors Nexus Fusion home visual language. */
export function AuthBrandPanel() {
  return (
    <aside
      className="hero-orbs relative hidden min-h-dvh w-full overflow-hidden border-l border-border bg-surface-muted lg:flex lg:w-1/2 lg:flex-col"
      aria-hidden
    >
      <div className="relative z-10 flex flex-1 flex-col justify-between gap-10 p-10 xl:p-14">
        <div className="max-w-lg">
          <div className="mb-5 flex w-fit flex-col items-start">
            <div className="intake-badge flex w-fit" aria-hidden="true">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[hsl(var(--success))] opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[hsl(var(--success))]" />
              </span>
              Client portal · live
            </div>

            <FigLabel className="flex w-fit" aria-hidden="true">
              FIG · Portal
            </FigLabel>
          </div>

          <h2 className="text-balance text-3xl font-bold tracking-[-0.05em] xl:text-[2.75rem] xl:leading-[1.08]">
            Your delivery OS — <span className="kinetic-hl">from brief to payout</span>.
          </h2>

          <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-muted-foreground xl:text-[0.95rem]">
            Same studio surface as the public site: engineered panels, teal signal, and money you
            can read at a glance — after you sign in.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md xl:mx-0 xl:max-w-lg">
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.22),transparent_65%)] opacity-70 blur-2xl" />

          <ProductStage
            title="project-hub · NL-204"
            trailing={<span className="tabular-nums">68%</span>}
          >
            <div className="p-3.5">
              <div className="rounded-[10px] border border-border bg-background p-4">
                <p className="font-mono text-[0.7rem] text-muted-foreground">
                  NL-204 · Milestone 3
                </p>
                <p className="mt-1 text-sm font-semibold tracking-tight">
                  Frontend — SaaS Landing Redesign
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <StatusPill tone="primary">In progress</StatusPill>
                  <StatusPill tone="success">Deposit paid</StatusPill>
                  <StatusPill mono>₹48,000</StatusPill>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full w-[68%] rounded-full bg-primary transition-[width] duration-700" />
                </div>
                <ul className="mt-3 space-y-2 text-xs">
                  <li className="flex gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[0.55rem] font-bold text-muted-foreground">
                      NL
                    </span>
                    <span>
                      <strong className="block font-medium">Staging build pushed</strong>
                      <span className="text-muted-foreground">14 min ago · deliverable linked</span>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[0.55rem] font-bold text-muted-foreground">
                      RH
                    </span>
                    <span>
                      <strong className="block font-medium">Rahul: Hero CTA above the fold?</strong>
                      <span className="text-muted-foreground">1h ago · thread</span>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </ProductStage>
        </div>

        <ul className="grid gap-2.5 sm:grid-cols-3">
          {FEATURES.map((item) => (
            <li key={item.title} className="engineered-panel px-3.5 py-3">
              <p className="text-xs font-semibold tracking-tight text-foreground">{item.title}</p>
              <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
