'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';

import { cn } from '../../utils/cn';
import { Dialog, DialogContent, DialogTitle } from './Dialog';
import { Input } from '../primitives/input';

export type CommandItem = {
  id: string;
  label: string;
  group?: string;
  keywords?: string;
  icon?: ReactNode;
  onSelect: () => void;
};

export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
};

export function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = 'Search or jump to…',
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();
  const optionIdPrefix = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group?.toLowerCase().includes(q) ||
        item.keywords?.toLowerCase().includes(q)
    );
  }, [items, query]);

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const g = item.group ?? 'Commands';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(item);
    }
    return map;
  }, [filtered]);

  const flat = useMemo(() => filtered, [filtered]);
  const activeItem = flat[activeIndex];
  const activeOptionId = activeItem ? `${optionIdPrefix}-opt-${activeItem.id}` : undefined;

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const runSelect = useCallback(
    (item: CommandItem) => {
      item.onSelect();
      onOpenChange(false);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && flat[activeIndex]) {
        e.preventDefault();
        runSelect(flat[activeIndex]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, flat, activeIndex, runSelect]);

  let idx = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Command menu</DialogTitle>
        <div className="border-b border-border p-3">
          <Input
            ref={inputRef}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            aria-label="Command search"
          />
        </div>
        <div id={listboxId} className="max-h-[min(360px,50vh)] overflow-y-auto p-2" role="listbox">
          {flat.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results</p>
          ) : (
            Array.from(groups.entries()).map(([group, groupItems]) => (
              <div key={group} className="mb-2">
                <p className="px-2 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group}
                </p>
                {groupItems.map((item) => {
                  idx += 1;
                  const i = idx;
                  const optionId = `${optionIdPrefix}-opt-${item.id}`;
                  return (
                    <button
                      key={item.id}
                      id={optionId}
                      type="button"
                      role="option"
                      aria-selected={i === activeIndex}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-theme',
                        i === activeIndex
                          ? 'bg-primary/12 text-foreground'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      )}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => runSelect(item)}
                    >
                      {item.icon ? (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                          {item.icon}
                        </span>
                      ) : null}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <p className="border-t border-border px-3 py-2 text-[0.6875rem] text-muted-foreground">
          <kbd className="rounded border border-border px-1">↑↓</kbd> navigate ·{' '}
          <kbd className="rounded border border-border px-1">↵</kbd> select ·{' '}
          <kbd className="rounded border border-border px-1">esc</kbd> close
        </p>
      </DialogContent>
    </Dialog>
  );
}

/** Register global Cmd+K / Ctrl+K */
export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpen]);
}
