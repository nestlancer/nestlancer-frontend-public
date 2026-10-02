'use client';

import { useEffect, useState } from 'react';

import { cn } from '@nestlancer/ui';

import type { MarkdownTocItem } from '../blog-utils';

type Props = {
  items: MarkdownTocItem[];
  className?: string;
};

/**
 * Sticky/in-page TOC with scroll-synced active section (docs-style).
 */
export function BlogArticleToc({ items, className }: Props) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) return;

    const headingElements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (headingElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
          return;
        }
        // Fallback: last heading that has scrolled above the offset line
        const offset = 120;
        let current: string | null = items[0]?.id ?? null;
        for (const el of headingElements) {
          if (el.getBoundingClientRect().top <= offset) current = el.id;
        }
        if (current) setActiveId(current);
      },
      {
        rootMargin: '-100px 0px -55% 0px',
        threshold: [0, 0.25, 1],
      }
    );

    for (const el of headingElements) observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className={className} aria-label="Table of contents">
      <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-[hsl(var(--article-meta))]">
        In this article
      </p>
      <ul className="mt-3 max-h-[min(60vh,28rem)] space-y-0.5 overflow-y-auto border-l border-[hsl(var(--article-border))] pr-1">
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <li key={item.id} className={item.level === 3 ? 'pl-3' : ''}>
              <a
                href={`#${item.id}`}
                className={cn(
                  '-ml-px block border-l-2 py-1.5 pl-3 text-sm leading-snug transition-colors',
                  active
                    ? 'border-[hsl(var(--article-accent))] font-medium text-[hsl(var(--article-accent))]'
                    : 'border-transparent text-[hsl(var(--article-muted))] hover:text-[hsl(var(--article-accent))]'
                )}
                aria-current={active ? 'location' : undefined}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
