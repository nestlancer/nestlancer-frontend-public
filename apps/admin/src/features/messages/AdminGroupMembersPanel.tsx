'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import type { ChatThreadMember } from '@nestlancer/types';
import { Button, GroupInfoPanel, formatMemberName } from '@nestlancer/ui';

import { UserSearchCombobox, type UserOption } from '@/components/admin/UserSearchCombobox';
import { apiServices } from '@/lib/axios';

export function AdminGroupMembersPanel({ threadId }: { threadId: string }) {
  const qc = useQueryClient();
  const [titleDraft, setTitleDraft] = useState<string | undefined>(undefined);
  const [addUsers, setAddUsers] = useState<UserOption[]>([]);

  const detailQ = useQuery({
    queryKey: queryKeys.messages.chatThreadDetail(threadId),
    queryFn: () => apiServices.messaging.getChatThread(threadId),
  });

  const members = detailQ.data?.members ?? [];
  const displayTitle = titleDraft ?? detailQ.data?.title ?? '';
  const isArchived = Boolean(detailQ.data?.archivedAt);
  const clientCount = members.filter((m) => m.user.role === 'USER').length;
  const canRemoveClients = !isArchived && clientCount > 1;

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.messages.chatThreadDetail(threadId) });
    void qc.invalidateQueries({ queryKey: queryKeys.messages.chatThreadMembers(threadId) });
    void qc.invalidateQueries({ queryKey: queryKeys.messages.conversations });
  };

  const saveTitle = useMutation({
    mutationFn: () =>
      apiServices.messaging.updateChatThread(threadId, { title: displayTitle.trim() }),
    onSuccess: () => {
      toast.success('Group title updated');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update title')),
  });

  const addMembers = useMutation({
    mutationFn: () =>
      apiServices.messaging.addChatThreadMembers(threadId, {
        clientUserIds: addUsers.map((u) => u.id),
      }),
    onSuccess: () => {
      toast.success('Members added');
      setAddUsers([]);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not add members')),
  });

  const removeMember = useMutation({
    mutationFn: (memberUserId: string) =>
      apiServices.messaging.removeChatThreadMember(threadId, memberUserId),
    onSuccess: () => {
      toast.success('Member removed');
      invalidate();
      void qc.invalidateQueries({ queryKey: queryKeys.messages.chatThread(threadId) });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not remove member')),
  });

  const handleRemoveMember = (member: ChatThreadMember) => {
    if (!canRemoveClients) return;
    const name = formatMemberName(member);
    if (
      !window.confirm(`Remove ${name} from this group? They will lose access to the conversation.`)
    ) {
      return;
    }
    removeMember.mutate(member.userId);
  };

  const archive = useMutation({
    mutationFn: () => apiServices.messaging.archiveChatThread(threadId),
    onSuccess: () => {
      toast.success('Group archived');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not archive group')),
  });

  const unarchive = useMutation({
    mutationFn: () => apiServices.messaging.unarchiveChatThread(threadId),
    onSuccess: () => {
      toast.success('Group restored');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not restore group')),
  });

  const existingIds = new Set(members.map((m) => m.userId));

  return (
    <GroupInfoPanel
      members={members}
      isLoading={detailQ.isPending}
      error={detailQ.isError ? getApiErrorMessage(detailQ.error, 'Could not load members') : null}
      title={displayTitle}
      editableTitle
      onTitleChange={setTitleDraft}
      onSaveTitle={() => saveTitle.mutate()}
      saveTitlePending={saveTitle.isPending}
      manageSlot={
        <div className="space-y-3">
          {isArchived ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              This group is archived and hidden from the inbox.
            </div>
          ) : null}
          <div className="flex gap-2">
            {isArchived ? (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={unarchive.isPending}
                onClick={() => unarchive.mutate()}
              >
                Restore group
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={archive.isPending}
                onClick={() => archive.mutate()}
              >
                Archive group
              </Button>
            )}
          </div>
          {!isArchived && clientCount <= 1 && clientCount > 0 ? (
            <p className="text-[11px] text-muted-foreground">
              This group has only one client — archive the group instead of removing them.
            </p>
          ) : null}
          {!isArchived ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Add members
              </p>
              <UserSearchCombobox
                mode="multi"
                values={addUsers}
                onChange={(users) => setAddUsers(users.filter((u) => !existingIds.has(u.id)))}
                roleFilter="USER"
                placeholder="Search clients to add…"
              />
              <Button
                size="sm"
                className="w-full"
                disabled={addMembers.isPending || addUsers.length === 0}
                onClick={() => addMembers.mutate()}
              >
                Add to group
              </Button>
            </>
          ) : null}
        </div>
      }
      memberActions={(member: ChatThreadMember) =>
        member.user.role === 'USER' ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            disabled={removeMember.isPending || !canRemoveClients}
            onClick={() => handleRemoveMember(member)}
          >
            Remove
          </Button>
        ) : null
      }
    />
  );
}
