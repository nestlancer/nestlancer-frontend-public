'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Button, DataTable, type DataTableColumn, ErrorState, SkeletonTable } from '@nestlancer/ui';
import { ClipboardList, LayoutDashboard } from '@nestlancer/ui/icons';

import { StatusPill } from '@/components/admin/AdminDataViews';
import {
  AdminDataShell,
  AdminFilterBar,
  AdminTablePagination,
  adminDataTableClass,
} from '@/components/admin/AdminPageChrome';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminPagination, pickAdminRows } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

import { BlogPostActions } from './BlogPostActions';
import {
  editPostPath,
  normalizeBlogPostRow,
  publicPostUrl,
  statusTone,
  type BlogPostRow,
} from './blog-admin-helpers';

type ViewMode = 'table' | 'cards';
type ContentPostTableRow = BlogPostRow;
const PAGE_SIZE = 20;

function formatAdminDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return '—';
  }
}

export function ContentPostsPanel() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim());

  const posts = useQuery({
    queryKey: [...adminKeys.posts(), { page, search: deferredSearch, statusFilter }],
    queryFn: () =>
      apiServices.admin.listAdminBlogPosts({
        page,
        limit: PAGE_SIZE,
        search: deferredSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  });

  const postRows = useMemo(() => {
    return pickAdminRows(posts.data)
      .map(normalizeBlogPostRow)
      .filter((p): p is BlogPostRow => p !== null);
  }, [posts.data]);

  const pagination = pickAdminPagination(posts.data);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter]);

  const tableColumns = useMemo<DataTableColumn<ContentPostTableRow>[]>(
    () => [
      {
        id: 'post',
        header: 'Post',
        cell: (post) => (
          <div className="max-w-xs">
            <Link
              href={editPostPath(post.id)}
              className="font-medium hover:text-primary hover:underline"
            >
              {post.title}
            </Link>
            {post.slug ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                /{post.slug}
                {post.status === 'PUBLISHED' ? (
                  <>
                    {' · '}
                    <a
                      href={publicPostUrl(post.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      live
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        cell: (post) => <span className="text-muted-foreground">{post.categoryName || '—'}</span>,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (post) => <StatusPill tone={statusTone(post.status)}>{post.status}</StatusPill>,
      },
      {
        id: 'published',
        header: 'Published',
        cell: (post) => (
          <span className="text-muted-foreground">{formatAdminDate(post.publishedAt)}</span>
        ),
      },
      {
        id: 'stats',
        header: 'Stats',
        cell: (post) => (
          <span className="text-xs text-muted-foreground">
            {post.readingTime ? `${post.readingTime} min` : '—'}
            {post.viewCount != null ? ` · ${post.viewCount} views` : ''}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        className: 'text-right',
        cell: (post) => <BlogPostActions post={post} />,
      },
    ],
    []
  );

  return (
    <AdminDataShell
      filter={
        <AdminFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search posts by title…"
          filters={[
            {
              id: 'status',
              label: 'Status',
              value: statusFilter,
              options: [
                { value: 'all', label: 'All statuses' },
                { value: 'PUBLISHED', label: 'Published' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'SCHEDULED', label: 'Scheduled' },
                { value: 'ARCHIVED', label: 'Archived' },
              ],
              onChange: setStatusFilter,
            },
          ]}
          actions={
            <div className="flex items-center gap-1 rounded-md border border-border p-1">
              <Button
                type="button"
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                aria-label="Table view"
                onClick={() => setViewMode('table')}
              >
                <ClipboardList className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                aria-label="Card view"
                onClick={() => setViewMode('cards')}
              >
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            </div>
          }
        />
      }
      footer={
        pagination ? (
          <AdminTablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPrev={() => setPage((value) => Math.max(1, value - 1))}
            onNext={() => setPage((value) => Math.min(pagination.totalPages, value + 1))}
          />
        ) : null
      }
    >
      {posts.isLoading ? <SkeletonTable rows={6} cols={6} /> : null}
      {posts.error ? (
        <ErrorState
          message="Could not load posts"
          onRetry={() => {
            void posts.refetch();
          }}
        />
      ) : null}
      {!posts.isLoading && !posts.error && postRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No posts match this search and status combination.
        </p>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {postRows.map((post) => (
            <article
              key={post.id}
              className="flex flex-col ge-card rounded-lg border border-border/70 bg-card/30 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <StatusPill tone={statusTone(post.status)}>{post.status}</StatusPill>
                {post.featured ? (
                  <span className="text-[10px] font-semibold uppercase text-primary">Featured</span>
                ) : null}
              </div>
              <Link
                href={editPostPath(post.id)}
                className="mt-3 font-display text-lg font-semibold leading-snug hover:text-primary"
              >
                {post.title}
              </Link>
              {post.slug ? (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">/{post.slug}</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {post.categoryName || 'Uncategorized'}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatAdminDate(post.publishedAt)}
                {post.readingTime ? ` · ${post.readingTime} min` : ''}
                {post.viewCount != null ? ` · ${post.viewCount} views` : ''}
              </p>
              <div className="mt-4 border-t border-border/50 pt-4">
                <BlogPostActions post={post} layout="stacked" />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <DataTable
          className={adminDataTableClass}
          columns={tableColumns}
          rows={postRows}
          getRowId={(post) => post.id}
          emptyTitle="No posts match your filters"
          emptyDescription="Adjust the search text or status filters."
        />
      )}
    </AdminDataShell>
  );
}
