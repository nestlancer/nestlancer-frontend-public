'use client';

import { type ReactNode, useCallback } from 'react';

import { cn } from '../../../utils/cn';
import { EmptyState } from '../../dashboard/EmptyState';
import { ErrorState } from '../../feedback/error-state/ErrorState';
import { SkeletonTable } from '../../feedback/skeleton/Skeleton';
import { Pagination, type PaginationProps } from '../pagination/Pagination';

export type SortDirection = 'asc' | 'desc' | null;

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  toolbar?: ReactNode;
  pagination?: Omit<PaginationProps, 'className'>;
  sort?: { columnId: string; direction: SortDirection };
  onSortChange?: (columnId: string, direction: SortDirection) => void;
  /** Optional row activation (e.g. navigate to detail). Checkbox cells should stopPropagation. */
  onRowClick?: (row: T) => void;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading,
  error,
  onRetry,
  emptyTitle = 'No data',
  emptyDescription,
  emptyAction,
  toolbar,
  pagination,
  sort,
  onSortChange,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const handleSort = useCallback(
    (columnId: string) => {
      if (!onSortChange) return;
      const current = sort?.columnId === columnId ? sort.direction : null;
      const next: SortDirection = current === null ? 'asc' : current === 'asc' ? 'desc' : null;
      onSortChange(columnId, next);
    },
    [onSortChange, sort]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {toolbar ? <div className="flex flex-wrap items-center gap-3">{toolbar}</div> : null}

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border/80 bg-card">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={5} cols={columns.length} />
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error.message} onRetry={onRetry} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
          </div>
        ) : (
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40">
                {columns.map((col) => (
                  <th
                    key={col.id}
                    scope="col"
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                      col.className
                    )}
                  >
                    {col.sortable && onSortChange ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort(col.id)}
                      >
                        {col.header}
                        {sort?.columnId === col.id && sort.direction ? (
                          <span aria-hidden>{sort.direction === 'asc' ? '↑' : '↓'}</span>
                        ) : null}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={getRowId(row)}
                  className={cn(
                    'border-b border-border/50 transition-theme hover:bg-muted/30',
                    onRowClick ? 'cursor-pointer' : undefined
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'link' : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.id} className={cn('px-4 py-3', col.className)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination && !isLoading && !error && rows.length > 0 ? (
        <Pagination {...pagination} />
      ) : null}
    </div>
  );
}
