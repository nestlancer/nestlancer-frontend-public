'use client';

import type { ReactNode } from 'react';

import { cn } from '@nestlancer/ui';

import { webFilterBarClass, webSelectClass } from '@/lib/tailadmin-classes';

export type ClientFilterOption = { value: string; label: string };

export function ClientFilterBar({
  filters,
  children,
  actions,
  className,
}: {
  filters?: {
    id: string;
    label: string;
    value: string;
    options: ClientFilterOption[];
    onChange: (value: string) => void;
  }[];
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(webFilterBarClass, className)}>
      {filters?.map((filter) => (
        <select
          key={filter.id}
          id={filter.id}
          name={filter.id}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className={webSelectClass}
          aria-label={filter.label}
        >
          {filter.options.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
      {children}
      {actions ? <div className="ml-auto flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
