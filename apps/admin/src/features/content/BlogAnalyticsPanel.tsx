'use client';

import { useMemo, useState } from 'react';

import { getApiErrorMessage, peelSuccessEnvelope } from '@nestlancer/api-client';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn, ErrorState, SkeletonTable } from '@nestlancer/ui';

import { StatusPill } from '@/components/admin/AdminDataViews';
import {
  AdminDataShell,
  AdminFilterBar,
  AdminMetricStrip,
  adminDataTableClass,
} from '@/components/admin/AdminPageChrome';
import { adminKeys } from '@/lib/admin-query-keys';
import { apiServices } from '@/lib/axios';

import { editPostPath, publicPostUrl } from './blog-admin-helpers';

type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';
type TopPost = {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  likeCount: number;
  publishedAt?: string;
};

function analyticsRecord(payload: unknown): Record<string, unknown> {
  const value = peelSuccessEnvelope(payload);
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function formatDate(value?: string): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

export function BlogAnalyticsPanel() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const analytics = useQuery({
    queryKey: [...adminKeys.postAnalytics(), period],
    queryFn: () => apiServices.admin.getBlogPostsAnalytics({ period }),
  });

  const record = analyticsRecord(analytics.data);
  const topPosts = useMemo(
    () =>
      (Array.isArray(record.topPosts) ? record.topPosts : [])
        .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object'))
        .map(
          (row): TopPost => ({
            id: String(row.id ?? ''),
            title: String(row.title ?? 'Untitled post'),
            slug: String(row.slug ?? ''),
            viewCount: Number(row.viewCount ?? 0),
            likeCount: Number(row.likeCount ?? 0),
            publishedAt: typeof row.publishedAt === 'string' ? row.publishedAt : undefined,
          })
        ),
    [record.topPosts]
  );

  const columns = useMemo<DataTableColumn<TopPost>[]>(
    () => [
      {
        id: 'post',
        header: 'Top content',
        cell: (post) => (
          <div>
            <a
              className="font-medium hover:text-primary hover:underline"
              href={editPostPath(post.id)}
            >
              {post.title}
            </a>
            {post.slug ? (
              <a
                className="mt-0.5 block text-xs text-muted-foreground hover:text-primary"
                href={publicPostUrl(post.slug)}
                target="_blank"
                rel="noopener noreferrer"
              >
                /{post.slug} ↗
              </a>
            ) : null}
          </div>
        ),
      },
      {
        id: 'views',
        header: 'Views',
        cell: (post) => <span className="font-medium tabular-nums">{post.viewCount}</span>,
      },
      {
        id: 'likes',
        header: 'Likes',
        cell: (post) => <span className="tabular-nums">{post.likeCount}</span>,
      },
      {
        id: 'published',
        header: 'Published',
        cell: (post) => (
          <span className="text-muted-foreground">{formatDate(post.publishedAt)}</span>
        ),
      },
      {
        id: 'state',
        header: 'State',
        cell: () => <StatusPill tone="good">Published</StatusPill>,
      },
    ],
    []
  );

  if (analytics.isLoading) return <SkeletonTable rows={5} cols={4} />;
  if (analytics.error) {
    return (
      <ErrorState
        message={getApiErrorMessage(analytics.error, 'Could not load blog analytics')}
        onRetry={() => void analytics.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Content performance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Engagement for posts published during the selected period.
          </p>
        </div>
        <AdminFilterBar
          filters={[
            {
              id: 'period',
              label: 'Period',
              value: period,
              options: [
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' },
                { value: 'all', label: 'All time' },
              ],
              onChange: (value) => setPeriod(value as AnalyticsPeriod),
            },
          ]}
        />
      </div>

      <AdminMetricStrip
        max={3}
        items={[
          { label: 'Total views', value: String(Number(record.totalViews ?? 0)) },
          { label: 'Total likes', value: String(Number(record.totalLikes ?? 0)) },
          {
            label: 'Top-performing posts',
            value: String(topPosts.length),
            hint: `Period: ${period}`,
          },
        ]}
      />

      <AdminDataShell>
        <DataTable
          className={adminDataTableClass}
          columns={columns}
          rows={topPosts}
          getRowId={(post) => post.id}
          emptyTitle="No performance data in this period"
          emptyDescription="Views and likes appear here after readers engage with published posts."
        />
      </AdminDataShell>
    </div>
  );
}
