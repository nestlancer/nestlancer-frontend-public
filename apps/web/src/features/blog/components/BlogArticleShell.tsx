import type { ReactNode } from 'react';
import Link from 'next/link';

import { routes } from '@nestlancer/constants';

type Props = {
  children: ReactNode;
  readLabel?: string;
  readMeta?: ReactNode;
  /** Sticky left column (share, category). Shown xl+. */
  leftRail?: ReactNode;
  /** Sticky right column (TOC). Shown xl+. */
  rightRail?: ReactNode;
};

/**
 * Balanced reading layout: equal side rails + readable center column.
 * Avoids the empty left gutter that appears when only a right TOC is fixed.
 */
export function BlogArticleShell({ children, readLabel, readMeta, leftRail, rightRail }: Props) {
  const hasRails = Boolean(leftRail || rightRail);

  return (
    <div className="border-t border-border/60 bg-[hsl(var(--article-bg))] text-[hsl(var(--article-text))]">
      <div className="sticky top-16 z-20 flex items-center justify-between gap-4 border-b border-[hsl(var(--article-border))] bg-[hsl(var(--article-bg))]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <Link
          href={routes.blog}
          className="text-sm font-medium text-[hsl(var(--article-accent))] hover:underline"
        >
          ← Back to articles
        </Link>
        {readMeta ??
          (readLabel ? (
            <span className="font-mono text-xs text-[hsl(var(--article-meta))]">{readLabel}</span>
          ) : null)}
      </div>

      {hasRails ? (
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="xl:grid xl:grid-cols-[minmax(0,11.5rem)_minmax(0,45rem)_minmax(0,11.5rem)] xl:items-start xl:justify-center xl:gap-10">
            <aside className="hidden xl:block">
              <div className="sticky top-28 space-y-8">{leftRail}</div>
            </aside>
            <div className="mx-auto w-full max-w-[720px] min-w-0 xl:mx-0">{children}</div>
            <aside className="hidden xl:block">
              <div className="sticky top-28">{rightRail}</div>
            </aside>
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[720px] px-4 py-10 sm:px-8 sm:py-12">{children}</div>
      )}
    </div>
  );
}
