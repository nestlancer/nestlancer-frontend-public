export interface NotificationItem {
  id: string;
  type?: string;
  title: string;
  message: string;
  /** Alias for message — kept for backward compatibility */
  body: string;
  data?: Record<string, unknown> | null;
  actionUrl?: string | null;
  /** In-app route derived from actionUrl (relative path) */
  href?: string;
  readAt?: string | null;
  dismissedAt?: string | null;
  createdAt: string;
  /** True when readAt is set or API `read` flag is true */
  read: boolean;
  priority?: string;
}
