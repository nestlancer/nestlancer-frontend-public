'use client';

import { ChevronLeft, ChevronRight } from '../../../icons';
import { cn } from '../../../utils/cn';
import { Button } from '../../primitives/button';

export type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [12, 20, 50],
  className,
}: PaginationProps) {
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4',
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        {total === 0 ? (
          'No results'
        ) : (
          <>
            Showing <span className="font-medium text-foreground">{from}</span>–
            <span className="font-medium text-foreground">{to}</span> of{' '}
            <span className="font-medium text-foreground">{total}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        {onPageSizeChange ? (
          <select
            className="nl-select h-9 min-w-[7rem] rounded-md border border-input bg-background text-sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Prev
        </Button>
        <span className="min-w-[4rem] text-center text-sm text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
