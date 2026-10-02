'use client';

import { useState } from 'react';
import { ChevronsUpDown, FileText, Paperclip } from '@nestlancer/ui/icons';

import { DEFAULT_CURRENCY, formatRequestCategory } from '@nestlancer/constants';
import { formatIsoDate, formatMoneyFromPaise } from '@nestlancer/utils';
import { Button, cn } from '@nestlancer/ui';

type RequestBriefSidebarProps = {
  title: string;
  description: string;
  category?: string;
  clientLabel: string;
  budget?: { min?: number; max?: number; currency?: string };
  timeline?: { preferredStartDate?: string; deadline?: string };
  requirements?: string[];
  attachmentCount?: number;
  className?: string;
};

export function RequestBriefSidebar({
  title,
  description,
  category,
  clientLabel,
  budget,
  timeline,
  requirements = [],
  attachmentCount = 0,
  className,
}: RequestBriefSidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const currency = budget?.currency ?? DEFAULT_CURRENCY;
  const budgetLabel =
    typeof budget?.min === 'number' && typeof budget?.max === 'number'
      ? `${formatMoneyFromPaise(budget.min, currency)} – ${formatMoneyFromPaise(budget.max, currency)}`
      : null;

  const preview =
    description.length > 280 && !expanded ? `${description.slice(0, 280).trim()}…` : description;

  return (
    <aside className={cn('rounded-xl border border-border/70 bg-card shadow-sm', className)}>
      <div className="border-b border-border/60 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Client request
        </p>
        <h2 className="mt-1 text-base font-semibold leading-snug text-foreground">{title}</h2>
      </div>

      <dl className="space-y-3 border-b border-border/60 px-4 py-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Client</dt>
          <dd className="mt-0.5 font-medium">{clientLabel}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Category</dt>
          <dd className="mt-0.5">{formatRequestCategory(category)}</dd>
        </div>
        {budgetLabel ? (
          <div>
            <dt className="text-xs text-muted-foreground">Budget range</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{budgetLabel}</dd>
          </div>
        ) : null}
        {timeline?.deadline ? (
          <div>
            <dt className="text-xs text-muted-foreground">Deadline</dt>
            <dd className="mt-0.5">{formatIsoDate(String(timeline.deadline), 'PP')}</dd>
          </div>
        ) : null}
      </dl>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Brief
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {preview}
        </p>
        {description.length > 280 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 h-8 px-2 text-xs"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                <ChevronsUpDown className="mr-1 h-3.5 w-3.5 rotate-180" /> Show less
              </>
            ) : (
              <>
                <ChevronsUpDown className="mr-1 h-3.5 w-3.5" /> Read full brief
              </>
            )}
          </Button>
        ) : null}
      </div>

      {requirements.length > 0 ? (
        <div className="border-t border-border/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Requirements
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {requirements.slice(0, expanded ? undefined : 6).map((r) => (
              <li
                key={r}
                className="rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-xs"
              >
                {r}
              </li>
            ))}
            {!expanded && requirements.length > 6 ? (
              <li className="px-1 text-xs text-muted-foreground">
                +{requirements.length - 6} more
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {attachmentCount > 0 ? (
        <div className="flex items-center gap-2 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" aria-hidden />
          {attachmentCount} attachment{attachmentCount === 1 ? '' : 's'} on request
        </div>
      ) : null}
    </aside>
  );
}
