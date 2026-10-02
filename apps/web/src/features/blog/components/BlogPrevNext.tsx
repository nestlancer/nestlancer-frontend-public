import Link from 'next/link';

import type { BlogAdjacentPost } from '@nestlancer/types';
import { routes } from '@nestlancer/constants';

type Props = {
  previous?: BlogAdjacentPost | null;
  next?: BlogAdjacentPost | null;
};

export function BlogPrevNext({ previous, next }: Props) {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Adjacent articles"
      className="mt-14 grid gap-4 border-t border-article pt-10 sm:grid-cols-2"
    >
      {previous ? (
        <Link
          href={routes.blogPost(previous.slug)}
          className="group rounded-lg border border-article px-5 py-4 transition hover:border-[hsl(var(--article-accent))]"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest text-[hsl(var(--article-meta))]">
            ← Previous
          </p>
          <p className="mt-2 text-sm font-semibold text-article group-hover:text-article-accent">
            {previous.title}
          </p>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}
      {next ? (
        <Link
          href={routes.blogPost(next.slug)}
          className="group rounded-lg border border-article px-5 py-4 text-right transition hover:border-[hsl(var(--article-accent))] sm:justify-self-stretch"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest text-[hsl(var(--article-meta))]">
            Next →
          </p>
          <p className="mt-2 text-sm font-semibold text-article group-hover:text-article-accent">
            {next.title}
          </p>
        </Link>
      ) : null}
    </nav>
  );
}
