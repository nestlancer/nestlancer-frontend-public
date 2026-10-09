'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { Button, Input, PortfolioTimeline } from '@nestlancer/ui';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { PageHeader, StatusPill } from '@/components/admin/AdminDataViews';
import { AdminDataShell, AdminMetricStrip } from '@/components/admin/AdminPageChrome';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminPagination, pickAdminRows } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

import { formatPortfolioProjectDate } from '@nestlancer/utils';

import { adminRowsToTimelineEntries } from './admin-portfolio-timeline';

const PUBLIC_PORTFOLIO_URL =
  process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
  (process.env.NODE_ENV === 'production' ? 'https://app.nestlancer.com' : 'http://localhost:9000');

function asAnalyticsRecord(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  const root = data as Record<string, unknown>;
  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
    return root.data as Record<string, unknown>;
  }
  return root;
}

function PortfolioAnalyticsCards({ data, compact }: { data: unknown; compact?: boolean }) {
  const analytics = asAnalyticsRecord(data);
  const totalViews = Number(analytics.totalViews ?? analytics.views ?? 0);
  const totalLikes = Number(analytics.totalLikes ?? analytics.likes ?? 0);
  const topItems = Array.isArray(analytics.topItems) ? analytics.topItems : [];

  return (
    <div className="space-y-3">
      <div
        className={`grid overflow-hidden divide-x divide-border/50 border-b border-border/40 ${
          compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
        }`}
      >
        <div className="px-3 py-2">
          <p className="text-[11px] font-medium text-muted-foreground">Total views</p>
          <p className="mt-0.5 text-base font-semibold tabular-nums">
            {totalViews.toLocaleString()}
          </p>
        </div>
        <div className="px-3 py-2">
          <p className="text-[11px] font-medium text-muted-foreground">Total likes</p>
          <p className="mt-0.5 text-base font-semibold tabular-nums">
            {totalLikes.toLocaleString()}
          </p>
        </div>
        {!compact ? (
          <div className="px-3 py-2">
            <p className="text-[11px] font-medium text-muted-foreground">Top items</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums">{topItems.length}</p>
          </div>
        ) : null}
      </div>
      {topItems.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/20 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-1.5">Item</th>
                <th className="px-3 py-1.5">Views</th>
                <th className="px-3 py-1.5">Likes</th>
              </tr>
            </thead>
            <tbody>
              {topItems.slice(0, 8).map((row, i) => {
                const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
                const title = String(item.title ?? item.name ?? item.id ?? `Item ${i + 1}`);
                const views = Number(item.views ?? item.viewCount ?? 0);
                const likes = Number(item.likes ?? item.likeCount ?? 0);
                return (
                  <tr
                    key={String(item.id ?? title)}
                    className="border-b border-border/40 hover:bg-muted/30"
                  >
                    <td className="px-3 py-1.5 font-medium">{title}</td>
                    <td className="px-3 py-1.5 tabular-nums">{views.toLocaleString()}</td>
                    <td className="px-3 py-1.5 tabular-nums">{likes.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-3 text-sm text-muted-foreground">No engagement data yet.</p>
      )}
    </div>
  );
}

export function AdminPortfolioClient() {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [analyticsItemId, setAnalyticsItemId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const listQ = useQuery({
    queryKey: [...adminKeys.portfolio(), page, search],
    queryFn: () =>
      apiServices.admin.listAdminPortfolio({
        page,
        limit: 50,
        search: search || undefined,
      }),
  });

  const publishM = useMutation({
    mutationFn: (id: string) => apiServices.admin.publishAdminPortfolio(id),
    onSuccess: () => {
      toast.success('Portfolio item published');
      void qc.invalidateQueries({ queryKey: adminKeys.portfolio() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Publish failed')),
  });

  const unpublishM = useMutation({
    mutationFn: (id: string) => apiServices.admin.unpublishAdminPortfolio(id),
    onSuccess: () => {
      toast.success('Portfolio item unpublished');
      void qc.invalidateQueries({ queryKey: adminKeys.portfolio() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Unpublish failed')),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => apiServices.admin.deleteAdminPortfolio(id),
    onSuccess: () => {
      toast.success('Portfolio item deleted');
      void qc.invalidateQueries({ queryKey: adminKeys.portfolio() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Delete failed')),
  });

  const reorderM = useMutation({
    mutationFn: (items: { id: string; order: number }[]) =>
      apiServices.admin.reorderAdminPortfolio({ items }),
    onSuccess: () => {
      toast.success('Order updated');
      void qc.invalidateQueries({ queryKey: adminKeys.portfolio() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Reorder failed')),
  });

  const categoriesQ = useQuery({
    queryKey: [...adminKeys.portfolio(), 'categories'],
    queryFn: () => apiServices.admin.listPortfolioCategories(),
  });

  const globalAnalyticsQ = useQuery({
    queryKey: [...adminKeys.portfolio(), 'analytics'],
    queryFn: () => apiServices.admin.getPortfolioAnalytics(),
  });

  const itemAnalyticsQ = useQuery({
    queryKey: [...adminKeys.portfolio(), 'analytics', analyticsItemId],
    queryFn: () => apiServices.admin.getPortfolioAnalytics(analyticsItemId!),
    enabled: Boolean(analyticsItemId),
  });

  const createCategoryM = useMutation({
    mutationFn: () => apiServices.admin.createPortfolioCategory({ name: newCategoryName.trim() }),
    onSuccess: () => {
      toast.success('Category created');
      setNewCategoryName('');
      void qc.invalidateQueries({ queryKey: [...adminKeys.portfolio(), 'categories'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create category')),
  });

  const deleteCategoryM = useMutation({
    mutationFn: (id: string) => apiServices.admin.deletePortfolioCategory(id),
    onSuccess: () => {
      toast.success('Category deleted');
      void qc.invalidateQueries({ queryKey: [...adminKeys.portfolio(), 'categories'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not delete category')),
  });

  const rows = pickAdminRows(listQ.data) as Record<string, unknown>[];
  const categoryRows = pickAdminRows(categoriesQ.data) as Record<string, unknown>[];

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const items = rows.map((row, i) => ({
      id: String(row.id ?? ''),
      order: i === index ? target : i === target ? index : i,
    }));
    reorderM.mutate(items.filter((item) => item.id));
  };
  const pagination = pickAdminPagination(listQ.data);
  const totalPages = pagination?.totalPages ?? 1;

  const stats = useMemo(() => {
    const published = rows.filter((r) =>
      String(r.status ?? r.publishStatus ?? '')
        .toUpperCase()
        .includes('PUBLISH')
    ).length;
    const draft = rows.filter((r) =>
      String(r.status ?? r.publishStatus ?? 'DRAFT')
        .toUpperCase()
        .includes('DRAFT')
    ).length;
    const featured = rows.filter((r) => Boolean(r.featured)).length;
    return { total: rows.length, published, draft, featured };
  }, [rows]);

  const timelineEntries = useMemo(() => adminRowsToTimelineEntries(rows), [rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="Content"
        title="Portfolio"
        description="Manage showcase projects. The live timeline below mirrors what visitors see on the public site."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a
                href={`${PUBLIC_PORTFOLIO_URL}/portfolio`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View public page
              </a>
            </Button>
            <Button asChild>
              <Link href="/portfolio/new">New item</Link>
            </Button>
          </div>
        }
      />

      <AdminMetricStrip
        items={[
          { label: 'On this page', value: String(stats.total) },
          { label: 'Published', value: String(stats.published) },
          { label: 'Draft', value: String(stats.draft) },
          { label: 'Featured', value: String(stats.featured) },
        ]}
        max={4}
      />

      <section className="rounded-lg border border-border/40 bg-muted/10 p-3">
        <div className="mb-2">
          <h3 className="text-xs font-bold text-foreground">Categories</h3>
          <p className="text-[10px] text-muted-foreground">Organize portfolio items by category.</p>
        </div>
        <AdminQueryState isLoading={categoriesQ.isLoading} error={categoriesQ.error}>
          <ul className="flex flex-wrap gap-1.5">
            {categoryRows.map((cat, i) => {
              const id = String(cat.id ?? `cat-${i}`);
              const name = String(cat.name ?? id);
              return (
                <li
                  key={id}
                  className="flex items-center gap-1 rounded border border-border/20 bg-muted/60 px-2 py-0.5 text-xs"
                >
                  <span className="font-medium text-foreground">{name}</span>
                  <button
                    type="button"
                    className="text-[10px] text-destructive hover:underline disabled:opacity-50"
                    disabled={deleteCategoryM.isPending}
                    onClick={async () => {
                      const { confirmed } = await confirm({
                        title: 'Delete category',
                        description: `Delete "${name}"?`,
                        destructive: true,
                      });
                      if (!confirmed) return;
                      deleteCategoryM.mutate(id);
                    }}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 space-y-1">
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                aria-label="New category name"
                className="h-8 max-w-xs rounded-md text-sm"
              />
              <Button
                size="sm"
                disabled={!newCategoryName.trim() || createCategoryM.isPending}
                title={!newCategoryName.trim() ? 'Enter a category name to enable add' : undefined}
                onClick={() => createCategoryM.mutate()}
              >
                Add category
              </Button>
            </div>
            {!newCategoryName.trim() ? (
              <p className="text-[11px] text-muted-foreground">
                Enter a category name to enable Add category.
              </p>
            ) : null}
          </div>
        </AdminQueryState>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Analytics</h2>
          <p className="text-sm text-muted-foreground">Global portfolio engagement metrics.</p>
        </div>
        <AdminDataShell
          filter={
            analyticsItemId ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Item analytics</p>
                <Button size="sm" variant="outline" onClick={() => setAnalyticsItemId(null)}>
                  Close
                </Button>
              </div>
            ) : undefined
          }
        >
          <div className="space-y-3 p-3">
            <AdminQueryState isLoading={globalAnalyticsQ.isLoading} error={globalAnalyticsQ.error}>
              <PortfolioAnalyticsCards data={globalAnalyticsQ.data} />
            </AdminQueryState>
            {analyticsItemId ? (
              <AdminQueryState isLoading={itemAnalyticsQ.isLoading} error={itemAnalyticsQ.error}>
                <PortfolioAnalyticsCards data={itemAnalyticsQ.data} compact />
              </AdminQueryState>
            ) : null}
          </div>
        </AdminDataShell>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Manage items</h2>
          <p className="text-sm text-muted-foreground">
            Create, edit, publish, and remove portfolio entries.
          </p>
        </div>

        <AdminDataShell
          filter={
            <Input
              placeholder="Search portfolio…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              aria-label="Search portfolio"
              className="max-w-sm rounded-lg"
            />
          }
        >
          <AdminQueryState isLoading={listQ.isPending} error={listQ.error}>
            {rows.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No portfolio items found.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/40">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Title</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Project date</th>
                        <th className="px-4 py-3 text-left font-medium">Updated</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((row, i) => {
                        const id = String(row.id ?? `p-${i}`);
                        const title = String(row.title ?? row.name ?? id);
                        const status = String(row.status ?? row.publishStatus ?? 'DRAFT');
                        return (
                          <tr key={id} className="hover:bg-muted/20">
                            <td className="max-w-[240px] truncate px-4 py-3 font-medium">
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  disabled={i === 0 || reorderM.isPending}
                                  onClick={() => moveItem(i, -1)}
                                  aria-label="Move up"
                                >
                                  ↑
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  disabled={i === rows.length - 1 || reorderM.isPending}
                                  onClick={() => moveItem(i, 1)}
                                  aria-label="Move down"
                                >
                                  ↓
                                </Button>
                                <span className="truncate">{title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill
                                tone={status.toLowerCase().includes('publish') ? 'good' : 'neutral'}
                              >
                                {status.replace(/_/g, ' ')}
                              </StatusPill>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground tabular-nums">
                              {formatPortfolioProjectDate(
                                row as Parameters<typeof formatPortfolioProjectDate>[0]
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {row.updatedAt
                                ? new Date(String(row.updatedAt)).toLocaleDateString()
                                : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setAnalyticsItemId(id)}
                                >
                                  Analytics
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/portfolio/${encodeURIComponent(id)}/edit`}>
                                    Edit
                                  </Link>
                                </Button>
                                {status.toUpperCase().includes('PUBLISH') ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={unpublishM.isPending}
                                    onClick={() => unpublishM.mutate(id)}
                                  >
                                    Unpublish
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    disabled={publishM.isPending}
                                    onClick={() => publishM.mutate(id)}
                                  >
                                    Publish
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={deleteM.isPending}
                                  onClick={async () => {
                                    const { confirmed } = await confirm({
                                      title: 'Delete portfolio item',
                                      description: `Delete "${title}"? This cannot be undone.`,
                                      destructive: true,
                                      confirmLabel: 'Delete',
                                    });
                                    if (!confirmed) return;
                                    deleteM.mutate(id);
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </AdminQueryState>
        </AdminDataShell>
      </section>

      <section className="space-y-3 rounded-lg border border-dashed border-border/60 bg-muted/10 p-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Live timeline preview</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Compact date and title preview of the public project timeline.
          </p>
        </div>
        <PortfolioTimeline
          entries={timelineEntries}
          variant="admin"
          emptyMessage="Add a portfolio item to see the timeline preview."
        />
      </section>
    </div>
  );
}
