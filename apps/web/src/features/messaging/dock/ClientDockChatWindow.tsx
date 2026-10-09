'use client';

import { resolvePublicWsUrl } from '@nestlancer/config';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Zap } from '@nestlancer/ui/icons';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { getAccessToken, subscribeToTokens, useAuth } from '@nestlancer/auth';
import { queryKeys } from '@nestlancer/constants';
import type { Conversation } from '@nestlancer/types';
import { useMessagingRoom } from '@nestlancer/websocket';
import {
  ChatGroupEventLine,
  ChatDockWindowHeader,
  MentionPicker,
  MessageBubble,
  MessageComposer,
  MessageDateDivider,
  MessageMembershipDivider,
  MessageThreadScrollArea,
  MessageMentionText,
  SkeletonText,
  cn,
  findPreviousMessageInTimeline,
  formatMessageDayLabel,
  formatMessageTime,
  groupMemberCount,
  isGroupConversation,
  isGroupSystemMessage,
  mergeMessagesWithMembershipTimeline,
  messageDayKey,
  resolveGroupReadLabel,
  resolveGroupThreadSubtitle,
  resolveGroupThreadTitle,
  resolveMessageSenderLabel,
  resolveRenderableMessageContent,
  resolveSentMessageReadStatus,
  shouldShowMessageHeader,
  timelineMessageItems,
} from '@nestlancer/ui';

import { apiServices } from '@/lib/axios';
import { useMediaUpload } from '@/features/media/hooks/useMediaUpload';
import { FileMessageBubble } from '../MessageFileAttachment';
import {
  conversationInitials,
  conversationIsUnread,
  conversationKindLabel,
  conversationTitle,
} from '../conversation-utils';

const wsOrigin = typeof process !== 'undefined' ? resolvePublicWsUrl() : '';

const SUGGESTED_REPLIES = ['Thanks!', 'Got it — I will review.', 'Can we schedule a call?'];

export function ClientDockChatWindow({
  conversation,
  isActive = true,
  focused,
  onFocus,
  onMinimize,
  onClose,
  layout = 'dock',
}: {
  conversation: Conversation;
  isActive?: boolean;
  focused: boolean;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
  layout?: 'dock' | 'inline';
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [quickOpen, setQuickOpen] = useState(false);
  const quickRef = useRef<HTMLDivElement>(null);
  const { uploadAsync, isUploading } = useMediaUpload({ successToast: false });
  const [accessToken, setAccessToken] = useState<string | undefined>(
    () => getAccessToken() ?? undefined
  );
  const markedReadRef = useRef<string | null>(null);
  const isInline = layout === 'inline';
  const isFocused = isInline ? true : focused;

  const threadId = conversation.threadId;
  const projectId =
    conversation.projectId ?? (conversation.kind === 'PROJECT' ? conversation.id : undefined);

  useEffect(() => {
    setAccessToken(getAccessToken() ?? undefined);
    return subscribeToTokens((t) => setAccessToken(t?.accessToken ?? undefined));
  }, []);

  const invalidateFromRealtime = useCallback(() => {
    if (threadId) {
      void qc.invalidateQueries({ queryKey: queryKeys.messages.chatThread(threadId) });
    }
    if (projectId) {
      void qc.invalidateQueries({ queryKey: queryKeys.messages.thread(projectId) });
    }
    void qc.invalidateQueries({ queryKey: queryKeys.messages.conversations });
    void qc.invalidateQueries({ queryKey: queryKeys.messages.unread });
    void qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
  }, [qc, threadId, projectId]);

  const { typingUsers, emitTyping, emitViewState, peerViewState } = useMessagingRoom({
    wsUrl: wsOrigin,
    accessToken,
    socketPath: process.env.NEXT_PUBLIC_SOCKET_IO_PATH,
    threadId: threadId || undefined,
    projectId: threadId ? undefined : projectId,
    currentUserId: user?.id,
    enabled: Boolean(accessToken && wsOrigin && (threadId || projectId)),
    onMessageNew: invalidateFromRealtime,
  });

  useEffect(() => {
    emitViewState(isActive ? 'live' : 'waiting');
  }, [isActive, emitViewState]);

  useEffect(() => {
    return () => {
      emitViewState('closed');
    };
  }, [emitViewState]);

  const handleMinimize = () => {
    emitViewState('waiting');
    onMinimize();
  };

  const handleClose = () => {
    emitViewState('closed');
    onClose();
  };

  const thread = useQuery({
    queryKey: threadId
      ? queryKeys.messages.chatThread(threadId)
      : queryKeys.messages.thread(projectId!),
    queryFn: () =>
      threadId
        ? apiServices.messaging.chatThreadMessages(threadId)
        : apiServices.messaging.projectMessages(projectId!),
    enabled: Boolean(threadId || projectId),
  });

  const isGroup = isGroupConversation(conversation);

  const threadDetailQ = useQuery({
    queryKey: threadId ? queryKeys.messages.chatThreadDetail(threadId) : ['noop'],
    queryFn: () => apiServices.messaging.getChatThread(threadId!),
    enabled: Boolean(threadId && isGroup),
  });

  const members = threadDetailQ.data?.members;
  const membershipStatus =
    conversation.membershipStatus ?? threadDetailQ.data?.membershipStatus ?? 'ACTIVE';
  const isReadOnly = membershipStatus === 'LEFT' || membershipStatus === 'REMOVED';

  const markRead = useMutation({
    mutationFn: () =>
      threadId
        ? apiServices.messaging.markChatThreadRead(threadId)
        : apiServices.messaging.markProjectRead(projectId!),
    onSuccess: invalidateFromRealtime,
    onError: () => {},
  });

  useEffect(() => {
    markedReadRef.current = null;
  }, [conversation.id]);

  useEffect(() => {
    if (!quickOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (quickRef.current && !quickRef.current.contains(event.target as Node)) {
        setQuickOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [quickOpen]);

  useEffect(() => {
    if (!isFocused || !conversationIsUnread(conversation) || isReadOnly) return;
    if (markedReadRef.current === conversation.id) return;
    markedReadRef.current = conversation.id;
    markRead.mutate();
  }, [isFocused, conversation, markRead, isReadOnly]);

  const send = useMutation({
    mutationFn: () => {
      const content = text.trim();
      if (threadId) {
        return apiServices.messaging.sendChatThreadMessage(threadId, { content });
      }
      return apiServices.messaging.sendProjectMessage(projectId!, { content });
    },
    onSuccess: () => {
      setText('');
      invalidateFromRealtime();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Send failed')),
  });

  const memberCount = groupMemberCount(members, conversation.participantIds);
  const title = isGroup
    ? resolveGroupThreadTitle(conversation, members)
    : conversationTitle(conversation);
  const initials = conversationInitials(conversation);
  const subtitle =
    typingUsers.length > 0
      ? `${typingUsers.join(', ')} typing…`
      : peerViewState === 'live'
        ? 'Support is live in chat'
        : peerViewState === 'waiting'
          ? 'Support waiting'
          : isGroup
            ? resolveGroupThreadSubtitle(memberCount || conversation.participantIds?.length || 0)
            : conversationKindLabel(conversation);
  const chronologicalMessages = [...(thread.data?.items ?? [])].reverse();
  const membershipStints = isGroup ? threadDetailQ.data?.membershipStints : undefined;
  const timeline = mergeMessagesWithMembershipTimeline(
    chronologicalMessages,
    membershipStints,
    user?.id
  );
  const timelineMessages = timelineMessageItems(timeline);
  let previousDay = '';

  return (
    <div
      className={cn(
        isInline ? 'inbox-inline-chat' : 'chat-window',
        !isInline && focused && 'is-focused'
      )}
      onMouseDown={isInline ? undefined : onFocus}
    >
      {isInline ? (
        <div className="chat-window-header chat-window-header-aurora">
          <div className="chat-window-avatar chat-window-avatar-aurora">{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="chat-window-title truncate text-foreground">{title}</p>
            <p className="chat-window-subtitle min-w-0 truncate text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>
      ) : (
        <ChatDockWindowHeader
          title={title}
          subtitle={subtitle}
          initials={initials}
          variant="aurora"
          peerViewState={peerViewState}
          peerViewPerspective="client"
          onFocus={onFocus}
          onMinimize={handleMinimize}
          onClose={handleClose}
        />
      )}

      <div className="chat-window-body">
        {isReadOnly ? (
          <div className="border-b border-border bg-muted/40 px-3 py-2 text-center text-[11px] text-muted-foreground">
            {membershipStatus === 'REMOVED'
              ? 'You were removed from this group — viewing your past messages only'
              : 'You left this group — viewing your past messages only'}
          </div>
        ) : null}
        <MessageThreadScrollArea
          itemCount={timelineMessages.length}
          resetKey={threadId ?? projectId}
          className="chat-wallpaper chat-window-messages"
        >
          {thread.isPending ? (
            <li className="p-2">
              <SkeletonText lines={3} />
            </li>
          ) : null}
          {thread.isError ? (
            <li className="p-2 text-xs text-destructive">
              {getApiErrorMessage(thread.error, 'Could not load messages')}
            </li>
          ) : null}
          {!thread.isPending && timelineMessages.length === 0 ? (
            <li className="py-8 text-center text-xs text-muted-foreground">No messages yet</li>
          ) : null}
          {timeline.map((item, index) => {
            if (item.kind === 'separator') {
              return (
                <MessageMembershipDivider
                  key={item.id}
                  label={item.label}
                  variant={item.variant}
                  compact
                />
              );
            }

            const m = item.message;
            if (isGroupSystemMessage(m)) {
              return (
                <ChatGroupEventLine
                  key={m.id}
                  message={m}
                  members={members}
                  viewerUserId={user?.id}
                  compact
                />
              );
            }

            const mine = Boolean(user?.id && m.senderId === user.id);
            const variant = mine ? 'sent' : 'received';
            const senderLabel = resolveMessageSenderLabel(m, mine, 'client');
            const prevMessage = findPreviousMessageInTimeline(timeline, index);
            const showHeader = shouldShowMessageHeader(m, prevMessage, { isGroup });
            const day = messageDayKey(m.createdAt);
            const showDayDivider = day !== previousDay;
            previousDay = day;

            return (
              <span key={m.id} className="contents">
                {showDayDivider ? (
                  <MessageDateDivider label={formatMessageDayLabel(m.createdAt)} compact />
                ) : null}
                <MessageBubble
                  variant={variant}
                  density="compact"
                  senderLabel={senderLabel}
                  showHeader={showHeader}
                  timeLabel={formatMessageTime(m.createdAt)}
                  createdAt={m.createdAt}
                  readStatus={resolveSentMessageReadStatus(m, timelineMessages, user?.id, {
                    isGroup,
                    recipientCount: memberCount,
                  })}
                  readLabel={isGroup ? resolveGroupReadLabel(m, user?.id, memberCount) : undefined}
                >
                  {m.type === 'FILE' ? (
                    <FileMessageBubble content={m.content} mine={mine} />
                  ) : isGroup && members?.length && !isGroupSystemMessage(m) ? (
                    <MessageMentionText content={m.content ?? ''} members={members} />
                  ) : (
                    <p className="whitespace-pre-wrap">
                      {resolveRenderableMessageContent(m, members, user?.id)}
                    </p>
                  )}
                </MessageBubble>
              </span>
            );
          })}
        </MessageThreadScrollArea>

        {typingUsers.length > 0 ? (
          <div className="chat-window-typing">
            <span className="inline-flex items-center gap-1.5">
              <span className="flex gap-0.5">
                <span className="typing-dot h-1 w-1 rounded-full bg-primary/60" />
                <span className="typing-dot h-1 w-1 rounded-full bg-primary/60" />
                <span className="typing-dot h-1 w-1 rounded-full bg-primary/60" />
              </span>
              Support is typing…
            </span>
          </div>
        ) : null}

        {!isReadOnly ? (
          <div className="chat-window-composer">
            <div className="chat-window-composer-wrap" ref={quickRef}>
              {quickOpen ? (
                <div className="chat-window-quick-menu" role="menu" aria-label="Suggested replies">
                  {SUGGESTED_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      role="menuitem"
                      className="chat-window-quick-item"
                      onClick={() => {
                        setText(reply);
                        setQuickOpen(false);
                      }}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              ) : null}
              {isGroup && members && members.length > 0 ? (
                <MentionPicker
                  members={members}
                  currentUserId={user?.id}
                  onPick={(mention) => setText((prev) => `${prev}${mention}`)}
                  className="mb-1 px-0.5"
                />
              ) : null}
              <MessageComposer
                density="compact"
                value={text}
                onChange={(value) => {
                  setText(value);
                  emitTyping();
                }}
                onSend={() => send.mutate()}
                disabled={send.isPending}
                sendDisabled={!text.trim()}
                sendPending={send.isPending}
                enableFileAttach
                fileSendPending={isUploading}
                onSendFile={async (file, caption) => {
                  try {
                    const result = await uploadAsync({
                      file,
                      projectId: projectId || undefined,
                      threadId: threadId || undefined,
                    });
                    if (threadId) {
                      await apiServices.messaging.sendChatThreadMessage(threadId, {
                        mediaId: result.mediaId,
                        type: 'FILE',
                        ...(caption ? { content: caption } : {}),
                      });
                    } else if (projectId) {
                      await apiServices.messaging.sendProjectMessage(projectId, {
                        mediaId: result.mediaId,
                        type: 'FILE',
                        ...(caption ? { content: caption } : {}),
                      });
                    } else {
                      throw new Error('Missing message context');
                    }
                    invalidateFromRealtime();
                    toast.success('File sent');
                  } catch (e) {
                    toast.error(getApiErrorMessage(e, 'Could not send file'));
                  }
                }}
                leadingSlot={
                  <button
                    type="button"
                    className={cn('chat-quick-toggle', quickOpen && 'is-open')}
                    aria-label="Suggested replies"
                    aria-expanded={quickOpen}
                    onClick={() => setQuickOpen((open) => !open)}
                  >
                    <Zap className="h-4 w-4" />
                  </button>
                }
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
