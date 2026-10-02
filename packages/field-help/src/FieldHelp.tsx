'use client';

import { HelpCircle } from '@nestlancer/ui/icons';
import { useId, useRef, useState } from 'react';
import clsx from 'clsx';

import type { FieldHelpContent, FieldHelpKey } from './types';
import { getFieldHelp } from './registry';

export type FieldHelpProps = {
  fieldKey?: FieldHelpKey;
  help?: FieldHelpContent;
  label: string;
  className?: string;
};

function HelpBody({ content }: { content: FieldHelpContent }) {
  return (
    <div className="space-y-2 text-sm leading-snug">
      <p>{content.what}</p>
      <p className="text-muted-foreground">{content.enter}</p>
      {content.example ? (
        <p>
          <span className="text-muted-foreground">Example: </span>
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{content.example}</code>
        </p>
      ) : null}
    </div>
  );
}

export function FieldHelp({ fieldKey, help, label, className }: FieldHelpProps) {
  const content = help ?? (fieldKey ? getFieldHelp(fieldKey) : undefined);
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  if (!content) return null;

  const ariaLabel = `Help for ${label}`;

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        className={clsx(
          'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors',
          'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          className
        )}
        aria-label={ariaLabel}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={(e) => {
          if (!wrapRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
        }}
      >
        <HelpCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
      {open ? (
        <div
          id={tooltipId}
          role="tooltip"
          className={clsx(
            // Prefer scanned utilities (w-80) so missing Tailwind content paths cannot collapse width.
            'absolute bottom-full left-0 z-[100] mb-2 w-80 max-w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-border bg-popover px-3 py-2.5 text-popover-foreground shadow-md',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          <HelpBody content={content} />
        </div>
      ) : null}
    </span>
  );
}
