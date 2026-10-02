'use client';

import { cn } from '@nestlancer/ui';

type AdminEntityIdChipProps = {
  id: string;
  className?: string;
};

/** Full entity ID with admin-friendly chip styling (copy-friendly, no truncation). */
export function AdminEntityIdChip({ id, className }: AdminEntityIdChipProps) {
  if (!id) return null;

  return (
    <code
      className={cn(
        'mt-1.5 block w-fit max-w-full break-all rounded-md border border-[hsl(var(--status-info-border))] bg-[hsl(var(--status-info-bg))] px-2 py-1 font-mono text-[11px] font-medium leading-relaxed text-[hsl(var(--status-info))]',
        className
      )}
      title={id}
    >
      {id}
    </code>
  );
}
