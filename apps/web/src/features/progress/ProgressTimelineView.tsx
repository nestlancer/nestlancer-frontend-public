'use client';

import { useMemo } from 'react';
import { groupByDay } from '@nestlancer/utils';
import { cn } from '@nestlancer/ui';

import { ProgressAttachmentLinks } from '@/features/progress/ProgressAttachmentLinks';
import type { TimelineEventRow } from '@/lib/client-api-view';

export type ProgressTimelineFilter = 'all' | 'updates' | 'milestones' | 'deliverables';

const FILTER_LABELS: Record<ProgressTimelineFilter, string> = {
  all: 'All',
  updates: 'Updates',
  milestones: 'Milestones',
  deliverables: 'Deliverables',
};

function matchesFilter(event: TimelineEventRow, filter: ProgressTimelineFilter): boolean {
  if (filter === 'all' || event.type === 'projectCreated') return true;
  const entryType = (event.entryType ?? event.type ?? '').toUpperCase();
  if (filter === 'updates') {
    return entryType === 'UPDATE' || entryType === 'STATUS_CHANGE' || entryType === 'INTERNAL_NOTE';
  }
  if (filter === 'milestones') {
    return entryType.includes('MILESTONE');
  }
  if (filter === 'deliverables') {
    return entryType.includes('DELIVERABLE');
  }
  return true;
}

export function ProgressTimelineView({
  events,
  filter = 'all',
  showFilters = false,
  onFilterChange,
  compact = false,
  className,
}: {
  events: TimelineEventRow[];
  filter?: ProgressTimelineFilter;
  showFilters?: boolean;
  onFilterChange?: (filter: ProgressTimelineFilter) => void;
  compact?: boolean;
  className?: string;
}) {
  const filtered = useMemo(
    () => events.filter((ev) => matchesFilter(ev, filter)),
    [events, filter]
  );

  const grouped = useMemo(
    () =>
      groupByDay(
        filtered.map((ev) => ({
          ...ev,
          timestamp: ev.timestamp ?? ev.when,
        }))
      ),
    [filtered]
  );

  const displayEvents = compact ? filtered.slice(0, 3) : filtered;
  const displayGrouped = compact
    ? groupByDay(
        displayEvents.map((ev) => ({
          ...ev,
          timestamp: ev.timestamp ?? ev.when,
        }))
      )
    : grouped;

  if (filtered.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        No progress entries match this filter yet.
      </p>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {showFilters && onFilterChange ? (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FILTER_LABELS) as ProgressTimelineFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-theme',
                filter === key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
              onClick={() => onFilterChange(key)}
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>
      ) : null}

      {displayGrouped.map((group) => (
        <section key={group.dayKey}>
          {!compact ? (
            <h3 className="mb-3 text-sm font-semibold text-foreground">{group.dayLabel}</h3>
          ) : null}
          <ol className="relative border-l border-border pl-6">
            {group.items.map((ev) => (
              <li key={ev.id} className="relative mb-6 last:mb-0">
                <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border border-primary bg-background ring-2 ring-primary/30" />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{ev.title}</p>
                  {ev.entryTypeLabel ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
                      {ev.entryTypeLabel}
                    </span>
                  ) : null}
                </div>
                {ev.milestoneName ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Milestone: {ev.milestoneName}
                  </p>
                ) : null}
                {ev.description &&
                ev.description.trim() &&
                ev.description.trim() !== (ev.title ?? '').trim() ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {ev.description}
                  </p>
                ) : null}
                {ev.attachmentIds && ev.attachmentIds.length > 0 ? (
                  <ProgressAttachmentLinks className="mt-2" attachmentIds={ev.attachmentIds} />
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">{ev.when}</p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
