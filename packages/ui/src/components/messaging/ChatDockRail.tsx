'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode, type WheelEvent } from 'react';

import { ChevronLeft, ChevronRight, Menu } from '../../icons';
import { cn } from '../../utils/cn';

export type ChatDockRailItem = {
  id: string;
  label: string;
  initials: string;
  unread?: boolean;
  minimized?: boolean;
  focused?: boolean;
};

export function ChatDockRail({
  children,
  focusedId,
  items,
  onSelectItem,
}: {
  children: ReactNode;
  focusedId?: string | null;
  items: ChatDockRailItem[];
  onSelectItem?: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(items.length);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    el.addEventListener('scroll', updateScrollState, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', updateScrollState);
    };
  }, [updateScrollState, children, items.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (items.length > prevCountRef.current) {
      requestAnimationFrame(() => {
        el.scrollLeft = el.scrollWidth;
        updateScrollState();
      });
    }

    prevCountRef.current = items.length;
  }, [items.length, updateScrollState]);

  useEffect(() => {
    if (!focusedId) return;
    const el = scrollRef.current;
    if (!el) return;
    const slot = el.querySelector<HTMLElement>(`[data-dock-slot="${focusedId}"]`);
    slot?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [focusedId, items.length]);

  useEffect(() => {
    if (!overflowOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(event.target as Node)) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [overflowOpen]);

  const scrollBy = (direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.max(240, el.clientWidth * 0.65),
      behavior: 'smooth',
    });
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    el.scrollLeft += event.deltaY;
  };

  const showOverflow = items.length > 0;
  const hasOverflow = canScrollLeft || canScrollRight || items.length > 3;

  return (
    <div
      className={cn(
        'chat-dock-rail',
        canScrollLeft && 'has-overflow-left',
        canScrollRight && 'has-overflow-right'
      )}
    >
      {canScrollLeft ? (
        <button
          type="button"
          className="chat-dock-scroll chat-dock-scroll--left"
          aria-label="Scroll conversations left"
          title="Scroll left"
          onClick={() => scrollBy(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      ) : null}

      <div className="chat-dock-rail-viewport">
        <div className="chat-dock-slots" ref={scrollRef} onWheel={onWheel}>
          {children}
        </div>
      </div>

      {canScrollRight ? (
        <button
          type="button"
          className="chat-dock-scroll chat-dock-scroll--right"
          aria-label="Scroll conversations right"
          title="Scroll right"
          onClick={() => scrollBy(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}

      {showOverflow ? (
        <div className="chat-dock-overflow" ref={overflowRef}>
          <button
            type="button"
            className={cn(
              'chat-dock-overflow-btn',
              overflowOpen && 'is-open',
              hasOverflow && 'has-badge'
            )}
            aria-label="All docked conversations"
            aria-expanded={overflowOpen}
            title="All conversations"
            onClick={() => setOverflowOpen((open) => !open)}
          >
            <Menu className="h-4 w-4" />
            {items.length > 0 ? (
              <span className="chat-dock-overflow-count">{items.length}</span>
            ) : null}
          </button>

          {overflowOpen ? (
            <div className="chat-dock-overflow-menu" role="menu" aria-label="Docked conversations">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={cn('chat-dock-overflow-item', item.focused && 'is-focused')}
                  onClick={() => {
                    onSelectItem?.(item.id);
                    setOverflowOpen(false);
                  }}
                >
                  <span className="chat-dock-overflow-item-avatar">{item.initials}</span>
                  <span className="chat-dock-overflow-item-label">{item.label}</span>
                  {item.unread ? (
                    <span className="chat-dock-overflow-item-unread" aria-label="Unread" />
                  ) : null}
                  <span className="chat-dock-overflow-item-state">
                    {item.minimized ? 'Minimized' : 'Open'}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
