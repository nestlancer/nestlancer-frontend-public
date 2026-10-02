'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { ChevronsUpDown } from '@nestlancer/ui/icons';

import { cn } from '@nestlancer/ui';

const STORAGE_KEY = 'nestlancer.sidebar.sections';

function readOpenState(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function SidebarNavSection({
  title,
  children,
  defaultOpen = true,
  compact = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  compact?: boolean;
}) {
  const [openState, setOpenState] = useState<Record<string, boolean>>(() => readOpenState());

  const isOpen = openState[title] ?? defaultOpen;

  const toggle = useCallback(() => {
    setOpenState((prev) => {
      const currentlyOpen = prev[title] ?? defaultOpen;
      const next = { ...prev, [title]: !currentlyOpen };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [defaultOpen, title]);

  if (compact) {
    return <div className="mb-2 flex flex-col gap-0.5">{children}</div>;
  }

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        aria-expanded={isOpen}
      >
        {title}
        <ChevronsUpDown
          className={cn('h-3.5 w-3.5 shrink-0 transition-transform', isOpen && 'rotate-180')}
          aria-hidden
        />
      </button>
      {isOpen ? <div className="mt-0.5 flex flex-col gap-0.5">{children}</div> : null}
    </div>
  );
}
