'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Bell,
  CreditCard,
  FolderKanban,
  MessageSquare,
  Receipt,
  Send,
  Sparkles,
} from '@nestlancer/ui/icons';

import { getApiErrorMessage, normalizeNotificationItem } from '@nestlancer/api-client';
import { useAuth } from '@nestlancer/auth';
import { queryKeys, routes } from '@nestlancer/constants';
import type { Conversation, Payment, ProjectSummary, Quote } from '@nestlancer/types';
import { Button, ErrorState, Skeleton, cn } from '@nestlancer/ui';
import { formatMoneyFromPaise } from '@nestlancer/utils';

import { DashboardLivePanel, type DashboardLiveRow } from '@/components/web/DashboardLivePanel';
import { DashboardMetricCard } from '@/components/web/DashboardMetricCard';
import { DashboardWorkspaceChart } from '@/components/web/DashboardWorkspaceChart';
import { WebPanel } from '@/components/web/WebPanel';
import {
  conversationHref,
  conversationPreview,
  conversationTitle,
} from '@/features/messaging/conversation-utils';
import { canClientAcceptQuote, formatWorkStatusLabel } from '@/features/work/status-utils';
import { apiServices } from '@/lib/axios';
import { webPrimaryButtonClass } from '@/lib/tailadmin-classes';
import {
  activityLogToRows,
  mergeActivity,
  notificationsToActivity,
  type DashboardActivityItem,
} from '@/lib/user-dashboard-view-model';

/** Dashboard live widgets: avoid 5×30s fan-out hammering slow APIs (NL-PERF-DASH-001). */
const LIVE_STALE_MS = 120_000;
const LIVE_REFETCH_MS = 180_000;

function openRequestCount(
  byStatus: Record<string, number> | undefined,
  total: number,
  openFromApi?: number
): number {
  if (typeof openFromApi === 'number' && Number.isFinite(openFromApi)) {
    return Math.max(0, openFromApi);
  }
  if (!byStatus) return Math.max(0, total);
  const draft = byStatus.draft ?? byStatus.DRAFT ?? 0;
  const converted = byStatus.convertedToProject ?? byStatus.CONVERTED_TO_PROJECT ?? 0;
  const rejected = byStatus.rejected ?? byStatus.REJECTED ?? 0;
  const cancelled = byStatus.cancelled ?? byStatus.CANCELLED ?? 0;
  const expired = byStatus.expiredQuote ?? byStatus.EXPIRED_QUOTE ?? 0;
  return Math.max(0, total - draft - converted - rejected - cancelled - expired);
}

function relTime(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return `${days}d`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function quoteAmount(q: Quote): number {
  return typeof q.totalAmount === 'number' ? q.totalAmount : q.amount;
}

function quoteTitle(q: Quote): string {
  return (q.requestTitle || q.title || 'Quote').trim();
}

function isActiveProject(status: string): boolean {
  const s = status.toLowerCase().replace(/[\s_-]/g, '');
  return !['completed', 'cancelled', 'canceled', 'closed', 'archived'].includes(s);
}

function messagePreview(c: Conversation): string {
  return conversationPreview(c);
}

export function DashboardOverview() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const nameFromUser = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  const nameFallback = user?.email?.split('@')[0]?.trim() || null;
  const name = nameFromUser || nameFallback;
  const greetingReady = Boolean(name) && !authLoading;

  const summaryQ = useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: () => apiServices.users.getDashboardSummary(),
    enabled: isAuthenticated,
    staleTime: LIVE_STALE_MS,
    refetchInterval: LIVE_REFETCH_MS,
  });

  const pendingPaymentsQ = useQuery({
    queryKey: [...queryKeys.payments.list({ status: 'pending' }), 'dashboard-live'],
    // NL-PAY-006: fetch enough due rows so Pay-now is not truncated below the KPI total.
    queryFn: () => apiServices.payments.list({ status: 'PENDING', limit: 20 }),
    // Stagger after summary so first paint does not compete with the BFF's 8 upstreams.
    enabled: isAuthenticated && summaryQ.isSuccess,
    staleTime: LIVE_STALE_MS,
    refetchInterval: LIVE_REFETCH_MS,
  });

  const quotesQ = useQuery({
    queryKey: [...queryKeys.quotes.list(), 'dashboard-live'],
    queryFn: () => apiServices.quotes.list({ page: 1, limit: 8 }),
    enabled: isAuthenticated && summaryQ.isSuccess,
    staleTime: LIVE_STALE_MS,
    refetchInterval: LIVE_REFETCH_MS,
  });

  const projectsQ = useQuery({
    queryKey: [...queryKeys.projects.list({ scope: 'dashboard-live' })],
    queryFn: () => apiServices.projects.list(),
    enabled: isAuthenticated && summaryQ.isSuccess,
    staleTime: LIVE_STALE_MS,
    refetchInterval: LIVE_REFETCH_MS,
  });

  const conversationsQ = useQuery({
    // Same key as the header preview and chat dock. The server already
    // defaults this call to active threads, so a second filtered request
    // repeated that read on every dashboard load.
    queryKey: queryKeys.messages.conversations,
    queryFn: () => apiServices.messaging.conversations(),
    enabled: isAuthenticated,
    staleTime: 15_000,
  });

  useEffect(() => {
    const d = summaryQ.data;
    if (!d) return;
    if (d.projects) qc.setQueryData(queryKeys.projects.stats, d.projects);
    if (d.requests) qc.setQueryData(queryKeys.requests.stats, d.requests);
    // Do not overwrite live unread-count caches. Summary refreshes on the live interval and
    // was pinning badges after mark-read (NL-MSG-003). The dashboard card reads
    // summaryData.notificationsUnread directly; the bell uses its own query.
    if (d.payments) qc.setQueryData(queryKeys.payments.stats, d.payments);
    if (d.quotes) qc.setQueryData(queryKeys.quotes.stats, d.quotes);
  }, [summaryQ.data, qc]);

  const { isPending: summaryPending, isError: summaryError, data: summaryData } = summaryQ;
  const projects = summaryData?.projects;
  const requests = summaryData?.requests;
  const payments = summaryData?.payments;
  const messages = summaryData?.messages;
  const notifications = summaryData?.notifications;
  const activity = summaryData?.activity;
  const notificationsUnread = summaryData?.notificationsUnread?.unread ?? 0;

  const notificationItems = useMemo(
    () => (notifications?.items ?? []).map((item) => normalizeNotificationItem(item)),
    [notifications?.items]
  );

  const activityRows: DashboardActivityItem[] = useMemo(() => {
    const fromN = notificationItems.length ? notificationsToActivity(notificationItems) : [];
    const fromA = activity ? activityLogToRows(activity) : [];
    return mergeActivity(fromN, fromA, 5);
  }, [notificationItems, activity]);

  const firstPendingPaymentId = pendingPaymentsQ.data?.items?.[0]?.id;

  const primaryAlert = useMemo(() => {
    if (requests && requests.pendingQuotes > 0) {
      return {
        title: 'Quote ready for you',
        description: `${requests.pendingQuotes} quote${requests.pendingQuotes === 1 ? '' : 's'} awaiting review`,
        href: routes.quotes,
        label: 'Review quotes',
      };
    }
    if (payments && payments.pending > 0) {
      return {
        title: 'Payment pending',
        description: `${formatMoneyFromPaise(payments.pending, 'INR', 'en-IN')} still open`,
        href: firstPendingPaymentId ? routes.payment(firstPendingPaymentId) : routes.payments,
        label: firstPendingPaymentId ? 'Complete checkout' : 'View billing',
      };
    }
    return null;
  }, [requests, payments, firstPendingPaymentId]);

  const fmt = (n: number) => n.toLocaleString();
  const openReq =
    requests != null
      ? openRequestCount(requests.byStatus, requests.total ?? 0, requests.open)
      : null;

  const moneyHero = summaryError
    ? '—'
    : summaryPending
      ? '…'
      : formatMoneyFromPaise(payments?.totalSpent ?? 0, 'INR', 'en-IN');

  const activityFault = summaryQ.isError
    ? getApiErrorMessage(summaryQ.error, 'Dashboard data unavailable')
    : null;

  const quoteRows: DashboardLiveRow[] = useMemo(() => {
    const items = (quotesQ.data?.items ?? []).filter((q) => canClientAcceptQuote(q.status));
    return items.slice(0, 3).map((q) => ({
      id: q.id,
      title: quoteTitle(q),
      detail: `${formatMoneyFromPaise(quoteAmount(q), q.currency || 'INR', 'en-IN')} · ${formatWorkStatusLabel(String(q.status))}`,
      meta: relTime(q.createdAt),
      href: routes.quote(q.id),
      tone: 'amber' as const,
    }));
  }, [quotesQ.data?.items]);

  const paymentRows: DashboardLiveRow[] = useMemo(() => {
    const projectTitleById = new Map(
      (projectsQ.data ?? []).map((p: ProjectSummary) => [
        p.id,
        (p.title || 'Untitled project').trim(),
      ])
    );
    return (pendingPaymentsQ.data?.items ?? []).slice(0, 6).map((p: Payment) => {
      const fromEmbed =
        (p.project && typeof p.project === 'object'
          ? String(p.project.title ?? p.project.name ?? '').trim()
          : '') || '';
      const fromList = p.projectId ? projectTitleById.get(p.projectId) : undefined;
      const milestoneName =
        p.milestone && typeof p.milestone === 'object' ? String(p.milestone.name ?? '').trim() : '';
      const projectLabel = fromEmbed || fromList || 'Open invoice';
      return {
        id: p.id,
        title: formatMoneyFromPaise(p.amount, p.currency || 'INR', 'en-IN'),
        detail: milestoneName ? `${projectLabel} · ${milestoneName}` : projectLabel,
        meta: relTime(p.createdAt),
        href: routes.payment(p.id),
        tone: 'amber' as const,
      };
    });
  }, [pendingPaymentsQ.data?.items, projectsQ.data]);

  const projectRows: DashboardLiveRow[] = useMemo(() => {
    const items = (projectsQ.data ?? []).filter((p: ProjectSummary) => isActiveProject(p.status));
    return items.slice(0, 3).map((p) => ({
      id: p.id,
      title: p.title || 'Untitled project',
      detail: formatWorkStatusLabel(p.status),
      meta: relTime(p.createdAt),
      href: routes.project(p.id),
      tone: 'emerald' as const,
    }));
  }, [projectsQ.data]);

  const inboxRows: DashboardLiveRow[] = useMemo(() => {
    return (conversationsQ.data?.items ?? []).slice(0, 3).map((c: Conversation) => ({
      id: c.id,
      title: conversationTitle(c),
      detail: messagePreview(c),
      meta: relTime(c.lastMessageAt || c.latestMessage?.createdAt),
      href: conversationHref(c),
    }));
  }, [conversationsQ.data?.items]);

  const livePending =
    quotesQ.isPending ||
    pendingPaymentsQ.isPending ||
    projectsQ.isPending ||
    conversationsQ.isPending;

  return (
    <div className="space-y-4">
      {/* Compact hero */}
      <section
        className={cn(
          'relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm',
          'dark:border-gray-800 dark:bg-white/[0.03] dark:shadow-none',
          'animate-fade-in-up motion-reduce:animate-none'
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(20,184,166,0.14),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(14,165,233,0.07),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(45,212,191,0.16),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.07),transparent_50%)]"
          aria-hidden
        />
        <div className="relative grid gap-4 p-4 md:grid-cols-[1.35fr_1fr] md:p-5">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ta-brand-600 dark:text-ta-brand-400">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Client portal
              <span className="ml-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-700 dark:text-emerald-300">
                Live
              </span>
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {greetingReady ? (
                <>Welcome back, {name}</>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Welcome back
                  <Skeleton className="h-7 w-36 rounded-md" aria-hidden />
                  <span className="sr-only">Loading your name</span>
                </span>
              )}
            </h1>
            <p className="mt-1 max-w-lg text-sm text-gray-600 dark:text-gray-400">
              {primaryAlert
                ? 'One action will unblock your workspace.'
                : 'Your projects, quotes, and billing stay in sync.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {primaryAlert ? (
                <Button asChild size="sm" className={webPrimaryButtonClass}>
                  <Link href={primaryAlert.href}>
                    {primaryAlert.label}
                    <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm" className={webPrimaryButtonClass}>
                  <Link href={routes.requestNew}>
                    Start a request
                    <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" variant="outline">
                <Link href={routes.projects}>View projects</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-black/20">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
              Total invoiced
            </p>
            <p
              className={cn(
                'mt-1 font-display text-2xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-white sm:text-3xl',
                moneyHero === '…' && 'animate-pulse'
              )}
            >
              {moneyHero}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {summaryPending
                ? 'Loading billing…'
                : `${formatMoneyFromPaise(payments?.pending ?? 0, 'INR', 'en-IN')} pending`}
            </p>
            <div className="mt-3">
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href={routes.payments}>View billing history</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Compact single-row vitals */}
      <section aria-labelledby="dashboard-kpis">
        <div className="mb-2 flex items-end justify-between gap-3">
          <h2
            id="dashboard-kpis"
            className="text-sm font-semibold text-gray-800 dark:text-white/90"
          >
            Workspace vitals
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Refreshes every 30s</p>
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <DashboardMetricCard
            compact
            label="Open requests"
            value={summaryError ? '—' : summaryPending ? '…' : fmt(openReq ?? 0)}
            hint="In your pipeline"
            icon={<Send className="h-4 w-4" aria-hidden />}
            href={routes.requests}
          />
          <DashboardMetricCard
            compact
            label="Active projects"
            value={summaryError ? '—' : summaryPending ? '…' : fmt(projects?.active ?? 0)}
            hint={`${fmt(projects?.completed ?? 0)} completed`}
            icon={<FolderKanban className="h-4 w-4" aria-hidden />}
            href={routes.projects}
          />
          <DashboardMetricCard
            compact
            label="Pending quotes"
            value={summaryError ? '—' : summaryPending ? '…' : fmt(requests?.pendingQuotes ?? 0)}
            hint="Awaiting your decision"
            icon={<Receipt className="h-4 w-4" aria-hidden />}
            href={routes.quotes}
          />
          <DashboardMetricCard
            compact
            label="Unread messages"
            value={summaryError ? '—' : summaryPending ? '…' : fmt(messages?.totalUnread ?? 0)}
            hint="Messages waiting for you"
            icon={<MessageSquare className="h-4 w-4" aria-hidden />}
            href={routes.messages}
          />
          <DashboardMetricCard
            compact
            className="col-span-2 md:col-span-1"
            label="Notifications"
            value={summaryError ? '—' : summaryPending ? '…' : fmt(notificationsUnread)}
            hint="Latest updates"
            icon={<Bell className="h-4 w-4" aria-hidden />}
            href={routes.notifications}
          />
        </div>
      </section>

      {/* Pipeline + actions */}
      <div className="grid gap-4 xl:grid-cols-12 xl:items-start">
        <div className="xl:col-span-8">
          {summaryError ? (
            <ErrorState
              title="Dashboard chart unavailable"
              message={activityFault ?? 'Dashboard data unavailable'}
            />
          ) : (
            <DashboardWorkspaceChart
              compact
              loading={summaryPending}
              projectsActive={projects?.active ?? 0}
              projectsCompleted={projects?.completed ?? 0}
              openRequests={openReq ?? 0}
              pendingQuotes={requests?.pendingQuotes ?? 0}
              totalSpent={payments?.totalSpent ?? 0}
              pendingPayments={payments?.pending ?? 0}
              payHref={
                firstPendingPaymentId ? routes.payment(firstPendingPaymentId) : routes.payments
              }
            />
          )}
        </div>
        <div className="xl:col-span-4">
          <WebPanel padding="sm">
            <h2 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
              Awaiting you
            </h2>
            <ul className="space-y-1.5">
              {[
                {
                  show: (payments?.pending ?? 0) > 0,
                  label: 'Pending payment',
                  detail: formatMoneyFromPaise(payments?.pending ?? 0, 'INR', 'en-IN'),
                  href: firstPendingPaymentId
                    ? routes.payment(firstPendingPaymentId)
                    : routes.payments,
                  icon: CreditCard,
                },
                {
                  show: (requests?.pendingQuotes ?? 0) > 0,
                  label: 'Quotes to review',
                  detail: `${requests?.pendingQuotes ?? 0} awaiting decision`,
                  href: routes.quotes,
                  icon: Receipt,
                },
                {
                  show: (messages?.totalUnread ?? 0) > 0,
                  label: 'Unread messages',
                  detail: `${messages?.totalUnread ?? 0} message${
                    (messages?.totalUnread ?? 0) === 1 ? '' : 's'
                  }`,
                  href: routes.messages,
                  icon: MessageSquare,
                },
                {
                  show: notificationsUnread > 0,
                  label: 'Notifications',
                  detail: `${notificationsUnread} new`,
                  href: routes.notifications,
                  icon: Bell,
                },
              ]
                .filter((item) => item.show)
                .slice(0, 3)
                .map(({ label, detail, href, icon: Icon }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="flex items-center gap-2 rounded-lg border border-amber-200/70 bg-amber-50/50 px-2.5 py-2 transition-colors hover:border-ta-brand-500/30 hover:bg-ta-brand-50/50 dark:border-amber-500/20 dark:bg-amber-500/10 dark:hover:bg-ta-brand-500/10"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-amber-700 shadow-sm dark:bg-black/20 dark:text-amber-200">
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                          {label}
                        </span>
                        <span className="block truncate text-[11px] text-gray-500 dark:text-gray-400">
                          {detail}
                        </span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                    </Link>
                  </li>
                ))}
              {!summaryPending &&
              (payments?.pending ?? 0) <= 0 &&
              (requests?.pendingQuotes ?? 0) <= 0 &&
              (messages?.totalUnread ?? 0) <= 0 &&
              notificationsUnread <= 0 ? (
                <li className="rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3 py-2.5 text-xs text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100">
                  You’re all caught up.
                </li>
              ) : null}
              {summaryPending
                ? Array.from({ length: 2 }).map((_, i) => (
                    <li key={`await-skel-${i}`}>
                      <Skeleton className="h-11 w-full rounded-lg" />
                    </li>
                  ))
                : null}
            </ul>
          </WebPanel>
        </div>
      </div>

      {/* Live workbench — real list data */}
      <section aria-labelledby="dashboard-live" className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <h2
            id="dashboard-live"
            className="text-sm font-semibold text-gray-800 dark:text-white/90"
          >
            Live workbench
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Quotes · payments · projects · inbox
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardLivePanel
            title="Quotes to review"
            href={routes.quotes}
            icon={<Receipt className="h-3.5 w-3.5" aria-hidden />}
            rows={quoteRows}
            loading={livePending && !quotesQ.data}
            emptyTitle="No quotes waiting"
            emptyDescription="New quotes appear here when sent."
            maxRows={3}
          />
          <DashboardLivePanel
            title="Pay now"
            href={routes.payments}
            icon={<CreditCard className="h-3.5 w-3.5" aria-hidden />}
            rows={paymentRows}
            loading={livePending && !pendingPaymentsQ.data}
            emptyTitle="Nothing due"
            emptyDescription="Pending invoices show up here."
            maxRows={6}
          />
          <DashboardLivePanel
            title="Active projects"
            href={routes.projects}
            icon={<FolderKanban className="h-3.5 w-3.5" aria-hidden />}
            rows={projectRows}
            loading={livePending && !projectsQ.data}
            emptyTitle="No active projects"
            emptyDescription="Accepted work lands here."
            maxRows={3}
          />
          <DashboardLivePanel
            title="Inbox"
            href={routes.messages}
            icon={<MessageSquare className="h-3.5 w-3.5" aria-hidden />}
            rows={inboxRows}
            loading={livePending && !conversationsQ.data}
            emptyTitle="Inbox clear"
            emptyDescription="Latest conversations appear here."
            maxRows={3}
          />
        </div>
      </section>

      {/* Slim activity strip */}
      <WebPanel padding="sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Recent activity
          </h2>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-7 px-2 text-xs text-ta-brand-500 hover:text-ta-brand-600"
          >
            <Link href={routes.notifications}>View all</Link>
          </Button>
        </div>
        {activityFault ? <p className="mb-2 text-xs text-destructive">{activityFault}</p> : null}
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {summaryPending
            ? Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={`activity-skeleton-${i}`}
                  className="flex items-center gap-3 py-2"
                  aria-hidden
                >
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-3.5 flex-1 rounded-md" />
                  <Skeleton className="h-3 w-8 rounded-md" />
                </li>
              ))
            : null}
          {!summaryPending &&
            activityRows.map((row) => (
              <li key={row.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ta-brand-500" aria-hidden />
                {row.href ? (
                  <Link
                    href={row.href}
                    className="min-w-0 flex-1 truncate font-medium text-gray-800 hover:text-ta-brand-500 dark:text-white/90 dark:hover:text-ta-brand-400"
                  >
                    {row.title}
                    {row.detail ? (
                      <span className="font-normal text-gray-500"> — {row.detail}</span>
                    ) : null}
                  </Link>
                ) : (
                  <span className="min-w-0 flex-1 truncate font-medium text-gray-800 dark:text-white/90">
                    {row.title}
                    {row.detail ? (
                      <span className="font-normal text-gray-500"> — {row.detail}</span>
                    ) : null}
                  </span>
                )}
                <span className="shrink-0 font-mono text-[10px] text-gray-500">{row.time}</span>
              </li>
            ))}
          {!summaryPending && !summaryError && activityRows.length === 0 ? (
            <li className="py-2 text-sm text-gray-500">No recent activity.</li>
          ) : null}
        </ul>
      </WebPanel>
    </div>
  );
}
