'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { formatIsoDate } from '@nestlancer/utils';
import { Button } from '@nestlancer/ui';

import { adminKeys } from '@/lib/admin-query-keys';
import { apiServices } from '@/lib/axios';

type HistoryEntry = {
  at?: string;
  createdAt?: string;
  type?: string;
  action?: string;
  status?: string;
  note?: string;
  actorId?: string;
  [key: string]: unknown;
};

const QUOTE_EVENT_LABELS: Record<string, string> = {
  QUOTE_CREATED: 'Created',
  QUOTE_SENT: 'Sent',
  QUOTE_ACCEPTED: 'Accepted',
  QUOTE_DECLINED: 'Declined',
  QUOTE_CHANGES_REQUESTED: 'Changes requested',
  QUOTE_REVISION_CREATED: 'Revision created',
  QUOTE_REVISION_REQUESTED: 'Revision requested',
  QUOTE_VIEWED: 'Viewed',
  QUOTE_EXPIRED: 'Expired',
};

function humanizeQuoteEvent(entry: HistoryEntry): string {
  const labeled = String(entry.label ?? entry.event ?? '').trim();
  if (labeled && labeled.toLowerCase() !== 'event') return labeled;
  const raw = String(entry.type ?? entry.action ?? entry.status ?? entry.note ?? '').trim();
  if (!raw) return 'Event';
  const key = raw.toUpperCase().replace(/\s+/g, '_');
  if (QUOTE_EVENT_LABELS[key]) return QUOTE_EVENT_LABELS[key];
  if (QUOTE_EVENT_LABELS[raw]) return QUOTE_EVENT_LABELS[raw];
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function collapseDuplicateHistory(items: HistoryEntry[]): HistoryEntry[] {
  const seenTerminal = new Set<string>();
  const seenBurst = new Set<string>();
  return items.filter((entry) => {
    const type = String(entry.type ?? entry.action ?? entry.status ?? '').toUpperCase();
    if (type === 'QUOTE_ACCEPTED' || type === 'QUOTE_DECLINED') {
      if (seenTerminal.has(type)) return false;
      seenTerminal.add(type);
      return true;
    }
    const when = String(entry.at ?? entry.createdAt ?? '');
    const key = `${type}:${when.slice(0, 19)}`;
    if (seenBurst.has(key)) return false;
    seenBurst.add(key);
    return true;
  });
}

function pickHistory(raw: unknown): HistoryEntry[] {
  if (!raw || typeof raw !== 'object') return [];
  const rec = raw as Record<string, unknown>;
  const nested =
    rec.data && typeof rec.data === 'object' && !Array.isArray(rec.data)
      ? (rec.data as Record<string, unknown>)
      : null;
  const list = Array.isArray(rec.history)
    ? rec.history
    : Array.isArray(rec.statusHistory)
      ? rec.statusHistory
      : Array.isArray(nested?.history)
        ? nested.history
        : Array.isArray(nested?.statusHistory)
          ? nested.statusHistory
          : Array.isArray(rec.data)
            ? rec.data
            : Array.isArray(raw)
              ? raw
              : [];
  return collapseDuplicateHistory(list as HistoryEntry[]);
}

export function QuoteHistoryPanel({ quoteId }: { quoteId: string }) {
  const [open, setOpen] = useState(true);
  const historyQ = useQuery({
    queryKey: [...adminKeys.quote(quoteId), 'history'],
    queryFn: () => apiServices.admin.getAdminQuoteHistory(quoteId),
  });

  const items = pickHistory(historyQ.data);

  return (
    <section className="ge-card rounded-lg border border-border/70 bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Quote history</h3>
          <p className="text-xs text-muted-foreground">Status changes and revision trail</p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide' : 'Show'}
        </Button>
      </div>

      {open ? (
        <div className="p-5">
          {historyQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading history…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history entries yet.</p>
          ) : (
            <ol className="space-y-3">
              {items.map((entry, idx) => {
                const when = String(entry.at ?? entry.createdAt ?? '');
                const label = humanizeQuoteEvent(entry);
                return (
                  <li
                    key={`${when}-${idx}`}
                    className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-foreground">{label}</p>
                    {when ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatIsoDate(when, 'PPp')}
                      </p>
                    ) : null}
                    {entry.note && entry.note !== label ? (
                      <p className="mt-1 text-xs text-muted-foreground">{String(entry.note)}</p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      ) : null}
    </section>
  );
}
