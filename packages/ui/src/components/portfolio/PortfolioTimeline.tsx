'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '../../utils/cn';

export type PortfolioTimelineEntry = {
  id: string;
  title: string;
  /** Pre-formatted display date (e.g. "Mar 2024"). */
  dateLabel: string;
  href?: string;
  /** Shown in admin preview only (DRAFT, PUBLISHED, …). */
  status?: string;
  thumbnailUrl?: string | null;
  category?: string | null;
  summary?: string | null;
  year?: string | null;
  featured?: boolean;
  technologies?: string[];
};

export type PortfolioTimelineProps = {
  entries: PortfolioTimelineEntry[];
  /** Public site vs admin live preview styling. */
  variant?: 'public' | 'admin';
  className?: string;
  emptyMessage?: string;
};

type YearGroup = {
  year: string;
  items: Array<{ entry: PortfolioTimelineEntry; index: number }>;
};

function groupByYear(entries: PortfolioTimelineEntry[]): YearGroup[] {
  const groups: YearGroup[] = [];
  entries.forEach((entry, index) => {
    const year = entry.year?.trim() || 'Timeline';
    const last = groups[groups.length - 1];
    if (last && last.year === year) {
      last.items.push({ entry, index });
    } else {
      groups.push({ year, items: [{ entry, index }] });
    }
  });
  return groups;
}

function padIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

const STAGGER_CLASS = [
  'delay-0',
  'delay-75',
  'delay-100',
  'delay-150',
  'delay-200',
  'delay-300',
  'delay-500',
  'delay-700',
] as const;

function staggerClass(index: number): string {
  return STAGGER_CLASS[Math.min(Math.max(index, 0), STAGGER_CLASS.length - 1)] ?? 'delay-0';
}

function safeImageSrc(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('//') || trimmed.includes('\\')) return null;
  for (let i = 0; i < trimmed.length; i += 1) {
    const code = trimmed.charCodeAt(i);
    if (code <= 31 || code === 127) return null;
  }
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    return trimmed;
  } catch {
    return null;
  }
}

function AdminTimelineRow({
  entry,
  index,
  visible,
}: {
  entry: PortfolioTimelineEntry;
  index: number;
  visible: boolean;
}) {
  const isPublished = !entry.status || entry.status.toUpperCase().includes('PUBLISH');
  const rowClass = cn(
    'relative pl-10 sm:pl-14 opacity-0 motion-reduce:opacity-100',
    visible && 'animate-fade-in-up opacity-100 motion-reduce:animate-none',
    visible && staggerClass(index)
  );

  return (
    <li className={rowClass}>
      <span
        className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-border bg-background"
        aria-hidden
      >
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            isPublished ? 'bg-primary' : 'bg-muted-foreground/50'
          )}
        />
      </span>
      <div className="py-2">
        <time
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground tabular-nums"
          dateTime={entry.dateLabel}
        >
          {entry.dateLabel}
        </time>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {entry.title}
          </h3>
          {entry.status ? (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                isPublished ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              {entry.status.replace(/_/g, ' ')}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function PublicTimelineCard({
  entry,
  index,
  align,
}: {
  entry: PortfolioTimelineEntry;
  index: number;
  align: 'left' | 'right';
}) {
  const techs = entry.technologies?.slice(0, 4) ?? [];
  const thumb = safeImageSrc(entry.thumbnailUrl);
  const inner = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
        {thumb ? (
          <img
            src={thumb}
            alt={entry.title ? `${entry.title} project thumbnail` : 'Portfolio project thumbnail'}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            loading={index < 2 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'auto'}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-surface-muted to-background" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2 py-0.5 font-mono text-[11px] tabular-nums text-foreground backdrop-blur-sm">
          {padIndex(index)}
        </span>
        {entry.featured ? (
          <span className="absolute right-3 top-3 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary backdrop-blur-sm">
            Featured
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <time
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary"
            dateTime={entry.dateLabel}
          >
            {entry.dateLabel}
          </time>
          {entry.category ? (
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {entry.category}
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 font-display text-xl font-semibold tracking-tight transition-colors group-hover:text-primary sm:text-2xl">
          {entry.title}
        </h3>
        {entry.summary ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {entry.summary}
          </p>
        ) : null}
        {techs.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {techs.map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {tech}
              </li>
            ))}
          </ul>
        ) : null}
        {entry.href ? (
          <p className="mt-4 text-xs font-semibold text-primary">
            View case study <span aria-hidden>→</span>
          </p>
        ) : null}
      </div>
    </>
  );

  const cardClass = cn(
    'nl-ptl-card group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--elevation-1)] transition-[border-color,box-shadow,transform] duration-300',
    'hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[var(--elevation-2)]',
    align === 'left' ? 'nl-ptl-card--left' : 'nl-ptl-card--right'
  );

  if (entry.href) {
    return (
      <a href={entry.href} className={cardClass}>
        {inner}
      </a>
    );
  }

  return <article className={cardClass}>{inner}</article>;
}

function PublicTimelineItem({ entry, index }: { entry: PortfolioTimelineEntry; index: number }) {
  const alignRight = index % 2 === 1;

  return (
    <li
      data-ptl-item
      className="nl-ptl-item relative grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-4 data-[active]:[&_.nl-ptl-dot]:scale-125 md:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] md:gap-x-0"
    >
      <span
        className="nl-ptl-dot relative z-[1] col-start-1 row-start-1 mt-8 flex h-4 w-4 items-center justify-center justify-self-center rounded-full border-2 border-primary bg-background transition-transform duration-300 md:col-start-2 md:mt-10 md:h-5 md:w-5"
        aria-hidden
      >
        <span className="nl-ptl-dot-pulse h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.45)] md:h-2 md:w-2" />
      </span>
      <div
        className={cn(
          'nl-ptl-card-slot col-start-2 row-start-1 min-w-0',
          alignRight ? 'md:col-start-3 md:pl-8' : 'md:col-start-1 md:pr-8'
        )}
      >
        <PublicTimelineCard entry={entry} index={index} align={alignRight ? 'right' : 'left'} />
      </div>
    </li>
  );
}

function PublicTimeline({
  entries,
  className,
}: {
  entries: PortfolioTimelineEntry[];
  className?: string;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const groups = groupByYear(entries);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;

    const items = root.querySelectorAll<HTMLElement>('[data-ptl-item]');
    const observer = new IntersectionObserver(
      (observed) => {
        for (const entry of observed) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-active', '');
          } else {
            entry.target.removeAttribute('data-active');
          }
        }
      },
      { threshold: 0.28, rootMargin: '-18% 0px -38% 0px' }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [entries]);

  return (
    <section
      ref={rootRef}
      className={cn('nl-ptl relative isolate overflow-x-clip', className)}
      aria-label="Project timeline"
    >
      <div
        className="pointer-events-none absolute bottom-4 left-[0.95rem] top-4 w-px bg-gradient-to-b from-primary/50 via-border to-transparent md:left-1/2 md:-translate-x-1/2"
        aria-hidden
      />
      <div
        className="nl-ptl-progress pointer-events-none absolute bottom-4 left-[0.95rem] top-4 w-px origin-top bg-primary md:left-1/2 md:-translate-x-1/2"
        aria-hidden
      />
      <ol className="relative space-y-10 sm:space-y-14">
        {groups.flatMap((group) => [
          <li key={`year-${group.year}`} className="flex justify-start md:justify-center">
            <p className="ml-8 rounded-full border border-border bg-background/90 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground shadow-[var(--elevation-1)] backdrop-blur-md md:ml-0">
              {group.year}
            </p>
          </li>,
          ...group.items.map(({ entry, index }) => (
            <PublicTimelineItem key={entry.id} entry={entry} index={index} />
          )),
        ])}
      </ol>
    </section>
  );
}

export function PortfolioTimeline({
  entries,
  variant = 'public',
  className,
  emptyMessage = 'No projects yet.',
}: PortfolioTimelineProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (variant !== 'admin') return;
    const el = rootRef.current;
    if (!el) return;

    const reveal = () => {
      setVisible(true);
      observer?.disconnect();
    };

    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) reveal();
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
      );
      observer.observe(el);
    } else {
      reveal();
    }

    return () => observer?.disconnect();
  }, [variant]);

  if (entries.length === 0) {
    return (
      <p className={cn('py-12 text-center text-sm text-muted-foreground', className)}>
        {emptyMessage}
      </p>
    );
  }

  if (variant === 'public') {
    return <PublicTimeline entries={entries} className={className} />;
  }

  return (
    <section ref={rootRef} className={cn('relative', className)} aria-label="Project timeline">
      <div className="absolute bottom-2 left-2 top-2 w-px bg-border" aria-hidden />
      <div
        className={cn(
          'absolute left-2 top-2 h-[calc(100%-1rem)] w-px origin-top bg-primary/70 motion-reduce:scale-y-100',
          visible ? 'scale-y-100 transition-transform duration-[1.4s] ease-out' : 'scale-y-0'
        )}
        aria-hidden
      />
      <ol className="relative space-y-10 sm:space-y-14">
        {entries.map((entry, index) => (
          <AdminTimelineRow key={entry.id} entry={entry} index={index} visible={visible} />
        ))}
      </ol>
    </section>
  );
}
