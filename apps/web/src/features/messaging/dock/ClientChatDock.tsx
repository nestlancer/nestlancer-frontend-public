'use client';

import { useEffect, useMemo } from 'react';

import type { Conversation } from '@nestlancer/types';
import { ChatDockMinimizedPill, ChatDockRail, cn } from '@nestlancer/ui';

import { ClientDockChatWindow } from './ClientDockChatWindow';
import { conversationInitials, conversationTitle } from '../conversation-utils';

export type ClientDockSlot = {
  conversation: Conversation;
  minimized: boolean;
};

export function ClientChatDock({
  slots,
  focusedId,
  pulsingIds,
  onFocus,
  onMinimize,
  onClose,
  isUnread,
}: {
  slots: Map<string, ClientDockSlot>;
  focusedId: string | null;
  pulsingIds?: Set<string>;
  onFocus: (id: string) => void;
  onMinimize: (id: string) => void;
  onClose: (id: string) => void;
  isUnread?: (conversation: Conversation) => boolean;
}) {
  const hasExpanded = [...slots.values()].some((s) => !s.minimized);
  const hasBar = slots.size > 0;

  useEffect(() => {
    document.body.classList.toggle('has-chat-dock', hasExpanded);
    document.body.classList.toggle('has-chat-dock-bar', hasBar);
    return () => {
      document.body.classList.remove('has-chat-dock');
      document.body.classList.remove('has-chat-dock-bar');
    };
  }, [hasExpanded, hasBar]);

  const orderedSlots = useMemo(() => [...slots.values()], [slots]);

  const railItems = useMemo(
    () =>
      orderedSlots.map((slot) => ({
        id: slot.conversation.id,
        label: conversationTitle(slot.conversation),
        initials: conversationInitials(slot.conversation),
        unread: isUnread?.(slot.conversation),
        minimized: slot.minimized,
        focused: focusedId === slot.conversation.id,
      })),
    [orderedSlots, focusedId, isUnread]
  );

  if (slots.size === 0) return null;

  return (
    <div className="chat-dock chat-dock-aurora" aria-label="Active conversations">
      <ChatDockRail focusedId={focusedId} items={railItems} onSelectItem={onFocus}>
        {orderedSlots.map((slot) => (
          <div
            key={slot.conversation.id}
            data-dock-slot={slot.conversation.id}
            className={cn('chat-dock-slot', slot.minimized && 'is-minimized')}
          >
            {slot.minimized ? (
              <ChatDockMinimizedPill
                title={conversationTitle(slot.conversation)}
                initials={conversationInitials(slot.conversation)}
                focused={focusedId === slot.conversation.id}
                pulsing={Boolean(pulsingIds?.has(slot.conversation.id))}
                unread={isUnread?.(slot.conversation)}
                onRestore={() => onFocus(slot.conversation.id)}
                onClose={() => onClose(slot.conversation.id)}
              />
            ) : null}
            <div className={cn(slot.minimized && 'chat-dock-window-suspended')}>
              <ClientDockChatWindow
                conversation={slot.conversation}
                isActive={!slot.minimized}
                focused={focusedId === slot.conversation.id}
                onFocus={() => onFocus(slot.conversation.id)}
                onMinimize={() => onMinimize(slot.conversation.id)}
                onClose={() => onClose(slot.conversation.id)}
              />
            </div>
          </div>
        ))}
      </ChatDockRail>
    </div>
  );
}
