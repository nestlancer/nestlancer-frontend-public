'use client';

import { resolvePublicWsUrl } from '@nestlancer/config';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { queryKeys } from '@nestlancer/constants';
import type { Conversation } from '@nestlancer/types';
import { getAccessToken, subscribeToTokens, useAuth } from '@nestlancer/auth';
import {
  conversationsToInboxRooms,
  conversationToRoomRef,
  findConversationForInboundMessage,
  resolveConversationPeerUserId,
  useConversationPeerViews,
  useMessagingInboxRealtime,
  type PeerViewState,
  type MessagingInboundPayload,
} from '@nestlancer/websocket';

import { apiServices } from '@/lib/axios';
import {
  ChatDockShortcutsPanel,
  CHAT_DOCK_MAX_SLOTS,
  toast,
  useChatDockKeyboard,
} from '@nestlancer/ui';

import { AdminChatDock } from './AdminChatDock';
import type { DockSlot } from './AdminChatDock';
import { conversationIsUnread } from './conversation-utils';

const MAX_DOCKED = CHAT_DOCK_MAX_SLOTS;

const wsOrigin = typeof process !== 'undefined' ? resolvePublicWsUrl() : '';

export type OpenDockOptions = {
  focus?: boolean;
  minimized?: boolean;
};

type AdminChatDockContextValue = {
  slots: Map<string, DockSlot>;
  focusedId: string | null;
  focusedConversation: Conversation | null;
  dockedCount: number;
  pulsingIds: Set<string>;
  peerViewForConversation: (conversation: Conversation) => PeerViewState | null;
  openDock: (conversation: Conversation, options?: boolean | OpenDockOptions) => void;
  minimizeDock: (id: string) => void;
  closeDock: (id: string) => void;
  focusDock: (id: string) => void;
  /** Inline chat on /messages (command center layout) */
  inlineConversationId: string | null;
  inlineConversation: Conversation | null;
  selectConversation: (conversation: Conversation) => void;
  isMessagesInboxPage: boolean;
};

const AdminChatDockContext = createContext<AdminChatDockContextValue | null>(null);

export function useAdminChatDock(): AdminChatDockContextValue {
  const ctx = useContext(AdminChatDockContext);
  if (!ctx) {
    throw new Error('useAdminChatDock must be used within AdminChatDockProvider');
  }
  return ctx;
}

function resolveOpenOptions(options?: boolean | OpenDockOptions): {
  focus: boolean;
  minimized: boolean;
} {
  if (typeof options === 'boolean') return { focus: options, minimized: false };
  return { focus: options?.focus ?? true, minimized: options?.minimized ?? false };
}

/**
 * Persists operator chat dock state across admin console routes.
 * Auto-pops minimized pills on inbound client messages (notify without interrupt).
 */
export function AdminChatDockProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMessagesInboxPage =
    pathname === '/messages/inbox' ||
    pathname.startsWith('/messages/thread/') ||
    pathname.startsWith('/messages/project/');

  const qc = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [slots, setSlots] = useState<Map<string, DockSlot>>(new Map());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [inlineConversationId, setInlineConversationId] = useState<string | null>(null);
  const [pulsingIds, setPulsingIds] = useState<Set<string>>(new Set());
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [accessToken, setAccessToken] = useState<string | undefined>(
    () => getAccessToken() ?? undefined
  );
  const openDockRef = useRef<(c: Conversation, o?: boolean | OpenDockOptions) => void>(() => {});

  useEffect(() => {
    setAccessToken(getAccessToken() ?? undefined);
    return subscribeToTokens((t) => setAccessToken(t?.accessToken ?? undefined));
  }, []);

  const conversationsQ = useQuery({
    queryKey: queryKeys.messages.conversations,
    queryFn: () => apiServices.messaging.conversations(),
    enabled: isAuthenticated,
    staleTime: 15_000,
    refetchInterval: isAuthenticated ? 45_000 : false,
  });

  const items = useMemo(
    () => (conversationsQ.data?.items ?? []) as Conversation[],
    [conversationsQ.data?.items]
  );

  const inlineConversation = useMemo(
    () =>
      inlineConversationId ? (items.find((c) => c.id === inlineConversationId) ?? null) : null,
    [inlineConversationId, items]
  );

  const selectConversation = useCallback((conversation: Conversation) => {
    setInlineConversationId(conversation.id);
  }, []);

  useEffect(() => {
    if (!isMessagesInboxPage) {
      setInlineConversationId(null);
    }
  }, [isMessagesInboxPage]);

  const inboxRooms = useMemo(() => conversationsToInboxRooms(items), [items]);

  const { getPeerViewState } = useConversationPeerViews({
    wsUrl: wsOrigin,
    accessToken,
    socketPath: process.env.NEXT_PUBLIC_SOCKET_IO_PATH,
    rooms: inboxRooms,
    currentUserId: user?.id,
    enabled: isAuthenticated && Boolean(accessToken && wsOrigin && inboxRooms.length > 0),
  });

  const peerViewForConversation = useCallback(
    (conversation: Conversation): PeerViewState | null => {
      const peerUserId = resolveConversationPeerUserId(conversation, user?.id);
      return getPeerViewState(conversationToRoomRef(conversation), peerUserId);
    },
    [getPeerViewState, user?.id]
  );

  const openDock = useCallback(
    (conversation: Conversation, options?: boolean | OpenDockOptions) => {
      const { focus, minimized } = resolveOpenOptions(options);

      setSlots((prev) => {
        const next = new Map(prev);
        const existing = next.get(conversation.id);

        if (!existing) {
          if (next.size >= MAX_DOCKED) {
            const oldest = next.keys().next().value;
            if (oldest) {
              next.delete(oldest);
              toast.message(`Dock full (${MAX_DOCKED}) — closed oldest conversation`);
            }
          }
          next.set(conversation.id, { conversation, minimized: minimized && !focus });
        } else {
          next.set(conversation.id, {
            conversation,
            minimized: focus ? false : existing ? existing.minimized : minimized,
          });
        }
        return new Map(next);
      });

      if (focus) {
        setFocusedId(conversation.id);
        setPulsingIds((prev) => {
          if (!prev.has(conversation.id)) return prev;
          const next = new Set(prev);
          next.delete(conversation.id);
          return next;
        });
      }
    },
    []
  );

  openDockRef.current = openDock;

  const minimizeDock = useCallback((id: string) => {
    setSlots((prev) => {
      const next = new Map(prev);
      const slot = next.get(id);
      if (slot) next.set(id, { ...slot, minimized: true });
      return next;
    });
  }, []);

  const closeDock = useCallback((id: string) => {
    setSlots((prev) => {
      const next = new Map(prev);
      next.delete(id);
      setFocusedId((current) => {
        if (current !== id) return current;
        const remaining = [...next.keys()];
        return remaining.length ? remaining[remaining.length - 1]! : null;
      });
      return next;
    });
    setPulsingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const focusDock = useCallback((id: string) => {
    setFocusedId(id);
    setSlots((prev) => {
      const next = new Map(prev);
      const slot = next.get(id);
      if (slot) next.set(id, { ...slot, minimized: false });
      return next;
    });
    setPulsingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleInboundMessage = useCallback(
    async (payload: MessagingInboundPayload) => {
      let conv = findConversationForInboundMessage(items, payload);

      if (!conv) {
        const fresh = await conversationsQ.refetch();
        const freshItems = (fresh.data?.items ?? []) as Conversation[];
        conv = findConversationForInboundMessage(freshItems, payload);
      }

      if (!conv) return;

      void qc.invalidateQueries({ queryKey: queryKeys.messages.conversations });
      void qc.invalidateQueries({ queryKey: queryKeys.messages.unread });

      if (isMessagesInboxPage) {
        setInlineConversationId(conv!.id);
        return;
      }

      openDockRef.current(conv, { focus: false, minimized: true });
      setPulsingIds((prev) => new Set(prev).add(conv!.id));
    },
    [items, conversationsQ, qc, isMessagesInboxPage]
  );

  useMessagingInboxRealtime({
    wsUrl: wsOrigin,
    accessToken,
    socketPath: process.env.NEXT_PUBLIC_SOCKET_IO_PATH,
    rooms: inboxRooms,
    currentUserId: user?.id,
    enabled: isAuthenticated && Boolean(accessToken && wsOrigin && inboxRooms.length > 0),
    onInboundMessage: (payload) => void handleInboundMessage(payload),
  });

  useEffect(() => {
    if (!items.length || slots.size === 0) return;

    setSlots((prev) => {
      let changed = false;
      const next = new Map(prev);
      for (const [id, slot] of prev) {
        const fresh = items.find((c) => c.id === id);
        if (fresh) {
          next.set(id, { ...slot, conversation: fresh });
          changed = true;
        }
      }
      return changed ? new Map(next) : prev;
    });
  }, [items, slots.size]);

  const slotIds = useMemo(() => [...slots.keys()], [slots]);

  useChatDockKeyboard({
    focusedId,
    slotIds,
    shortcutsOpen,
    onToggleShortcuts: () => setShortcutsOpen((open) => !open),
    onMinimize: minimizeDock,
    onClose: closeDock,
    onFocus: focusDock,
  });

  const focusedConversation =
    focusedId && slots.has(focusedId) ? slots.get(focusedId)!.conversation : null;

  const value = useMemo(
    () => ({
      slots,
      focusedId,
      focusedConversation,
      dockedCount: slots.size,
      pulsingIds,
      peerViewForConversation,
      openDock,
      minimizeDock,
      closeDock,
      focusDock,
      inlineConversationId,
      inlineConversation,
      selectConversation,
      isMessagesInboxPage,
    }),
    [
      slots,
      focusedId,
      focusedConversation,
      pulsingIds,
      peerViewForConversation,
      openDock,
      minimizeDock,
      closeDock,
      focusDock,
      inlineConversationId,
      inlineConversation,
      selectConversation,
      isMessagesInboxPage,
    ]
  );

  return (
    <AdminChatDockContext.Provider value={value}>
      {children}
      {shortcutsOpen && slots.size > 0 ? (
        <ChatDockShortcutsPanel onClose={() => setShortcutsOpen(false)} />
      ) : null}
      {!isMessagesInboxPage ? (
        <AdminChatDock
          slots={slots}
          focusedId={focusedId}
          pulsingIds={pulsingIds}
          onFocus={focusDock}
          onMinimize={minimizeDock}
          onClose={closeDock}
          isUnread={conversationIsUnread}
        />
      ) : null}
    </AdminChatDockContext.Provider>
  );
}
