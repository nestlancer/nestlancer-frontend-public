import Link from 'next/link';

import type { BlogCategorySummary } from '@nestlancer/types';
import { routes } from '@nestlancer/constants';

type Props = {
  category?: Pick<BlogCategorySummary, 'name' | 'slug'> | null;
};

/** Compact journal context for the article left rail (admin authorship → studio). */
export function BlogArticleContextRail({ category }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-[hsl(var(--article-meta))]">
          Journal
        </p>
        <Link
          href={routes.blog}
          className="mt-2 block text-sm font-medium text-[hsl(var(--article-accent))] hover:underline"
        >
          All articles
        </Link>
        {category ? (
          <Link
            href={`${routes.blog}?category=${encodeURIComponent(category.slug)}`}
            className="mt-1.5 block text-sm text-[hsl(var(--article-muted))] transition-colors hover:text-[hsl(var(--article-accent))]"
          >
            More in {category.name}
          </Link>
        ) : null}
      </div>

      <div className="border-t border-[hsl(var(--article-border))] pt-6">
        <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-[hsl(var(--article-meta))]">
          Written by
        </p>
        <p className="mt-2 text-sm font-semibold text-[hsl(var(--article-text))]">
          Nestlancer Editorial
        </p>
      </div>
    </div>
  );
}
