'use client';

import { useState } from 'react';

import type { Message } from './messaging-types';

import { cn } from '../../utils/cn';
import { formatMessageTime, resolveMessageSenderLabel } from './message-time';

export function ConversationSearchPanel({
  onSearch,
  results,
  isSearching,
  error,
  onSelectResult,
  className,
}: {
  onSearch: (query: string) => void;
  results: Message[];
  isSearching?: boolean;
  error?: string | null;
  onSelectResult?: (message: Message) => void;
  className?: string;
}) {
  const [query, setQuery] = useState('');

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-3 shadow-sm', className)}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Search in conversation
      </p>
      <div className="mt-2 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search messages…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch(query.trim());
          }}
        />
        <button
          type="button"
          className="shrink-0 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
          disabled={isSearching || !query.trim()}
          onClick={() => onSearch(query.trim())}
        >
          Search
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      {isSearching ? (
        <p className="mt-2 text-xs text-muted-foreground">Searching…</p>
      ) : results.length > 0 ? (
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
          {results.map((message) => (
            <li key={message.id}>
              <button
                type="button"
                className="w-full rounded-lg px-2 py-2 text-left hover:bg-muted/60"
                onClick={() => onSelectResult?.(message)}
              >
                <p className="text-[11px] font-semibold text-foreground">
                  {resolveMessageSenderLabel(message, false, 'client')}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {formatMessageTime(message.createdAt)}
                  </span>
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {message.content}
                </p>
              </button>
            </li>
          ))}
        </ul>
      ) : query.trim() && !isSearching && !error ? (
        <p className="mt-2 text-xs text-muted-foreground">No messages found.</p>
      ) : null}
    </div>
  );
}
