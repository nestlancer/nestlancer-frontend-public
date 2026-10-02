import { fromPaise } from '@nestlancer/utils';

export type QuoteLineItem = { description: string; quantity: number; unitPrice: number };

export function defaultLineItem(): QuoteLineItem {
  return { description: '', quantity: 1, unitPrice: 0 };
}

export function lineTotal(item: QuoteLineItem): number {
  return Math.max(0, item.quantity) * Math.max(0, item.unitPrice);
}

export function calculateQuoteTotals(items: QuoteLineItem[], taxPercentage: number) {
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const taxAmount = (subtotal * Math.max(0, taxPercentage)) / 100;
  const grandTotal = subtotal + taxAmount;
  return { subtotal, taxAmount, grandTotal };
}

export function normalizeQuoteStatus(status: string | undefined): string {
  return String(status ?? '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase()
    .replace(/-/g, '_');
}

/** Client asked for modifications — admin should revise and resend. */
export function isChangesRequestedStatus(status: string | undefined): boolean {
  const s = normalizeQuoteStatus(status);
  return s === 'CHANGES_REQUESTED' || s === 'CHANGESREQUESTED';
}

/**
 * Quotes the admin can edit in the console (draft, pending, or client-requested revision).
 */
export function isQuoteEditable(status: string | undefined): boolean {
  const s = normalizeQuoteStatus(status);
  return (
    s === 'DRAFT' ||
    s === 'PENDING' ||
    s === 'CHANGES_REQUESTED' ||
    s === 'CHANGESREQUESTED' ||
    s === 'REVISED'
  );
}

/** After editing, admin can send or resend to the client. */
export function canAdminSendQuote(status: string | undefined): boolean {
  const s = normalizeQuoteStatus(status);
  return (
    s === 'DRAFT' ||
    s === 'PENDING' ||
    s === 'CHANGES_REQUESTED' ||
    s === 'CHANGESREQUESTED' ||
    s === 'REVISED'
  );
}

export type ClientChangeRequest = {
  changes: { area: string; request: string }[];
  additionalNotes?: string;
};

/** Parse feedback stored when the client calls POST /quotes/:id/request-changes. */
export function parseClientChangeNotes(raw: unknown): ClientChangeRequest | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.changes)) {
      return {
        changes: o.changes
          .filter((c) => c && typeof c === 'object')
          .map((c) => {
            const item = c as Record<string, unknown>;
            return {
              area: String(item.area ?? 'other'),
              request: String(item.request ?? ''),
            };
          })
          .filter((c) => c.request.trim()),
        additionalNotes: typeof o.additionalNotes === 'string' ? o.additionalNotes : undefined,
      };
    }
  }
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parseClientChangeNotes(parsed);
  } catch {
    return { changes: [], additionalNotes: raw.trim() };
  }
}

/** API stores unit prices in paise; forms edit in major units (rupees). */
export function parsePaymentBreakdown(raw: unknown): QuoteLineItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return [defaultLineItem()];
  return raw.map((row) => {
    const r = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
    const description = String(r.description ?? r.title ?? r.name ?? '').trim();
    if ('unitPrice' in r || 'quantity' in r) {
      const unitPricePaise = Math.max(0, Number(r.unitPrice) || 0);
      return {
        description,
        quantity: Math.max(1, Number(r.quantity) || 1),
        unitPrice: fromPaise(unitPricePaise),
      };
    }
    const amountPaise = Number(r.amount ?? r.totalPrice ?? 0);
    return {
      description,
      quantity: 1,
      unitPrice: Math.max(0, fromPaise(amountPaise)),
    };
  });
}

export function quoteRecordFromPayload(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const o = payload as Record<string, unknown>;
    if (o.data && typeof o.data === 'object' && !Array.isArray(o.data)) {
      return o.data as Record<string, unknown>;
    }
    return o;
  }
  return {};
}

export function defaultValidUntilDate(days = 14): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
