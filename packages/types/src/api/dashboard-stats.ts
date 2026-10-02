/** `GET /projects/stats` (client) */
export interface UserProjectStats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
}

/** `GET /payments/stats` */
export interface UserPaymentStats {
  totalSpent: number;
  pending: number;
  inDispute: number;
  totalPayments: number;
}

/** `GET /requests/stats` */
export interface UserRequestStats {
  total: number;
  /** Non-terminal requests still in the client pipeline. */
  open?: number;
  byStatus: Record<string, number>;
  averageResponseTime: string | null;
  pendingQuotes: number;
  conversionRate: number;
}

/** `GET /messages/conversations/unread-count` */
export interface UnreadMessageCount {
  totalUnread: number;
}
