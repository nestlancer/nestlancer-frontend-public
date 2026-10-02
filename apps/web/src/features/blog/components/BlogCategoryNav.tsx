'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import type { BlogCategorySummary } from '@nestlancer/types';
import { routes } from '@nestlancer/constants';

import { cn } from '@nestlancer/ui';

function buildHref(pathname: string, params: URLSearchParams, category: string | null): string {
  const next = new URLSearchParams(params.toString());
  if (category) next.set('category', category);
  else next.delete('category');
  next.delete('page');
  const q = next.toString();
  return q ? `${pathname}?${q}` : pathname;
}

export function BlogCategoryNav({ categories }: { categories: BlogCategorySummary[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get('category');

  const pills = [
    { slug: null, name: 'All topics' },
    ...categories.map((c) => ({ slug: c.slug, name: c.name })),
  ];

  return (
    <nav aria-label="Filter by category" className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {pills.map((pill) => {
        const isActive = (pill.slug ?? null) === (activeSlug || null);
        return (
          <Link
            key={pill.slug ?? 'all'}
            href={buildHref(pathname || routes.blog, searchParams, pill.slug)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            {pill.name}
          </Link>
        );
      })}
    </nav>
  );
}
