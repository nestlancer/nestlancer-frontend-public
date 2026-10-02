export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Quote {
  id: string;
  requestId: string;
  /** Request title from list API (`requestTitle`); used as the card heading. */
  requestTitle?: string;
  /** Optional display title when APIs send `title` instead of `requestTitle`. */
  title?: string;
  createdById?: string;
  amount: number;
  /** List API may return `totalAmount` (paise) instead of `amount`. */
  totalAmount?: number;
  currency: string;
  status: QuoteStatus;
  message?: string;
  createdAt: string;
}
