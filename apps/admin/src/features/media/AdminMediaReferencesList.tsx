'use client';

import Link from 'next/link';

import { StatusBadge } from '@nestlancer/ui';

import type { AdminMediaReference } from './types';

export function AdminMediaReferencesList({
  references,
  referenceCount,
  compact = false,
}: {
  references: AdminMediaReference[];
  referenceCount: number;
  compact?: boolean;
}) {
  if (referenceCount === 0 && references.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No references found. Safe to delete without breaking links.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {referenceCount > 0 ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          <StatusBadge variant="warning" dot>
            {referenceCount} reference{referenceCount === 1 ? '' : 's'}
          </StatusBadge>
          <p>This file is linked elsewhere. Deleting without force may fail or break content.</p>
        </div>
      ) : null}

      <ul className={compact ? 'space-y-2' : 'space-y-3'}>
        {references.map((ref) => (
          <li
            key={`${ref.type}:${ref.resourceId}:${ref.label}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium">{ref.label}</p>
              <p className="text-xs text-muted-foreground">
                {ref.type} · {ref.resourceId}
              </p>
            </div>
            <Link href={ref.adminPath} className="text-xs font-medium text-primary hover:underline">
              Open
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
