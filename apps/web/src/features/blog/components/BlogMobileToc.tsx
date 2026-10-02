'use client';

import { useState } from 'react';

import { cn } from '@nestlancer/ui';

import type { MarkdownTocItem } from '../blog-utils';

import { BlogArticleToc } from './BlogArticleToc';

type Props = {
  items: MarkdownTocItem[];
  className?: string;
};

/** Collapsible TOC for mobile / non-xl viewports. */
export function BlogMobileToc({ items, className }: Props) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        'rounded-lg border border-[hsl(var(--article-border))] bg-[hsl(var(--article-chip-bg))]',
        className
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-[hsl(var(--article-text))]"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>On this page</span>
        <span className="font-mono text-xs text-[hsl(var(--article-meta))]" aria-hidden>
          {open ? '−' : '+'}
        </span>
      </button>
      {open ? (
        <div className="border-t border-[hsl(var(--article-border))] px-4 pb-4 pt-2">
          <BlogArticleToc items={items} />
        </div>
      ) : null}
    </div>
  );
}
