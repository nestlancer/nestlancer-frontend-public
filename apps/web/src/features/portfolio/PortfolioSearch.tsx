'use client';

import { useState } from 'react';
import Link from 'next/link';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { routes } from '@nestlancer/constants';
import type { PortfolioListResult } from '@nestlancer/types';

import { FieldHelp } from '@nestlancer/field-help';

import { apiServices } from '@/lib/axios';

export function PortfolioSearch({ initialItems }: { initialItems: PortfolioListResult['items'] }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSearch() {
    const term = q.trim();
    if (!term) {
      setItems(initialItems);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiServices.portfolio.search({ q: term, page: 1, limit: 24 });
      const list = data as PortfolioListResult;
      setItems(list.items ?? (Array.isArray(data) ? (data as PortfolioListResult['items']) : []));
    } catch (e) {
      setError(getApiErrorMessage(e, 'Search failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-8 grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-1 text-xs text-muted-foreground sm:col-span-2">
          Search
          <FieldHelp fieldKey="filter.search" label="Search portfolio" />
        </div>
        <input
          className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
          placeholder="Search projects, stacks, and industries…"
          aria-label="Search portfolio"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void runSearch();
          }}
        />
        <button
          className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
          type="button"
          disabled={loading}
          onClick={() => void runSearch()}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {items.map((item, index) => {
          const accentClass =
            index % 6 === 0
              ? 'bg-gradient-to-br from-primary/12 via-surface to-surface'
              : index % 4 === 0
                ? 'bg-gradient-to-br from-status-info/10 via-surface to-surface'
                : 'bg-surface';
          const desc =
            item.shortDescription?.trim() ||
            'A portfolio case study covering goals, approach, and measurable outcomes.';
          return (
            <Link
              key={item.id}
              href={routes.portfolioItem(item.slug || item.id)}
              className={`mb-4 block break-inside-avoid rounded-xl border border-border p-4 transition-colors hover:border-primary/40 ${accentClass}`}
            >
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.category?.name ?? 'Project'} · {item.likeCount ?? 0} likes
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              <p className="mt-4 text-xs font-medium text-primary">View case study →</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
