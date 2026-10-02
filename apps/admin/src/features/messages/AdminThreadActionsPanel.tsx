'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import { Button } from '@nestlancer/ui';

import { apiServices } from '@/lib/axios';

export function AdminThreadActionsPanel({
  threadId,
  threadLabel = 'chat',
}: {
  threadId: string;
  threadLabel?: string;
}) {
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: queryKeys.messages.chatThreadDetail(threadId),
    queryFn: () => apiServices.messaging.getChatThread(threadId),
  });

  const isArchived = Boolean(detailQ.data?.archivedAt);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.messages.conversations });
    void qc.invalidateQueries({ queryKey: queryKeys.messages.chatThreadDetail(threadId) });
  };

  const archive = useMutation({
    mutationFn: () => apiServices.messaging.archiveChatThread(threadId),
    onSuccess: () => {
      toast.success(`${threadLabel} archived`);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not archive')),
  });

  const unarchive = useMutation({
    mutationFn: () => apiServices.messaging.unarchiveChatThread(threadId),
    onSuccess: () => {
      toast.success(`${threadLabel} restored`);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not restore')),
  });

  const pending = archive.isPending || unarchive.isPending;

  return (
    <div className="inbox-context-card">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Chat actions
      </p>
      {isArchived ? (
        <div className="mt-2 space-y-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            This {threadLabel} is archived and hidden from the inbox.
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={() => unarchive.mutate()}
          >
            Restore {threadLabel}
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={() => archive.mutate()}
          >
            Archive {threadLabel}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Admins can archive conversations but cannot delete them. Archived chats move to the
            Archived tab.
          </p>
        </div>
      )}
    </div>
  );
}
