'use client';

import { useMemo, useState } from 'react';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';
import { Button, ErrorState, SkeletonTable } from '@nestlancer/ui';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { adminCardClass } from '@/components/admin/AdminPageChrome';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRows, rowId, rowTitle } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

type AdminRow = Record<string, unknown>;

function slugLabel(row: AdminRow): string {
  return typeof row.slug === 'string' ? row.slug : '';
}

function TaxonomyList({ rows, empty }: { rows: AdminRow[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y divide-border/70">
      {rows.map((row, index) => (
        <li
          key={rowId(row) || String(index)}
          className="flex items-center justify-between gap-3 py-2.5"
        >
          <span className="font-medium text-foreground">{rowTitle(row)}</span>
          {slugLabel(row) ? (
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {slugLabel(row)}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function BlogTaxonomyPanel() {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [fromTagId, setFromTagId] = useState('');
  const [toTagId, setToTagId] = useState('');
  const [revisionPostId, setRevisionPostId] = useState('');

  const authors = useQuery({
    queryKey: adminKeys.blogAuthors(),
    queryFn: () => apiServices.admin.listBlogAuthors(),
  });
  const categories = useQuery({
    queryKey: adminKeys.blogCategories(),
    queryFn: () => apiServices.admin.listBlogCategories(),
  });
  const tags = useQuery({
    queryKey: adminKeys.blogTags(),
    queryFn: () => apiServices.admin.listBlogTags(),
  });
  const posts = useQuery({
    queryKey: [...adminKeys.posts(), 'taxonomy-picker'],
    queryFn: () => apiServices.admin.listAdminBlogPosts({ limit: 100 }),
  });
  const revisions = useQuery({
    queryKey: [...adminKeys.root, 'post-revisions', revisionPostId],
    queryFn: () => apiServices.admin.getPostRevisions(revisionPostId),
    enabled: Boolean(revisionPostId),
  });

  const authorRows = useMemo(() => pickAdminRows(authors.data), [authors.data]);
  const categoryRows = useMemo(() => pickAdminRows(categories.data), [categories.data]);
  const tagRows = useMemo(() => pickAdminRows(tags.data), [tags.data]);
  const postRows = useMemo(() => pickAdminRows(posts.data), [posts.data]);
  const revisionRows = useMemo(() => pickAdminRows(revisions.data), [revisions.data]);

  const createCategory = useMutation({
    mutationFn: () => apiServices.admin.createBlogCategory({ name: newCategory.trim() }),
    onSuccess: () => {
      toast.success('Category created.');
      setNewCategory('');
      void qc.invalidateQueries({ queryKey: adminKeys.blogCategories() });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not create category')),
  });
  const createTag = useMutation({
    mutationFn: () => apiServices.admin.createBlogTag({ name: newTag.trim() }),
    onSuccess: () => {
      toast.success('Tag created.');
      setNewTag('');
      void qc.invalidateQueries({ queryKey: adminKeys.blogTags() });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not create tag')),
  });
  const mergeTags = useMutation({
    mutationFn: () => apiServices.admin.mergeTags({ fromTagId, toTagId }),
    onSuccess: () => {
      toast.success('Tags merged.');
      setFromTagId('');
      setToTagId('');
      void qc.invalidateQueries({ queryKey: adminKeys.blogTags() });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not merge tags')),
  });
  const restoreRevision = useMutation({
    mutationFn: (revisionId: string) =>
      apiServices.admin.restorePostRevision(revisionPostId, revisionId),
    onSuccess: () => {
      toast.success('Revision restored.');
      void revisions.refetch();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not restore revision')),
  });

  const loadError = authors.error || categories.error || tags.error || posts.error;
  if (loadError) {
    return (
      <ErrorState
        message={getApiErrorMessage(loadError, 'Could not load blog taxonomy')}
        onRetry={() => {
          void authors.refetch();
          void categories.refetch();
          void tags.refetch();
          void posts.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Taxonomy & governance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage discoverability, consolidate duplicate tags, and recover post revisions.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className={adminCardClass}>
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Categories</h3>
            <p className="text-sm text-muted-foreground">{categoryRows.length} publishing groups</p>
          </div>
          <div className="mb-3 flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="New category"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
            />
            <Button
              size="sm"
              disabled={!newCategory.trim() || createCategory.isPending}
              onClick={() => createCategory.mutate()}
            >
              Add
            </Button>
          </div>
          {categories.isLoading ? (
            <SkeletonTable rows={4} cols={2} />
          ) : (
            <TaxonomyList rows={categoryRows} empty="No categories yet." />
          )}
        </section>

        <section className={adminCardClass}>
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Tags</h3>
            <p className="text-sm text-muted-foreground">{tagRows.length} discovery labels</p>
          </div>
          <div className="mb-3 flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="New tag"
              value={newTag}
              onChange={(event) => setNewTag(event.target.value)}
            />
            <Button
              size="sm"
              disabled={!newTag.trim() || createTag.isPending}
              onClick={() => createTag.mutate()}
            >
              Add
            </Button>
          </div>
          {tags.isLoading ? (
            <SkeletonTable rows={4} cols={2} />
          ) : (
            <TaxonomyList rows={tagRows} empty="No tags yet." />
          )}
        </section>

        <section className={adminCardClass}>
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Authors</h3>
            <p className="text-sm text-muted-foreground">{authorRows.length} publishing accounts</p>
          </div>
          {authors.isLoading ? (
            <SkeletonTable rows={4} cols={2} />
          ) : (
            <TaxonomyList rows={authorRows} empty="No authors returned." />
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={adminCardClass}>
          <h3 className="font-semibold text-foreground">Merge duplicate tags</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Move every linked post from the source tag into the destination tag.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Source tag</span>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={fromTagId}
                onChange={(event) => setFromTagId(event.target.value)}
              >
                <option value="">Select source</option>
                {tagRows.map((row) => (
                  <option key={rowId(row)} value={rowId(row)}>
                    {rowTitle(row)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Destination tag</span>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={toTagId}
                onChange={(event) => setToTagId(event.target.value)}
              >
                <option value="">Select destination</option>
                {tagRows
                  .filter((row) => rowId(row) !== fromTagId)
                  .map((row) => (
                    <option key={rowId(row)} value={rowId(row)}>
                      {rowTitle(row)}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <Button
            className="mt-4"
            disabled={!fromTagId || !toTagId || fromTagId === toTagId || mergeTags.isPending}
            onClick={async () => {
              const result = await confirm({
                title: 'Merge tags',
                description:
                  'This updates every post using the source tag and removes the duplicate.',
                confirmLabel: 'Merge tags',
              });
              if (result.confirmed) mergeTags.mutate();
            }}
          >
            Merge tags
          </Button>
        </section>

        <section className={adminCardClass}>
          <h3 className="font-semibold text-foreground">Revision recovery</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a post to inspect saved versions. Restoring replaces its current content.
          </p>
          <select
            className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={revisionPostId}
            onChange={(event) => setRevisionPostId(event.target.value)}
          >
            <option value="">Select a post</option>
            {postRows.map((row) => (
              <option key={rowId(row)} value={rowId(row)}>
                {rowTitle(row)}
              </option>
            ))}
          </select>
          {revisions.isLoading ? <SkeletonTable rows={3} cols={2} /> : null}
          {revisionPostId && !revisions.isLoading && revisionRows.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No saved revisions for this post.</p>
          ) : null}
          {revisionRows.length ? (
            <ul className="mt-4 divide-y divide-border/70">
              {revisionRows.map((row, index) => {
                const revisionId = rowId(row) || `revision-${index}`;
                return (
                  <li key={revisionId} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{rowTitle(row)}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.createdAt
                          ? new Date(String(row.createdAt)).toLocaleString()
                          : 'Saved revision'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={restoreRevision.isPending}
                      onClick={async () => {
                        const result = await confirm({
                          title: 'Restore this revision?',
                          description:
                            'The current post content will be replaced by this saved version.',
                          confirmLabel: 'Restore',
                        });
                        if (result.confirmed) restoreRevision.mutate(revisionId);
                      }}
                    >
                      Restore
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      </div>
    </div>
  );
}
