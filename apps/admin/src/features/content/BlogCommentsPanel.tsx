'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';
import { Button, DataTable, type DataTableColumn, ErrorState, SkeletonTable } from '@nestlancer/ui';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { StatusPill } from '@/components/admin/AdminDataViews';
import {
  AdminDataShell,
  AdminFilterBar,
  AdminTablePagination,
  adminDataTableClass,
} from '@/components/admin/AdminPageChrome';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminPagination, pickAdminRows, rowId } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

import { commentPostLink, editPostPath, publicPostUrl, statusTone } from './blog-admin-helpers';

export type CommentQueue = 'comments' | 'pending' | 'reported';
type CommentRow = Record<string, unknown>;
const PAGE_SIZE = 20;

const QUEUE_COPY: Record<CommentQueue, { title: string; description: string; empty: string }> = {
  comments: {
    title: 'All comments',
    description: 'Review reader discussion across every published post.',
    empty: 'Reader comments will appear here after they are submitted.',
  },
  pending: {
    title: 'Pending review',
    description: 'Approve legitimate contributions before they appear publicly.',
    empty: 'The moderation queue is clear.',
  },
  reported: {
    title: 'Reported comments',
    description: 'Investigate comments flagged by readers and take action.',
    empty: 'No comments are currently reported.',
  },
};

function authorLabel(row: CommentRow): string {
  const author =
    row.author && typeof row.author === 'object' ? (row.author as Record<string, unknown>) : null;
  if (!author) return 'Unknown reader';
  const name = [author.firstName, author.lastName].filter(Boolean).join(' ').trim();
  return name || String(author.email ?? 'Unknown reader');
}

function formatDate(value: unknown): string {
  if (typeof value !== 'string') return '—';
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function BlogCommentsPanel({ queue }: { queue: CommentQueue }) {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const deferredSearch = useDeferredValue(search.trim());
  const copy = QUEUE_COPY[queue];

  useEffect(() => {
    setPage(1);
    setSearch('');
    setStatus('all');
  }, [queue]);

  const comments = useQuery({
    queryKey: [...adminKeys.comments(), queue, page, deferredSearch, status],
    queryFn: () => {
      const params = { page, limit: PAGE_SIZE };
      if (queue === 'pending') return apiServices.admin.listPendingBlogComments(params);
      if (queue === 'reported') return apiServices.admin.getReportedComments(params);
      return apiServices.admin.listAdminBlogComments({
        ...params,
        search: deferredSearch || undefined,
        status: status === 'all' ? undefined : status,
      });
    },
  });

  const invalidateQueues = () => {
    void qc.invalidateQueries({ queryKey: adminKeys.comments() });
    void qc.invalidateQueries({ queryKey: adminKeys.pendingComments() });
    void qc.invalidateQueries({ queryKey: adminKeys.reportedComments() });
  };

  const approve = useMutation({
    mutationFn: (id: string) => apiServices.admin.approveBlogComment(id),
    onSuccess: () => {
      toast.success('Comment approved.');
      invalidateQueues();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not approve comment')),
  });
  const reject = useMutation({
    mutationFn: (id: string) => apiServices.admin.rejectComment(id),
    onSuccess: () => {
      toast.success('Comment rejected.');
      invalidateQueues();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not reject comment')),
  });
  const spam = useMutation({
    mutationFn: (id: string) => apiServices.admin.markCommentSpam(id),
    onSuccess: () => {
      toast.success('Comment marked as spam.');
      invalidateQueues();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not mark comment as spam')),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiServices.admin.deleteBlogComment(id),
    onSuccess: () => {
      toast.success('Comment deleted.');
      invalidateQueues();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not delete comment')),
  });

  const rows = useMemo(() => pickAdminRows(comments.data), [comments.data]);
  const pagination = pickAdminPagination(comments.data);
  const busy = approve.isPending || reject.isPending || spam.isPending || remove.isPending;

  const columns = useMemo<DataTableColumn<CommentRow>[]>(
    () => [
      {
        id: 'comment',
        header: 'Comment',
        cell: (row) => (
          <div className="max-w-lg">
            <p className="line-clamp-2 text-sm">{String(row.content ?? row.body ?? '—')}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {authorLabel(row)} · {formatDate(row.createdAt)}
            </p>
          </div>
        ),
      },
      {
        id: 'post',
        header: 'Post',
        cell: (row) => {
          const post = commentPostLink(row);
          return post.postId ? (
            <div className="max-w-xs">
              <Link className="font-medium hover:text-primary" href={editPostPath(post.postId)}>
                {post.postTitle}
              </Link>
              {post.postSlug ? (
                <a
                  className="mt-0.5 block text-xs text-muted-foreground hover:text-primary"
                  href={publicPostUrl(post.postSlug)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View post ↗
                </a>
              ) : null}
            </div>
          ) : (
            '—'
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => {
          const value = String(row.status ?? 'PENDING').toUpperCase();
          return <StatusPill tone={statusTone(value)}>{value}</StatusPill>;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        className: 'text-right',
        cell: (row) => {
          const id = rowId(row);
          const rowStatus = String(row.status ?? '').toUpperCase();
          if (!id) return null;
          return (
            <div className="flex flex-wrap justify-end gap-1">
              {rowStatus !== 'APPROVED' ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => approve.mutate(id)}
                >
                  Approve
                </Button>
              ) : null}
              {rowStatus !== 'REJECTED' ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => reject.mutate(id)}
                >
                  Reject
                </Button>
              ) : null}
              {rowStatus !== 'SPAM' ? (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => spam.mutate(id)}>
                  Spam
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={async () => {
                  const result = await confirm({
                    title: 'Delete comment',
                    description: 'This permanently removes the comment and its replies.',
                    confirmLabel: 'Delete',
                    destructive: true,
                  });
                  if (result.confirmed) remove.mutate(id);
                }}
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [approve, reject, spam, remove, busy, confirm]
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{copy.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
      </div>
      <AdminDataShell
        filter={
          queue === 'comments' ? (
            <AdminFilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search comment, post, or reader…"
              filters={[
                {
                  id: 'status',
                  label: 'Status',
                  value: status,
                  options: [
                    { value: 'all', label: 'All statuses' },
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'APPROVED', label: 'Approved' },
                    { value: 'REJECTED', label: 'Rejected' },
                    { value: 'SPAM', label: 'Spam' },
                  ],
                  onChange: setStatus,
                },
              ]}
            />
          ) : undefined
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
        {comments.isLoading ? <SkeletonTable rows={6} cols={4} /> : null}
        {comments.error ? (
          <ErrorState
            message={getApiErrorMessage(
              comments.error,
              `Could not load ${copy.title.toLowerCase()}`
            )}
            onRetry={() => void comments.refetch()}
          />
        ) : null}
        {!comments.isLoading && !comments.error ? (
          <DataTable
            className={adminDataTableClass}
            columns={columns}
            rows={rows}
            getRowId={(row) => rowId(row)}
            emptyTitle={
              queue === 'pending' ? 'Moderation queue clear' : `No ${copy.title.toLowerCase()}`
            }
            emptyDescription={copy.empty}
          />
        ) : null}
      </AdminDataShell>
    </div>
  );
}
