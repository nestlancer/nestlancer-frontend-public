'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { Button } from '@nestlancer/ui';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { adminKeys } from '@/lib/admin-query-keys';
import { apiServices } from '@/lib/axios';

import type { BlogPostRow } from './blog-admin-helpers';
import { editPostPath, publicPostUrl } from './blog-admin-helpers';

type ActionKind = 'publish' | 'unpublish' | 'feature' | 'unfeature' | 'archive' | 'delete';

type Props = {
  post: BlogPostRow;
  layout?: 'inline' | 'stacked';
};

export function BlogPostActions({ post, layout = 'inline' }: Props) {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const [pending, setPending] = useState<ActionKind | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: adminKeys.posts() });
  };

  const run = async (kind: ActionKind, fn: () => Promise<unknown>, success: string) => {
    setPending(kind);
    try {
      await fn();
      toast.success(success);
      invalidate();
    } catch (e) {
      toast.error(getApiErrorMessage(e, `Could not complete action on “${post.title}”`));
    } finally {
      setPending(null);
    }
  };

  const isBusy = (kind: ActionKind) => pending === kind;
  const wrapClass =
    layout === 'stacked' ? 'flex flex-col gap-1' : 'flex flex-wrap justify-end gap-1';

  const canPublish = post.status === 'DRAFT' || post.status === 'SCHEDULED';
  const canUnpublish = post.status === 'PUBLISHED';
  const canArchive = post.status !== 'ARCHIVED';
  const canPreview = post.status === 'PUBLISHED' && post.slug.length > 0;

  return (
    <div className={wrapClass}>
      <Button variant="outline" size="sm" className="rounded-lg" asChild>
        <Link href={editPostPath(post.id)}>Edit</Link>
      </Button>

      {canPreview ? (
        <Button variant="outline" size="sm" className="rounded-lg" asChild>
          <a href={publicPostUrl(post.slug)} target="_blank" rel="noopener noreferrer">
            View live
          </a>
        </Button>
      ) : null}

      {canPublish ? (
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={isBusy('publish')}
          onClick={() =>
            void run(
              'publish',
              () => apiServices.admin.publishBlogPost(post.id),
              `“${post.title}” is now published.`
            )
          }
        >
          {isBusy('publish') ? 'Publishing…' : 'Publish'}
        </Button>
      ) : null}

      {canUnpublish ? (
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={isBusy('unpublish')}
          onClick={() =>
            void run(
              'unpublish',
              () => apiServices.admin.unpublishBlogPost(post.id),
              `“${post.title}” moved back to draft.`
            )
          }
        >
          {isBusy('unpublish') ? 'Unpublishing…' : 'Unpublish'}
        </Button>
      ) : null}

      {post.featured ? (
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={isBusy('unfeature')}
          onClick={() =>
            void run(
              'unfeature',
              () => apiServices.admin.unfeatureBlogPost(post.id),
              `“${post.title}” removed from featured.`
            )
          }
        >
          {isBusy('unfeature') ? 'Updating…' : 'Unfeature'}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={isBusy('feature')}
          onClick={() =>
            void run(
              'feature',
              () => apiServices.admin.featureBlogPost(post.id),
              `“${post.title}” is now featured on the blog.`
            )
          }
        >
          {isBusy('feature') ? 'Featuring…' : 'Feature'}
        </Button>
      )}

      {canArchive ? (
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={isBusy('archive')}
          onClick={async () => {
            const { confirmed } = await confirm({
              title: 'Archive post',
              description: `Archive “${post.title}”? It will be hidden from the public blog but remain in the archive filter.`,
              confirmLabel: 'Archive',
            });
            if (!confirmed) return;
            void run(
              'archive',
              () => apiServices.admin.archivePost(post.id),
              `“${post.title}” archived.`
            );
          }}
        >
          {isBusy('archive') ? 'Archiving…' : 'Archive'}
        </Button>
      ) : null}

      <Button
        variant="destructive"
        size="sm"
        className="rounded-lg"
        disabled={isBusy('delete')}
        onClick={async () => {
          const { confirmed } = await confirm({
            title: 'Delete post',
            description: `Remove “${post.title}” from the content list? This soft-deletes the post (it will no longer appear here).`,
            destructive: true,
            confirmLabel: 'Delete',
          });
          if (!confirmed) return;
          void run(
            'delete',
            () => apiServices.admin.deleteAdminBlogPost(post.id),
            `“${post.title}” removed from the blog.`
          );
        }}
      >
        {isBusy('delete') ? 'Removing…' : 'Delete'}
      </Button>
    </div>
  );
}
