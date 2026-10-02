'use client';

import { resolvePublicWsUrl } from '@nestlancer/config';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage, previewMessageContent } from '@nestlancer/api-client';
import { getAccessToken, subscribeToTokens, useAuth } from '@nestlancer/auth';
import { queryKeys } from '@nestlancer/constants';
import { useMessagingRoom } from '@nestlancer/websocket';
import {
  Button,
  ErrorState,
  MessageActionButton,
  MessageBubble,
  MessageComposer,
  MessageDateDivider,
  MessageMembershipDivider,
  MessageThreadHeader,
  MessageThreadPanel,
  MessagingSplitWorkspace,
  MessagingWorkspaceChrome,
  Skeleton,
  SkeletonText,
  findPreviousMessageInTimeline,
  formatMessageDayLabel,
  formatMessageTime,
  groupMemberCount,
  isGroupConversation,
  isGroupSystemMessage,
  isMessageFlagged,
  MentionPicker,
  MessageMentionText,
  ModeratedMessageBody,
  mergeMessagesWithMembershipTimeline,
  messageDayKey,
  messageSenderInitials,
  messagingPanelClass,
  messagingThreadFillClass,
  resolveGroupReadLabel,
  resolveGroupThreadSubtitle,
  resolveGroupThreadTitle,
  resolveMessageSenderLabel,
  resolveGroupSystemMessageLabel,
  resolveGroupSystemMessageVariant,
  resolveRenderableMessageContent,
  resolvePeerDisplayName,
  resolveSentMessageReadStatus,
  shouldShowMessageHeader,
  timelineMessageItems,
  cn,
} from '@nestlancer/ui';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { apiServices } from '@/lib/axios';
import { AdminFileMessageBubble } from './AdminMessageFileAttachment';
import { AdminGroupMembersPanel } from './AdminGroupMembersPanel';
import { AdminInboxQueuePane } from './AdminInboxQueuePane';
import { ConversationSearchSidebar } from './ConversationSearchSidebar';
import { useMediaUpload } from '@/hooks/useMediaUpload';

const wsOrigin = typeof process !== 'undefined' ? resolvePublicWsUrl() : '';

const QUICK_REPLIES = ['Checking availability…', 'Confirmed for Thursday', 'Need more details'];

export function AdminChatThreadClient({ threadId }: { threadId: string }) {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const { uploadAsync, isUploading } = useMediaUpload();
  const [accessToken, setAccessToken] = useState<string | undefined>(
    () => getAccessToken() ?? undefined
  );

  useEffect(() => {
    setAccessToken(getAccessToken() ?? undefined);
    return subscribeToTokens((t) => setAccessToken(t?.accessToken ?? undefined));
  }, []);

  useEffect(() => {
    document.body.classList.add('messages-inbox-page');
    return () => document.body.classList.remove('messages-inbox-page');
  }, []);

  const invalidateFromRealtime = useCallback(() => {
    void qc.invalidateQueries({ queryKey: queryKeys.messages.chatThread(threadId) });
    void qc.invalidateQueries({ queryKey: queryKeys.messages.conversations });
  }, [qc, threadId]);

  useMessagingRoom({
    wsUrl: wsOrigin,
    accessToken,
    socketPath: process.env.NEXT_PUBLIC_SOCKET_IO_PATH,
    threadId,
    enabled: Boolean(accessToken && wsOrigin),
    onMessageNew: invalidateFromRealtime,
  });

  const thread = useQuery({
    queryKey: queryKeys.messages.chatThread(threadId),
    queryFn: () => apiServices.messaging.chatThreadMessages(threadId),
  });

  const conversationsQ = useQuery({
    queryKey: queryKeys.messages.conversations,
    queryFn: () => apiServices.messaging.conversations(),
  });

  const threadDetailQ = useQuery({
    queryKey: queryKeys.messages.chatThreadDetail(threadId),
    queryFn: () => apiServices.messaging.getChatThread(threadId),
  });

  const send = useMutation({
    mutationFn: () =>
      apiServices.messaging.sendChatThreadMessage(threadId, {
        content: text.trim(),
        ...(replyToId ? { replyToId } : {}),
      }),
    onSuccess: () => {
      setText('');
      setReplyToId(null);
      invalidateFromRealtime();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Send failed')),
  });

  const markRead = useMutation({
    mutationFn: () => apiServices.messaging.markChatThreadRead(threadId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.messages.unread });
    },
    onError: () => {},
  });

  const patchMessageM = useMutation({
    mutationFn: () => {
      if (!editingMessageId) throw new Error('No message selected');
      return apiServices.messaging.patchMessage(editingMessageId, { content: editText.trim() });
    },
    onSuccess: () => {
      setEditingMessageId(null);
      setEditText('');
      invalidateFromRealtime();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not edit message')),
  });

  const deleteMessageM = useMutation({
    mutationFn: (messageId: string) => apiServices.messaging.deleteMessage(messageId),
    onSuccess: invalidateFromRealtime,
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not delete message')),
  });

  const flagMessageM = useMutation({
    mutationFn: (messageId: string) => apiServices.messaging.flagMessage(messageId),
    onSuccess: () => {
      toast.success('Message flagged for moderation');
      invalidateFromRealtime();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not flag message')),
  });

  if (thread.isPending) {
    return (
      <div className={cn(messagingPanelClass, 'flex min-h-[70vh] flex-col gap-3 p-4')}>
        <Skeleton className="h-16 w-full" />
        <SkeletonText lines={4} />
        <Skeleton className="mt-auto h-14 w-full rounded-2xl" />
      </div>
    );
  }

  if (thread.isError) {
    return (
      <ErrorState
        title="Could not load messages"
        message={getApiErrorMessage(thread.error, 'Could not load thread')}
        onRetry={() => void thread.refetch()}
      />
    );
  }

  const items = [...(thread.data?.items ?? [])].reverse();
  const conversation = conversationsQ.data?.items.find(
    (c) => c.threadId === threadId || c.id === threadId
  );
  const isGroup = isGroupConversation(conversation);
  const membershipStints = isGroup ? threadDetailQ.data?.membershipStints : undefined;
  const timeline = mergeMessagesWithMembershipTimeline(items, membershipStints, user?.id);
  const timelineMessages = timelineMessageItems(timeline);
  const replyTarget = replyToId ? timelineMessages.find((m) => m.id === replyToId) : undefined;
  const members = threadDetailQ.data?.members;
  const memberCount = groupMemberCount(members, conversation?.participantIds);
  const peerName = resolvePeerDisplayName(items, user?.id);
  const headerTitle = isGroup
    ? resolveGroupThreadTitle(conversation, members)
    : peerName || conversation?.title?.trim() || 'Chat thread';
  const headerSubtitle = isGroup
    ? resolveGroupThreadSubtitle(memberCount || conversation?.participantIds?.length || 0)
    : 'Direct conversation';
  let previousDay = '';

  return (
    <MessagingWorkspaceChrome
      title="Messages"
      description={headerSubtitle}
      actions={
        <Button size="sm" variant="outline" asChild>
          <a href="/messages/inbox">Panel</a>
        </Button>
      }
    >
      <MessagingSplitWorkspace
        queue={<AdminInboxQueuePane />}
        context={
          <div className="flex min-h-0 flex-col gap-3">
            {isGroup && showGroupInfo ? <AdminGroupMembersPanel threadId={threadId} /> : null}
            <ConversationSearchSidebar threadId={threadId} />
          </div>
        }
      >
        <div className={cn(messagingThreadFillClass)}>
          <MessageThreadPanel
            embedded
            itemCount={timelineMessages.length}
            resetKey={threadId}
            className="min-h-0 flex-1"
            header={
              <MessageThreadHeader
                variant="intercom"
                title={headerTitle}
                subtitle={headerSubtitle}
                initials={messageSenderInitials(headerTitle)}
                backHref="/messages/inbox"
                quickReplies={QUICK_REPLIES}
                onQuickReply={setText}
                onMarkRead={() => markRead.mutate()}
                markReadPending={markRead.isPending}
                actions={
                  isGroup ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowGroupInfo((open) => !open)}
                    >
                      {showGroupInfo ? 'Hide members' : 'Members'}
                    </Button>
                  ) : undefined
                }
              />
            }
            emptyState={
              <li className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                <p className="text-sm font-medium text-foreground">No messages yet</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Send the first message to open this conversation.
                </p>
              </li>
            }
            composer={
              <div className="space-y-2">
                {isGroup && members && members.length > 0 ? (
                  <MentionPicker
                    members={members}
                    currentUserId={user?.id}
                    onPick={(mention) => setText((prev) => `${prev}${mention}`)}
                    className="px-1"
                  />
                ) : null}
                <MessageComposer
                  variant="admin"
                  placeholder="Reply as operator…"
                  value={text}
                  onChange={setText}
                  onSend={() => send.mutate()}
                  disabled={send.isPending}
                  sendDisabled={!text.trim()}
                  sendPending={send.isPending}
                  enableFileAttach
                  fileSendPending={isUploading}
                  replyTo={
                    replyTarget
                      ? {
                          label: resolveMessageSenderLabel(
                            replyTarget,
                            Boolean(user?.id && replyTarget.senderId === user.id),
                            'admin'
                          ),
                          preview: previewMessageContent(replyTarget),
                        }
                      : null
                  }
                  onCancelReply={() => setReplyToId(null)}
                  onSendFile={async (file, caption) => {
                    const result = await uploadAsync({ file, threadId });
                    await apiServices.messaging.sendChatThreadMessage(threadId, {
                      mediaId: result.mediaId,
                      type: 'FILE',
                      ...(caption ? { content: caption } : {}),
                      ...(replyToId ? { replyToId } : {}),
                    });
                    setReplyToId(null);
                    invalidateFromRealtime();
                  }}
                />
              </div>
            }
          >
            {timeline.map((item, index) => {
              if (item.kind === 'separator') {
                return (
                  <MessageMembershipDivider
                    key={item.id}
                    label={item.label}
                    variant={item.variant}
                  />
                );
              }

              const m = item.message;
              if (isGroupSystemMessage(m)) {
                return (
                  <MessageMembershipDivider
                    key={m.id}
                    label={resolveGroupSystemMessageLabel(m, members, user?.id)}
                    variant={resolveGroupSystemMessageVariant(m)}
                  />
                );
              }

              const mine = Boolean(user?.id && m.senderId === user.id);
              const variant = mine ? 'sent' : 'received';
              const flagged = isMessageFlagged(m);
              const senderLabel = resolveMessageSenderLabel(m, mine, 'admin');
              const prevMessage = findPreviousMessageInTimeline(timeline, index);
              const showHeader = shouldShowMessageHeader(m, prevMessage, { isGroup });
              const day = messageDayKey(m.createdAt);
              const showDayDivider = day !== previousDay;
              previousDay = day;
              const isEditing = editingMessageId === m.id;

              return (
                <span key={m.id} className="contents">
                  {showDayDivider ? (
                    <MessageDateDivider label={formatMessageDayLabel(m.createdAt)} />
                  ) : null}
                  <MessageBubble
                    variant={variant}
                    senderLabel={senderLabel}
                    showHeader={showHeader}
                    timeLabel={formatMessageTime(m.createdAt)}
                    createdAt={m.createdAt}
                    readStatus={resolveSentMessageReadStatus(m, timelineMessages, user?.id, {
                      isGroup,
                      recipientCount: memberCount,
                    })}
                    readLabel={
                      isGroup ? resolveGroupReadLabel(m, user?.id, memberCount) : undefined
                    }
                    quote={
                      m.replyToId ? (
                        <>
                          <p className="msg-quote-label">
                            {(() => {
                              const parent = timelineMessages.find(
                                (item) => item.id === m.replyToId
                              );
                              return parent
                                ? resolveMessageSenderLabel(
                                    parent,
                                    Boolean(user?.id && parent.senderId === user.id),
                                    'admin'
                                  )
                                : 'Reply';
                            })()}
                          </p>
                          <p className="msg-quote-preview">
                            {(() => {
                              const parent = timelineMessages.find(
                                (item) => item.id === m.replyToId
                              );
                              return parent ? previewMessageContent(parent) : 'Original message';
                            })()}
                          </p>
                        </>
                      ) : undefined
                    }
                    actions={
                      isEditing ? undefined : (
                        <>
                          <MessageActionButton variant={variant} onClick={() => setReplyToId(m.id)}>
                            Reply
                          </MessageActionButton>
                          {!mine && !isGroupSystemMessage(m) ? (
                            <MessageActionButton
                              variant={variant}
                              disabled={flagged || flagMessageM.isPending}
                              onClick={async () => {
                                if (flagged) return;
                                const { confirmed } = await confirm({
                                  title: 'Flag message for review?',
                                  description:
                                    'This sends the message to the moderation queue for an operator to review.',
                                  confirmLabel: 'Flag',
                                });
                                if (confirmed) flagMessageM.mutate(m.id);
                              }}
                            >
                              {flagged ? 'Flagged' : 'Flag'}
                            </MessageActionButton>
                          ) : null}
                          {mine && m.type !== 'FILE' ? (
                            <>
                              <MessageActionButton
                                variant={variant}
                                onClick={() => {
                                  setEditingMessageId(m.id);
                                  setEditText(m.content ?? '');
                                }}
                              >
                                Edit
                              </MessageActionButton>
                              <MessageActionButton
                                variant={variant}
                                disabled={deleteMessageM.isPending}
                                onClick={async () => {
                                  const { confirmed } = await confirm({
                                    title: 'Delete message?',
                                    description: 'This cannot be undone.',
                                    confirmLabel: 'Delete',
                                    destructive: true,
                                  });
                                  if (confirmed) deleteMessageM.mutate(m.id);
                                }}
                              >
                                Delete
                              </MessageActionButton>
                            </>
                          ) : null}
                        </>
                      )
                    }
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                          placeholder="Edit your message"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={!editText.trim() || patchMessageM.isPending}
                            onClick={() => patchMessageM.mutate()}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditText('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <ModeratedMessageBody message={m}>
                        {m.type === 'FILE' ? (
                          <AdminFileMessageBubble content={m.content} mine={mine} />
                        ) : isGroup && members?.length && !isGroupSystemMessage(m) ? (
                          <MessageMentionText content={m.content ?? ''} members={members} />
                        ) : (
                          <p className="whitespace-pre-wrap">
                            {resolveRenderableMessageContent(m, members, user?.id)}
                          </p>
                        )}
                      </ModeratedMessageBody>
                    )}
                  </MessageBubble>
                </span>
              );
            })}
          </MessageThreadPanel>
        </div>
      </MessagingSplitWorkspace>
    </MessagingWorkspaceChrome>
  );
}
