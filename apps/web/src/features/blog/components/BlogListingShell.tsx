'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { cn } from '@nestlancer/ui';

type Props = {
  sidebar: ReactNode;
  children: ReactNode;
};

export function BlogListingShell({ sidebar, children }: Props) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(240px,272px)_1fr]">
      <div
        role="presentation"
        className={cn(
          'fixed inset-0 z-30 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={close}
        aria-hidden={!open}
      />
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[min(280px,85vw)] transition-transform duration-300 lg:static lg:z-0 lg:w-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {sidebar}
      </div>
      <div className="min-w-0 pb-20 lg:pb-12">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 sm:px-6 lg:hidden lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center rounded-md border border-border px-3 text-sm font-medium"
            aria-expanded={open}
            aria-controls="blog-sidebar"
          >
            ☰ Categories
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
