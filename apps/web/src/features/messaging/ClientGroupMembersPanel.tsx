'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import { Button, GroupInfoPanel, resolveGroupThreadTitle } from '@nestlancer/ui';

import { apiServices } from '@/lib/axios';

export function ClientGroupMembersPanel({
  threadId,
  title,
}: {
  threadId: string;
  title?: string | null;
}) {
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: queryKeys.messages.chatThreadDetail(threadId),
    queryFn: () => apiServices.messaging.getChatThread(threadId),
  });

  const membershipStatus = detailQ.data?.membershipStatus ?? 'ACTIVE';

  const leave = useMutation({
    mutationFn: () => apiServices.messaging.leaveChatThread(threadId),
    onSuccess: () => {
      toast.success('You left the group — your message history is saved here');
      void qc.invalidateQueries({ queryKey: queryKeys.messages.conversations });
      void qc.invalidateQueries({ queryKey: queryKeys.messages.chatThread(threadId) });
      void qc.invalidateQueries({ queryKey: queryKeys.messages.chatThreadDetail(threadId) });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not leave group')),
  });

  const members = detailQ.data?.members ?? [];
  const clientCount = members.filter((m) => m.user.role === 'USER').length;
  const canLeave = membershipStatus === 'ACTIVE' && clientCount > 1;
  const isReadOnly = membershipStatus === 'LEFT' || membershipStatus === 'REMOVED';
  const displayTitle = resolveGroupThreadTitle(
    { kind: 'THREAD', id: threadId, threadId, threadType: 'GROUP', title },
    members
  );

  const handleLeave = () => {
    if (!canLeave) return;
    if (
      !window.confirm(
        'Leave this group? You will keep messages from while you were a member, but will not receive new ones unless you are added back.'
      )
    ) {
      return;
    }
    leave.mutate();
  };

  return (
    <GroupInfoPanel
      members={members}
      isLoading={detailQ.isPending}
      error={detailQ.isError ? getApiErrorMessage(detailQ.error, 'Could not load members') : null}
      title={displayTitle}
      manageSlot={
        <div className="space-y-2">
          {isReadOnly ? (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {membershipStatus === 'REMOVED'
                ? 'You were removed from this group. Past messages are shown below (read-only).'
                : 'You left this group. Past messages are shown below (read-only).'}
            </div>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                disabled={leave.isPending || !canLeave}
                onClick={handleLeave}
              >
                Leave group
              </Button>
              {!canLeave && clientCount > 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  You are the only client in this group — ask your admin to archive it instead.
                </p>
              ) : null}
            </>
          )}
        </div>
      }
    />
  );
}
