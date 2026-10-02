'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const NEAR_BOTTOM_THRESHOLD = 120;

/**
 * Keeps a message list pinned to the bottom while the user is already viewing
 * the latest messages. If they scroll up to read history, new messages do not
 * yank the viewport until they return to the bottom or tap "Jump to latest".
 */
export function useMessageThreadScroll(itemCount: number, resetKey?: string | number) {
  const viewportRef = useRef<HTMLUListElement>(null);
  const stickToBottomRef = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const isNearBottom = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    stickToBottomRef.current = true;
    setShowJumpToLatest(false);
  }, []);

  useEffect(() => {
    stickToBottomRef.current = true;
    setShowJumpToLatest(false);
    requestAnimationFrame(() => scrollToBottom('auto'));
  }, [resetKey, scrollToBottom]);

  useLayoutEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setShowJumpToLatest(false);
  }, [itemCount]);

  const onScroll = useCallback(() => {
    const near = isNearBottom();
    stickToBottomRef.current = near;
    setShowJumpToLatest(!near);
  }, [isNearBottom]);

  return {
    viewportRef,
    showJumpToLatest,
    scrollToBottom,
    onScroll,
  };
}
