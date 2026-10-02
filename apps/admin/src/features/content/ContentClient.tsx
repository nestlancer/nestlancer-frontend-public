'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@nestlancer/ui';

import { PageHeader } from '@/components/admin/AdminDataViews';
import { AdminMetricStrip, AdminTabBar } from '@/components/admin/AdminPageChrome';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminPagination, pickAdminRows } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

import { BlogAnalyticsPanel } from './BlogAnalyticsPanel';
import { BlogCommentsPanel, type CommentQueue } from './BlogCommentsPanel';
import { BlogTaxonomyPanel } from './BlogTaxonomyPanel';
import { getPublicWebOrigin } from './blog-admin-helpers';
import { ContentPostsPanel } from './ContentPostsPanel';

const TABS = [
  { key: 'posts', label: 'Posts' },
  { key: 'comments', label: 'Comments' },
  { key: 'pending', label: 'Pending' },
  { key: 'reported', label: 'Reported' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'taxonomy', label: 'Taxonomy' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function responseTotal(payload: unknown): number {
  const pagination = pickAdminPagination(payload);
  if (pagination) return pagination.total;
  // Blog admin returns top-level totalItems without full pagination block sometimes.
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const o = payload as Record<string, unknown>;
    if (typeof o.totalItems === 'number') return o.totalItems;
    if (typeof o.total === 'number') return o.total;
  }
  return pickAdminRows(payload).length;
}

export function ContentClient() {
  const [activeIndex, setActiveIndex] = useState(0);
  const tab: TabKey = TABS[activeIndex]?.key ?? 'posts';

  const totalPosts = useQuery({
    queryKey: [...adminKeys.posts(), 'summary', 'all'],
    queryFn: () => apiServices.admin.listAdminBlogPosts({ page: 1, limit: 1 }),
    staleTime: 60_000,
  });
  const publishedPosts = useQuery({
    queryKey: [...adminKeys.posts(), 'summary', 'published'],
    queryFn: () => apiServices.admin.listAdminBlogPosts({ page: 1, limit: 1, status: 'PUBLISHED' }),
    staleTime: 60_000,
  });
  const draftPosts = useQuery({
    queryKey: [...adminKeys.posts(), 'summary', 'draft'],
    queryFn: () => apiServices.admin.listAdminBlogPosts({ page: 1, limit: 1, status: 'DRAFT' }),
    staleTime: 60_000,
  });
  const pendingComments = useQuery({
    queryKey: adminKeys.pendingComments(),
    queryFn: () => apiServices.admin.listPendingBlogComments({ page: 1, limit: 1 }),
    staleTime: 60_000,
  });

  const pendingCount = responseTotal(pendingComments.data);

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="Content operations"
        title="Blog"
        description="Publish stories, moderate reader discussion, and manage content performance and taxonomy."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href={`${getPublicWebOrigin()}/blog`} target="_blank" rel="noopener noreferrer">
                View live blog
              </a>
            </Button>
            <Button asChild>
              <Link href="/content/posts/new">New post</Link>
            </Button>
          </div>
        }
      />

      <AdminMetricStrip
        max={4}
        items={[
          {
            label: 'Total posts',
            value: totalPosts.isLoading
              ? '—'
              : totalPosts.isError
                ? '0'
                : String(responseTotal(totalPosts.data)),
            hint: 'Across all publishing states',
          },
          {
            label: 'Published',
            value: publishedPosts.isLoading
              ? '—'
              : publishedPosts.isError
                ? '0'
                : String(responseTotal(publishedPosts.data)),
            hint: 'Visible on the public blog',
          },
          {
            label: 'Drafts',
            value: draftPosts.isLoading
              ? '—'
              : draftPosts.isError
                ? '0'
                : String(responseTotal(draftPosts.data)),
            hint: 'Still in editorial workflow',
          },
          {
            label: 'Pending comments',
            value: pendingComments.isLoading
              ? '—'
              : pendingComments.isError
                ? '0'
                : String(pendingCount),
            hint: pendingCount ? 'Requires moderation' : 'Queue is clear',
          },
        ]}
      />

      <AdminTabBar
        tabs={TABS.map(({ label, key }) => ({
          label,
          badge: key === 'pending' ? pendingCount : undefined,
        }))}
        activeIndex={activeIndex}
        onChange={setActiveIndex}
      />

      {tab === 'posts' ? <ContentPostsPanel /> : null}
      {(['comments', 'pending', 'reported'] as TabKey[]).includes(tab) ? (
        <BlogCommentsPanel queue={tab as CommentQueue} />
      ) : null}
      {tab === 'analytics' ? <BlogAnalyticsPanel /> : null}
      {tab === 'taxonomy' ? <BlogTaxonomyPanel /> : null}
    </div>
  );
}
