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
  MessageThreadHeader,
  MessageThreadPanel,
  MessagingSplitWorkspace,
  MessagingWorkspaceChrome,
  ModeratedMessageBody,
  Skeleton,
  SkeletonText,
  cn,
  formatMessageDayLabel,
  formatMessageTime,
  isMessageFlagged,
  isMessagePinned,
  messageDayKey,
  messageSenderInitials,
  messagingPanelClass,
  messagingThreadFillClass,
  resolveMessageSenderLabel,
  resolvePeerDisplayName,
  shouldShowMessageHeader,
} from '@nestlancer/ui';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { apiServices } from '@/lib/axios';
import { AdminFileMessageBubble } from './AdminMessageFileAttachment';
import { AdminInboxQueuePane } from './AdminInboxQueuePane';
import { ConversationSearchSidebar } from './ConversationSearchSidebar';
import { useMediaUpload } from '@/hooks/useMediaUpload';

const wsOrigin = typeof process !== 'undefined' ? resolvePublicWsUrl() : '';

const QUICK_REPLIES = ['Samples look great', 'Request revision', 'Will coordinate dates'];

export function AdminProjectThreadClient({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
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
    void qc.invalidateQueries({ queryKey: queryKeys.messages.thread(projectId) });
    void qc.invalidateQueries({ queryKey: queryKeys.messages.conversations });
  }, [qc, projectId]);

  useMessagingRoom({
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
    onSuccess: () => {
      setText('');
      setReplyToId(null);
      void qc.invalidateQueries({ queryKey: queryKeys.messages.thread(projectId) });
      void qc.invalidateQueries({ queryKey: queryKeys.messages.conversations });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Send failed')),
  });

  const markRead = useMutation({
    mutationFn: () => apiServices.messaging.markProjectRead(projectId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.messages.unread });
    },
    onError: () => {},
  });

  const broadcastM = useMutation({
    mutationFn: () =>
      apiServices.admin.broadcastSystemMessage(projectId, {
        content: broadcastText.trim(),
      }),
    onSuccess: () => {
      toast.success('System message broadcast');
      setBroadcastText('');
      void qc.invalidateQueries({ queryKey: queryKeys.messages.thread(projectId) });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Broadcast failed')),
  });

  const pinM = useMutation({
    mutationFn: (messageId: string) => apiServices.messaging.pinMessage(messageId),
    onSuccess: () => {
      toast.success('Message pinned');
      void qc.invalidateQueries({ queryKey: queryKeys.messages.thread(projectId) });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not pin message')),
  });

  const unpinM = useMutation({
    mutationFn: (messageId: string) => apiServices.messaging.unpinMessage(messageId),
    onSuccess: () => {
      toast.success('Message unpinned');
      void qc.invalidateQueries({ queryKey: queryKeys.messages.thread(projectId) });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not unpin message')),
  });

  const flagMessageM = useMutation({
    mutationFn: (messageId: string) => apiServices.messaging.flagMessage(messageId),
    onSuccess: () => {
      toast.success('Message flagged for moderation');
      void qc.invalidateQueries({ queryKey: queryKeys.messages.thread(projectId) });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not flag message')),
  });

  const patchMessageM = useMutation({
    mutationFn: () => {
      if (!editingMessageId) throw new Error('No message selected');
      return apiServices.messaging.patchMessage(editingMessageId, { content: editText.trim() });
    },
    onSuccess: () => {
      setEditingMessageId(null);
      setEditText('');
      void qc.invalidateQueries({ queryKey: queryKeys.messages.thread(projectId) });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not edit message')),
  });

  const deleteMessageM = useMutation({
    mutationFn: (messageId: string) => apiServices.messaging.deleteMessage(messageId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.messages.thread(projectId) });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not delete message')),
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

  const chronological = [...(thread.data?.items ?? [])].reverse();
  const items = [
    ...chronological.filter((m) => isMessagePinned(m)),
    ...chronological.filter((m) => !isMessagePinned(m)),
  ];
  const replyTarget = replyToId ? items.find((m) => m.id === replyToId) : undefined;
  const conversation = conversationsQ.data?.items.find((c) => c.projectId === projectId);
  const peerName = resolvePeerDisplayName(items, user?.id);
  const projectTitle = conversation?.title?.trim();
  const headerTitle = peerName || projectTitle || 'Project messages';
  const headerSubtitle = projectTitle ? `Project thread · ${projectTitle}` : 'Project conversation';
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
        context={<ConversationSearchSidebar projectId={projectId} />}
      >
        <div className={cn(messagingThreadFillClass)}>
          <MessageThreadPanel
            embedded
            itemCount={items.length}
            resetKey={projectId}
            className="min-h-0 flex-1"
            header={
              <>
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
                />
                <div className="border-b border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 dark:from-amber-950/30 dark:to-orange-950/20">
                  <div className="flex items-center gap-2">
                    <span className="text-sm" aria-hidden>
                      📢
                    </span>
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      System broadcast
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    One-way notice — clients cannot reply.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="project-broadcast-message"
                      name="broadcastMessage"
                      value={broadcastText}
                      onChange={(e) => setBroadcastText(e.target.value)}
                      className="h-8 min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-2.5 text-xs outline-none focus:ring-2 focus:ring-amber-300 dark:border-amber-800 dark:bg-background"
                      placeholder="Site visit confirmed Thursday 2pm"
                      aria-label="System broadcast message"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 bg-amber-600 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
                      disabled={!broadcastText.trim() || broadcastM.isPending}
                      onClick={async () => {
                        const { confirmed } = await confirm({
                          title: 'Broadcast system message',
                          description:
                            'Send this as an official system notice to the project thread?',
                          confirmLabel: 'Broadcast',
                        });
                        if (!confirmed) return;
                        broadcastM.mutate();
                      }}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </>
            }
            emptyState={
              <li className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                <p className="text-sm font-medium text-foreground">No messages yet</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Start the project conversation with your client.
                </p>
              </li>
            }
            composer={
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
              const pinned = isMessagePinned(m);
              const flagged = isMessageFlagged(m);
              const isEditing = editingMessageId === m.id;
              const senderLabel = resolveMessageSenderLabel(m, mine, 'admin');
              const showHeader = shouldShowMessageHeader(m, items[index - 1]);
              const day = messageDayKey(m.createdAt);
              const showDayDivider = day !== previousDay;
              previousDay = day;
              const parent = m.replyToId
                ? items.find((item) => item.id === m.replyToId)
                : undefined;

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
                    quote={
                      m.replyToId ? (
                        <>
                          <p className="msg-quote-label">
                            {parent
                              ? resolveMessageSenderLabel(
                                  parent,
                                  Boolean(user?.id && parent.senderId === user.id),
                                  'admin'
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
                          <MessageActionButton variant={variant} onClick={() => setReplyToId(m.id)}>
                            Reply
                          </MessageActionButton>
                          <MessageActionButton
                            variant={variant}
                            disabled={pinM.isPending || unpinM.isPending}
                            onClick={() => (pinned ? unpinM.mutate(m.id) : pinM.mutate(m.id))}
                          >
                            {pinned ? 'Unpin' : 'Pin'}
                          </MessageActionButton>
                          {!mine ? (
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
                      ) : undefined
                    }
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
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
                          <AdminFileMessageBubble content={m.content} mine={mine} />
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
      </MessagingSplitWorkspace>
    </MessagingWorkspaceChrome>
  );
}
