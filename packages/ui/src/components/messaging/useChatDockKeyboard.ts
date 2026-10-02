'use client';

import { useEffect } from 'react';

import { CHAT_DOCK_MAX_SLOTS } from './chat-dock-constants';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function useChatDockKeyboard({
  focusedId,
  slotIds,
  shortcutsOpen,
  onToggleShortcuts,
  onMinimize,
  onClose,
  onFocus,
}: {
  focusedId: string | null;
  slotIds: string[];
  shortcutsOpen: boolean;
  onToggleShortcuts: () => void;
  onMinimize: (id: string) => void;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      if (event.key === '?' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        onToggleShortcuts();
        return;
      }

      if (event.key === 'Escape') {
        if (shortcutsOpen) {
          event.preventDefault();
          onToggleShortcuts();
          return;
        }
        if (focusedId) {
          event.preventDefault();
          onMinimize(focusedId);
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === '.' && focusedId) {
        event.preventDefault();
        onClose(focusedId);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && !event.altKey) {
        const num = Number.parseInt(event.key, 10);
        if (num >= 1 && num <= CHAT_DOCK_MAX_SLOTS) {
          const id = slotIds[num - 1];
          if (id) {
            event.preventDefault();
            onFocus(id);
          }
          return;
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.altKey && event.key === '[') {
        if (!slotIds.length) return;
        event.preventDefault();
        const currentIdx = slotIds.findIndex((id) => id === focusedId);
        const nextIdx = currentIdx <= 0 ? slotIds.length - 1 : currentIdx - 1;
        onFocus(slotIds[nextIdx]!);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.altKey && event.key === ']') {
        if (!slotIds.length) return;
        event.preventDefault();
        const currentIdx = slotIds.findIndex((id) => id === focusedId);
        const nextIdx = currentIdx < 0 || currentIdx >= slotIds.length - 1 ? 0 : currentIdx + 1;
        onFocus(slotIds[nextIdx]!);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusedId, slotIds, shortcutsOpen, onToggleShortcuts, onMinimize, onClose, onFocus]);
}
