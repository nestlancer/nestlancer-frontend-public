'use client';

import { Search } from '@nestlancer/ui/icons';
import type { ReactNode } from 'react';

import { Input, cn } from '@nestlancer/ui';

import { webFilterBarClass, webSelectClass } from '@/lib/tailadmin-classes';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'underReview', label: 'Under review' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'changesRequested', label: 'Changes requested' },
  { value: 'convertedToProject', label: 'Converted to project' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function WorkFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  showStatusFilter = true,
  actions,
  className,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  showStatusFilter?: boolean;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(webFilterBarClass, className)}>
      {showStatusFilter ? (
        <select
          id="work-hub-status"
          name="status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className={webSelectClass}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : null}
      <div className="relative min-w-[200px] flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id="work-hub-search"
          name="q"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search work items…"
          className="h-10 pl-9"
          aria-label="Search work items"
        />
      </div>
      {actions ? <div className="ml-auto flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
