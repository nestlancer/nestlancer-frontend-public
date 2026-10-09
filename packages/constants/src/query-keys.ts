export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: (filters?: Record<string, unknown>) => ['projects', 'list', filters] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
    stats: ['projects', 'stats'] as const,
    timeline: (id: string) => ['projects', 'timeline', id] as const,
    milestones: (id: string) => ['projects', 'milestones', id] as const,
    progress: (id: string) => ['projects', 'progress', id] as const,
    messages: (id: string) => ['projects', 'messages', id] as const,
  },
  requests: {
    all: ['requests'] as const,
    list: () => ['requests', 'list'] as const,
    detail: (id: string) => ['requests', 'detail', id] as const,
    stats: ['requests', 'stats'] as const,
    quotes: (id: string) => ['requests', 'quotes', id] as const,
    attachments: (id: string) => ['requests', 'attachments', id] as const,
  },
  messages: {
    conversations: ['messages', 'conversations'] as const,
    thread: (projectId: string) => ['messages', 'thread', projectId] as const,
    chatThread: (threadId: string) => ['messages', 'chat-thread', threadId] as const,
    chatThreadDetail: (threadId: string) => ['messages', 'chat-thread-detail', threadId] as const,
    chatThreadMembers: (threadId: string) => ['messages', 'chat-thread-members', threadId] as const,
    unread: ['messages', 'unread'] as const,
  },
  notifications: {
    list: (params?: Record<string, unknown>) => ['notifications', 'list', params] as const,
    history: (params?: Record<string, unknown>) => ['notifications', 'history', params] as const,
    unread: ['notifications', 'unread'] as const,
    preferences: ['notifications', 'preferences'] as const,
  },
  payments: {
    list: (params?: Record<string, unknown>) => ['payments', 'list', params] as const,
    detail: (id: string) => ['payments', 'detail', id] as const,
    stats: ['payments', 'stats'] as const,
    methods: ['payments', 'methods'] as const,
    documentVersions: (id: string) => ['payments', 'documentVersions', id] as const,
  },
  quotes: {
    all: ['quotes'] as const,
    list: () => ['quotes', 'list'] as const,
    detail: (id: string) => ['quotes', 'detail', id] as const,
    stats: ['quotes', 'stats'] as const,
    documentVersions: (id: string) => ['quotes', 'documentVersions', id] as const,
  },
  invoices: {
    list: (params?: Record<string, unknown>) => ['invoices', 'list', params] as const,
    detail: (id: string) => ['invoices', 'detail', id] as const,
  },
  documents: {
    /**
     * `tokenKey` must be a non-secret fingerprint (e.g. FNV hash), never the raw HMAC `t`.
     * Pass the raw token only to the queryFn.
     */
    verify: (documentNumber: string, tokenKey = '') =>
      ['documents', 'verify', documentNumber, tokenKey] as const,
  },
  users: {
    profile: ['users', 'profile'] as const,
    preferences: ['users', 'preferences'] as const,
    sessions: ['users', 'sessions'] as const,
    twoFactorStatus: ['users', '2fa', 'status'] as const,
    activity: (page?: number) => ['users', 'activity', page] as const,
  },
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
    activity: ['dashboard', 'activity'] as const,
    notificationsPreview: ['dashboard', 'notificationsPreview'] as const,
  },
  blog: {
    list: (params?: Record<string, unknown>) => ['blog', 'list', params] as const,
    post: (slug: string) => ['blog', 'post', slug] as const,
    related: (slug: string) => ['blog', 'related', slug] as const,
    categories: ['blog', 'categories'] as const,
  },
  portfolio: {
    list: (params?: Record<string, unknown>) => ['portfolio', 'list', params] as const,
    detail: (id: string) => ['portfolio', 'detail', id] as const,
    featured: ['portfolio', 'featured'] as const,
  },
  progress: {
    project: (projectId: string) => ['progress', 'project', projectId] as const,
    status: (projectId: string) => ['progress', 'status', projectId] as const,
  },
} as const;
