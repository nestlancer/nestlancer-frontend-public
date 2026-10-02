import Link from 'next/link';

import { cn } from '@nestlancer/ui';

type Props = {
  basePath: string;
  page: number;
  totalPages: number;
  categorySlug?: string | null;
};

function pageHref(basePath: string, page: number, categorySlug?: string | null): string {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (categorySlug) params.set('category', categorySlug);
  const q = params.toString();
  return q ? `${basePath}?${q}` : basePath;
}

export function BlogPagination({ basePath, page, totalPages, categorySlug }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <nav aria-label="Blog pagination" className="mt-12 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link
          href={pageHref(basePath, page - 1, categorySlug)}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Previous
        </Link>
      ) : null}
      {pages.map((p) => (
        <Link
          key={p}
          href={pageHref(basePath, p, categorySlug)}
          aria-current={p === page ? 'page' : undefined}
          className={cn(
            'min-w-[2.5rem] rounded-lg border px-3 py-2 text-center text-sm font-medium',
            p === page
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border hover:bg-muted'
          )}
        >
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link
          href={pageHref(basePath, page + 1, categorySlug)}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Next
        </Link>
      ) : null}
    </nav>
  );
}
