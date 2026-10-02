'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys, routes } from '@nestlancer/constants';
import { Button, EmptyState, ErrorState, PageHeader, SkeletonTable } from '@nestlancer/ui';

import { apiServices } from '@/lib/axios';

type BookmarkRow = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  publishedAt?: string;
};

function parseBookmarks(raw: unknown): BookmarkRow[] {
  if (!raw) return [];
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { data?: unknown[] }).data)
      ? (raw as { data: unknown[] }).data
      : Array.isArray((raw as { items?: unknown[] }).items)
        ? (raw as { items: unknown[] }).items
        : [];
  return arr.map((b) => {
    const o = b && typeof b === 'object' ? (b as Record<string, unknown>) : {};
    const post = o.post && typeof o.post === 'object' ? (o.post as Record<string, unknown>) : o;
    return {
      id: String(o.id ?? post.id ?? ''),
      slug: String(post.slug ?? o.slug ?? ''),
      title: String(post.title ?? o.title ?? 'Untitled'),
      excerpt: post.excerpt ? String(post.excerpt) : undefined,
      publishedAt: post.publishedAt ? String(post.publishedAt) : undefined,
    };
  });
}

export function BlogBookmarksClient() {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: queryKeys.blog.list({ scope: 'bookmarks' }),
    queryFn: () => apiServices.blog.getBookmarks(),
  });

  const removeM = useMutation({
    mutationFn: (slug: string) => apiServices.blog.unbookmarkPost(slug),
    onSuccess: () => {
      toast.success('Bookmark removed.');
      void qc.invalidateQueries({ queryKey: queryKeys.blog.list({ scope: 'bookmarks' }) });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not remove bookmark')),
  });

  const bookmarks = parseBookmarks(q.data);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12">
      <PageHeader title="Bookmarks" description="Blog posts you have saved for later." />

      {q.isPending ? <SkeletonTable rows={4} cols={1} className="mt-8" /> : null}

      {q.isError ? (
        <ErrorState
          className="mt-8"
          title="Could not load bookmarks"
          message={getApiErrorMessage(q.error)}
          onRetry={() => void q.refetch()}
        />
      ) : null}

      {!q.isPending && !q.isError && bookmarks.length === 0 ? (
        <EmptyState
          className="mt-8"
          variant="no-data"
          title="No bookmarks yet"
          description="Save posts from the blog to read them later."
          action={
            <Button variant="outline" asChild>
              <Link href={routes.blog}>Browse the blog</Link>
            </Button>
          }
        />
      ) : null}

      {!q.isPending && !q.isError && bookmarks.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {bookmarks.map((b) => (
            <li
              key={b.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface p-5"
            >
              <div className="min-w-0">
                <Link
                  href={routes.blogPost(b.slug)}
                  className="block font-semibold text-foreground hover:text-primary hover:underline"
                >
                  {b.title}
                </Link>
                {b.excerpt ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{b.excerpt}</p>
                ) : null}
                {b.publishedAt ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(b.publishedAt).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-destructive"
                disabled={removeM.isPending}
                onClick={() => removeM.mutate(b.slug)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
