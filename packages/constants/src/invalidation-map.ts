import { queryKeys } from './query-keys';

/** TanStack Query invalidation targets per mutation action */
export const invalidationMap = {
  'auth.login': [queryKeys.auth.session, queryKeys.users.profile] as const,
  'auth.logout': [queryKeys.auth.session] as const,
  'requests.create': [queryKeys.requests.all] as const,
  'requests.submit': [queryKeys.requests.all, queryKeys.requests.stats] as const,
  'requests.update': (id: string) =>
    [queryKeys.requests.detail(id), queryKeys.requests.list()] as const,
  'quotes.accept': [queryKeys.quotes.all, queryKeys.projects.all] as const,
  'quotes.decline': [queryKeys.quotes.all] as const,
  'projects.update': (id: string) =>
    [queryKeys.projects.detail(id), queryKeys.projects.list({})] as const,
  'projects.approve': (id: string) =>
    [
      queryKeys.projects.detail(id),
      queryKeys.projects.progress(id),
      queryKeys.projects.timeline(id),
    ] as const,
  'progress.milestone': (projectId: string) =>
    [
      queryKeys.projects.milestones(projectId),
      queryKeys.projects.progress(projectId),
      queryKeys.projects.detail(projectId),
      queryKeys.progress.status(projectId),
      [...queryKeys.projects.milestones(projectId), 'payment-milestones'],
      [...queryKeys.projects.detail(projectId), 'deliverables'],
      queryKeys.dashboard.summary,
    ] as const,
  'payments.confirm': (paymentId?: string, projectId?: string) =>
    [
      queryKeys.payments.list({}),
      queryKeys.payments.stats,
      queryKeys.dashboard.summary,
      queryKeys.invoices.list({}),
      queryKeys.projects.stats,
      ...(paymentId ? [queryKeys.payments.detail(paymentId)] : []),
      ...(projectId
        ? [
            queryKeys.projects.detail(projectId),
            queryKeys.projects.milestones(projectId),
            queryKeys.projects.progress(projectId),
            [...queryKeys.projects.milestones(projectId), 'payment-milestones'],
          ]
        : []),
    ] as const,
  'payments.cancel': (id: string) =>
    [queryKeys.payments.detail(id), queryKeys.payments.list({}), queryKeys.payments.stats] as const,
  'payments.dispute': (id: string) => [queryKeys.payments.detail(id)] as const,
  'messages.send': (projectId: string) =>
    [
      queryKeys.messages.thread(projectId),
      queryKeys.messages.conversations,
      queryKeys.messages.unread,
    ] as const,
  'messages.sendChat': (threadId: string) =>
    [
      queryKeys.messages.chatThread(threadId),
      queryKeys.messages.conversations,
      queryKeys.messages.unread,
    ] as const,
  'notifications.read': [queryKeys.notifications.list({}), queryKeys.notifications.unread] as const,
  'notifications.readAll': [
    queryKeys.notifications.list({}),
    queryKeys.notifications.unread,
  ] as const,
  'users.updateProfile': [queryKeys.users.profile] as const,
  'realtime.requestsQuotes': [
    queryKeys.requests.all,
    queryKeys.quotes.all,
    queryKeys.notifications.unread,
    queryKeys.notifications.list({}),
  ] as const,
} as const;
