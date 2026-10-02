'use client';

import { resolvePublicWsUrl } from '@nestlancer/config';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@nestlancer/ui';

import { useWebConfirm } from '@/components/web/WebConfirmProvider';

import { getApiErrorMessage, previewMessageContent } from '@nestlancer/api-client';
import { getAccessToken, subscribeToTokens, useAuth } from '@nestlancer/auth';
import { queryKeys, routes } from '@nestlancer/constants';
import { useMessagingRoom, usePresence } from '@nestlancer/websocket';
import {
  Button,
  ErrorState,
  MessageActionButton,
  MessageBubble,
  MessageComposer,
  MessageDateDivider,
  MessageThreadHeader,
  MessageThreadPanel,
  MessagingSplitWorkspace,
  MessagingWorkspaceChrome,
  ModeratedMessageBody,
  messageSenderInitials,
  Skeleton,
  SkeletonText,
  formatMessageDayLabel,
  formatMessageTime,
  isMessageFlagged,
  isMessagePinned,
  messageDayKey,
  messagingThreadFillClass,
  resolveMessageSenderLabel,
  resolvePeerDisplayName,
  resolveSentMessageReadStatus,
  shouldShowMessageHeader,
  cn,
} from '@nestlancer/ui';

import { apiServices } from '@/lib/axios';
import { invalidateByAction } from '@/lib/invalidate-queries';
import { ClientInboxQueuePane } from './ClientInboxQueuePane';
import { FileMessageBubble } from './MessageFileAttachment';
import { ConversationSearchSidebar } from './ConversationSearchSidebar';
import { conversationIsUnread } from './conversation-utils';
import { useMediaUpload } from '@/features/media/hooks/useMediaUpload';

const wsOrigin = typeof process !== 'undefined' ? resolvePublicWsUrl() : '';

export function MessageThreadClient({
  projectId,
  layout = 'workspace',
}: {
  projectId: string;
  /** `workspace` = full-page 3-pane messaging UI; `embedded` = thread only (project hub). */
  layout?: 'workspace' | 'embedded';
}) {
  const qc = useQueryClient();
  const confirm = useWebConfirm();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | undefined>(
    () => getAccessToken() ?? undefined
  );
  const markedReadRef = useRef(false);
  const { uploadAsync, isUploading } = useMediaUpload();

  useEffect(() => {
    setAccessToken(getAccessToken() ?? undefined);
    return subscribeToTokens((t) => setAccessToken(t?.accessToken ?? undefined));
  }, []);

  useEffect(() => {
    if (layout !== 'workspace') return;
    document.body.classList.add('client-messages-inbox-page');
    return () => document.body.classList.remove('client-messages-inbox-page');
  }, [layout]);

  const invalidateFromRealtime = useCallback(() => {
    void qc.invalidateQueries({ queryKey: queryKeys.messages.thread(projectId) });
    void qc.invalidateQueries({ queryKey: queryKeys.messages.conversations });
  }, [qc, projectId]);

  const { typingUsers, emitTyping } = useMessagingRoom({
    wsUrl: wsOrigin,
    accessToken,
    socketPath: process.env.NEXT_PUBLIC_SOCKET_IO_PATH,
    projectId,
    enabled: Boolean(accessToken && wsOrigin),
    onMessageNew: invalidateFromRealtime,
  });

  const thread = useQuery({
    queryKey: queryKeys.messages.thread(projectId),
    queryFn: () => apiServices.messaging.projectMessages(projectId),
  });

  const conversationsQ = useQuery({
    queryKey: queryKeys.messages.conversations,
    queryFn: () => apiServices.messaging.conversations(),
  });

  const send = useMutation({
    mutationFn: () =>
      apiServices.messaging.sendProjectMessage(projectId, {
        content: text.trim(),
        ...(replyToId ? { replyToId } : {}),
      }),
    onSuccess: async () => {
      setText('');
      setReplyToId(null);
      await invalidateByAction(qc, 'messages.send', projectId);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Send failed')),
  });

  const markRead = useMutation({
    mutationFn: () => apiServices.messaging.markProjectRead(projectId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.messages.unread });
      void qc.invalidateQueries({ queryKey: queryKeys.messages.conversations });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
    onError: (err: unknown) => {
      console.warn('[MessageThreadClient] markRead failed:', err);
    },
  });

  const patchMessageM = useMutation({
    mutationFn: () => {
      if (!editingMessageId) throw new Error('No message selected');
      return apiServices.messaging.patchMessage(editingMessageId, { content: editText.trim() });
    },
    onSuccess: async () => {
      setEditingMessageId(null);
      setEditText('');
      await invalidateByAction(qc, 'messages.send', projectId);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not edit message')),
  });

  const deleteMessageM = useMutation({
    mutationFn: (messageId: string) => apiServices.messaging.deleteMessage(messageId),
    onSuccess: async () => {
      await invalidateByAction(qc, 'messages.send', projectId);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not delete message')),
  });

  const pinM = useMutation({
    mutationFn: (messageId: string) => apiServices.messaging.pinMessage(messageId),
    onSuccess: async () => {
      await invalidateByAction(qc, 'messages.send', projectId);
      toast.success('Message pinned');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not pin message')),
  });

  const unpinM = useMutation({
    mutationFn: (messageId: string) => apiServices.messaging.unpinMessage(messageId),
    onSuccess: async () => {
      await invalidateByAction(qc, 'messages.send', projectId);
      toast.success('Message unpinned');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not unpin message')),
  });

  const flagMessageM = useMutation({
    mutationFn: (messageId: string) => apiServices.messaging.flagMessage(messageId),
    onSuccess: async () => {
      toast.success('Message flagged for review');
      await invalidateByAction(qc, 'messages.send', projectId);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not flag message')),
  });

  const loadedItems = thread.data?.items ?? [];
  const replyTarget = replyToId ? loadedItems.find((m) => m.id === replyToId) : undefined;
  const peerUserId = loadedItems.find((m) => m.senderId && m.senderId !== user?.id)?.senderId;
  const isOnline = usePresence(peerUserId);

  const conversation = conversationsQ.data?.items.find((c) => c.projectId === projectId);

  useEffect(() => {
    markedReadRef.current = false;
  }, [projectId]);

  useEffect(() => {
    if (!conversation || !conversationIsUnread(conversation)) return;
    if (markedReadRef.current || markRead.isPending) return;
    markedReadRef.current = true;
    markRead.mutate();
  }, [conversation, markRead, projectId]);

  if (thread.isPending) {
    return (
      <div className="flex h-full min-h-[24rem] flex-col gap-3 p-4">
        <Skeleton className="h-8 w-48" />
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

  const chronological = [...loadedItems].reverse();
  const items = [
    ...chronological.filter((m) => isMessagePinned(m)),
    ...chronological.filter((m) => !isMessagePinned(m)),
  ];
  const peerName = resolvePeerDisplayName(items, user?.id);
  const projectTitle = conversation?.title?.trim();
  const headerTitle = projectTitle || 'Project messages';
  const headerSubtitle = isOnline
    ? peerName
      ? `${peerName} is online — replies are instant.`
      : 'Admin is online — replies are instant.'
    : peerName
      ? `Chat with ${peerName} about this project.`
      : 'Chat with your admin about this project.';
  let previousDay = '';

  const threadBody = (
    <div className={cn(messagingThreadFillClass, layout === 'embedded' && 'min-h-[28rem]')}>
      <MessageThreadPanel
        embedded
        itemCount={items.length}
        resetKey={projectId}
        className="h-full"
        header={
          <MessageThreadHeader
            variant="aurora"
            title={headerTitle}
            subtitle={headerSubtitle}
            initials={messageSenderInitials(peerName ?? headerTitle)}
            online={isOnline}
            backHref={layout === 'workspace' ? routes.messagesInbox : undefined}
            onMarkRead={() => markRead.mutate()}
            markReadPending={markRead.isPending}
          />
        }
        statusBar={
          typingUsers.length > 0 ? (
            <div className="border-t border-border bg-card/90 px-5 py-2.5 text-xs text-muted-foreground backdrop-blur-sm">
              <span className="inline-flex items-center gap-2.5">
                <span className="flex gap-1">
                  <span className="typing-dot h-2 w-2 rounded-full bg-primary/60" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-primary/60" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-primary/60" />
                </span>
                <span className="font-medium">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
                </span>
              </span>
            </div>
          ) : null
        }
        emptyState={
          <li className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-foreground">No messages yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Ask a question about your project — we will reply here.
            </p>
          </li>
        }
        composer={
          <MessageComposer
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
            replyTo={
              replyTarget
                ? {
                    label: resolveMessageSenderLabel(
                      replyTarget,
                      Boolean(user?.id && replyTarget.senderId === user.id),
                      'client'
                    ),
                    preview: previewMessageContent(replyTarget),
                  }
                : null
            }
            onCancelReply={() => setReplyToId(null)}
            onSendFile={async (file, caption) => {
              const result = await uploadAsync({ file, projectId });
              await apiServices.messaging.sendProjectMessage(projectId, {
                mediaId: result.mediaId,
                type: 'FILE',
                ...(caption ? { content: caption } : {}),
                ...(replyToId ? { replyToId } : {}),
              });
              setReplyToId(null);
              void qc.invalidateQueries({ queryKey: queryKeys.messages.thread(projectId) });
              void qc.invalidateQueries({ queryKey: queryKeys.messages.conversations });
            }}
          />
        }
      >
        {items.map((m, index) => {
          const mine = Boolean(user?.id && m.senderId === user.id);
          const variant = mine ? 'sent' : 'received';
          const isEditing = editingMessageId === m.id;
          const pinned = isMessagePinned(m);
          const flagged = isMessageFlagged(m);
          const senderLabel = resolveMessageSenderLabel(m, mine, 'client');
          const showHeader = shouldShowMessageHeader(m, items[index - 1]);
          const day = messageDayKey(m.createdAt);
          const showDayDivider = day !== previousDay;
          previousDay = day;
          const parent = m.replyToId ? items.find((item) => item.id === m.replyToId) : undefined;

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
                pinned={pinned}
                readStatus={resolveSentMessageReadStatus(m, items, user?.id)}
                quote={
                  m.replyToId ? (
                    <>
                      <p className="msg-quote-label">
                        {parent
                          ? resolveMessageSenderLabel(
                              parent,
                              Boolean(user?.id && parent.senderId === user.id),
                              'client'
                            )
                          : 'Reply'}
                      </p>
                      <p className="msg-quote-preview">
                        {parent ? previewMessageContent(parent) : 'Original message'}
                      </p>
                    </>
                  ) : undefined
                }
                actions={
                  !isEditing ? (
                    <>
                      <MessageActionButton
                        variant={mine ? 'sent' : 'received'}
                        onClick={() => setReplyToId(m.id)}
                      >
                        Reply
                      </MessageActionButton>
                      <MessageActionButton
                        variant={mine ? 'sent' : 'received'}
                        disabled={pinM.isPending || unpinM.isPending}
                        onClick={() => (pinned ? unpinM.mutate(m.id) : pinM.mutate(m.id))}
                      >
                        {pinned ? 'Unpin' : 'Pin'}
                      </MessageActionButton>
                      {!mine ? (
                        <MessageActionButton
                          variant={mine ? 'sent' : 'received'}
                          disabled={flagged || flagMessageM.isPending}
                          onClick={async () => {
                            if (flagged) return;
                            if (
                              await confirm({
                                title: 'Flag message for review?',
                                description:
                                  'This reports the message to Nestlancer operators for moderation.',
                                confirmLabel: 'Flag',
                              })
                            ) {
                              flagMessageM.mutate(m.id);
                            }
                          }}
                        >
                          {flagged ? 'Flagged' : 'Flag'}
                        </MessageActionButton>
                      ) : null}
                      {mine && m.type !== 'FILE' ? (
                        <>
                          <MessageActionButton
                            variant="sent"
                            onClick={() => {
                              setEditingMessageId(m.id);
                              setEditText(m.content ?? '');
                            }}
                          >
                            Edit
                          </MessageActionButton>
                          <MessageActionButton
                            variant="sent"
                            disabled={deleteMessageM.isPending}
                            onClick={async () => {
                              if (
                                await confirm({
                                  title: 'Delete message?',
                                  description: 'This cannot be undone.',
                                  destructive: true,
                                })
                              ) {
                                deleteMessageM.mutate(m.id);
                              }
                            }}
                          >
                            Delete
                          </MessageActionButton>
                        </>
                      ) : null}
                    </>
                  ) : undefined
                }
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="Edit your message"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!editText.trim() || patchMessageM.isPending}
                        onClick={() => patchMessageM.mutate()}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingMessageId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ModeratedMessageBody message={m}>
                    {m.type === 'FILE' ? (
                      <FileMessageBubble content={m.content} mine={mine} />
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </ModeratedMessageBody>
                )}
              </MessageBubble>
            </span>
          );
        })}
      </MessageThreadPanel>
    </div>
  );

  if (layout === 'embedded') {
    return (
      <div className="grid h-full min-h-[28rem] gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        {threadBody}
        <aside className="hidden min-h-0 flex-col gap-3 lg:flex">
          <ConversationSearchSidebar projectId={projectId} />
        </aside>
      </div>
    );
  }

  return (
    <MessagingWorkspaceChrome
      title="Messages"
      description={headerSubtitle}
      actions={
        <Button size="sm" variant="outline" asChild>
          <a href={routes.messagesInbox}>Panel</a>
        </Button>
      }
    >
      <MessagingSplitWorkspace
        queue={<ClientInboxQueuePane />}
        context={<ConversationSearchSidebar projectId={projectId} />}
      >
        {threadBody}
      </MessagingSplitWorkspace>
    </MessagingWorkspaceChrome>
  );
}
