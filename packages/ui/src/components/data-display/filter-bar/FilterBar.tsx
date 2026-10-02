'use client';

import { useId, type ReactNode } from 'react';

import { cn } from '../../../utils/cn';
import { Input } from '../../primitives/input';

export type FilterOption = { value: string; label: string };

export type FilterBarProps = {
  search?: string;
  onSearchChange?: (value: string) => void;
  /** Called when the user presses Enter in the search field. */
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  filters?: {
    id: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  actions?: ReactNode;
  className?: string;
};

export function FilterBar({
  search,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = 'Search by name, email…',
  filters,
  actions,
  className,
}: FilterBarProps) {
  // Unique per instance so multiple FilterBars on one page (e.g. audit) do not
  // collide on id="filter-bar-action" / id="filter-bar-search" (NL-BUG-A11Y-001).
  const instanceId = useId().replace(/:/g, '');
  const searchId = `filter-bar-${instanceId}-search`;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-border/60 bg-muted/20 p-3',
        className
      )}
      role="search"
    >
      {onSearchChange != null ? (
        <Input
          id={searchId}
          name={searchId}
          type="search"
          placeholder={searchPlaceholder}
          value={search ?? ''}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSearchSubmit?.();
            }
          }}
          className="max-w-xs flex-1 min-w-[12rem]"
          aria-label="Search"
        />
      ) : null}
      {filters?.map((f) => {
        const controlId = `filter-bar-${instanceId}-${f.id}`;
        return (
          <label key={f.id} htmlFor={controlId} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{f.label}</span>
            <select
              id={controlId}
              name={controlId}
              className="nl-select-filter h-9 rounded-md border border-input bg-background text-sm"
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        );
      })}
      {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
