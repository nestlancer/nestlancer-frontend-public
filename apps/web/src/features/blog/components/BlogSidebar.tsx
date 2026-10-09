import Link from 'next/link';

import type { BlogCategorySummary } from '@nestlancer/types';
import { landingUrl, routes } from '@nestlancer/constants';

import { cn } from '@nestlancer/ui';

type Props = {
  categories: BlogCategorySummary[];
  totalPostCount: number;
  activeCategorySlug: string | null;
  className?: string;
  id?: string;
};

function categoryHref(slug: string | null): string {
  if (!slug) return routes.blog;
  return `${routes.blog}?category=${encodeURIComponent(slug)}`;
}

export function BlogSidebar({
  categories,
  totalPostCount,
  activeCategorySlug,
  className,
  id = 'blog-sidebar',
}: Props) {
  const allActive = !activeCategorySlug;

  return (
    <aside
      id={id}
      className={cn(
        'flex h-full flex-col border-r border-border/80 bg-background px-6 py-8 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto',
        className
      )}
    >
      <div>
        <a
          href={landingUrl('/')}
          className="font-display text-lg font-bold tracking-tight text-primary"
        >
          Nestlancer
        </a>
        <p className="mt-1.5 text-sm leading-snug text-muted-foreground">
          Journal for product teams &amp; studio clients
        </p>
      </div>

      <nav className="mt-8" aria-label="Blog categories">
        <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Categories
        </p>
        <ul className="mt-3 space-y-0.5">
          <li>
            <Link
              href={categoryHref(null)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors',
                allActive
                  ? 'bg-primary/10 font-medium text-foreground ring-1 ring-inset ring-primary/25'
                  : 'text-foreground hover:bg-muted/60'
              )}
            >
              <span>All articles</span>
              <span className="font-mono text-[11px] text-muted-foreground">{totalPostCount}</span>
            </Link>
          </li>
          {categories.map((cat) => {
            const active = activeCategorySlug === cat.slug;
            return (
              <li key={cat.id}>
                <Link
                  href={categoryHref(cat.slug)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors',
                    active
                      ? 'bg-primary/10 font-medium text-foreground ring-1 ring-inset ring-primary/25'
                      : 'text-foreground hover:bg-muted/60'
                  )}
                >
                  <span>{cat.name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {cat.postCount ?? '—'}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-8 space-y-2">
        <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Tools
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href="/blog/feed/rss"
            className="inline-flex items-center rounded-md border border-foreground/25 bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            RSS
          </a>
          <Link
            href={routes.blogBookmarks}
            prefetch={false}
            className="inline-flex items-center rounded-md border border-foreground/25 bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            Bookmarks
          </Link>
        </div>
      </div>

      <p className="mt-auto pt-8 font-mono text-[11px] text-muted-foreground">
        <Link href={routes.blog} className="text-primary hover:underline">
          Journal home
        </Link>
      </p>
    </aside>
  );
}
