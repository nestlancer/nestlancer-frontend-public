import Link from 'next/link';

import { routes } from '@nestlancer/constants';

import { cn } from '@nestlancer/ui';

type Props = {
  variant?: 'inline' | 'article';
  className?: string;
};

export function BlogHireCta({ variant = 'inline', className }: Props) {
  if (variant === 'article') {
    return (
      <aside
        className={cn(
          'rounded-2xl border border-border bg-[linear-gradient(180deg,hsl(var(--primary)/0.1),transparent)] px-6 py-8 text-center shadow-[var(--elevation-1)]',
          className
        )}
      >
        <div className="intake-badge mx-auto">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[hsl(var(--success))] opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[hsl(var(--success))]" />
          </span>
          Intake open
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          Ready to work with the studio?
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Post a project request or get in touch — milestone quotes, scheduled payments, and
          delivery in one workspace.
        </p>
        <Link
          href={routes.register}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_0_28px_hsl(var(--primary)/0.25)] transition hover:opacity-90"
        >
          Start a project →
        </Link>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-border bg-surface px-5 py-5 shadow-[var(--elevation-1)] sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div>
        <p className="font-semibold text-foreground">Ready to start a project?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a client account and submit your brief to the Nestlancer studio.
        </p>
      </div>
      <Link
        href={routes.contact}
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        Contact us →
      </Link>
    </aside>
  );
}
