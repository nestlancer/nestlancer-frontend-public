'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import { Button } from '@nestlancer/ui';

import { apiServices } from '@/lib/axios';

export function ClientThreadActionsPanel({
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

  const globallyArchived = Boolean(detailQ.data?.archivedAt);
  const userArchived = Boolean(detailQ.data?.userArchivedAt);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.messages.conversations });
    void qc.invalidateQueries({ queryKey: queryKeys.messages.chatThreadDetail(threadId) });
  };

  const archive = useMutation({
    mutationFn: () => apiServices.messaging.userArchiveChatThread(threadId),
    onSuccess: () => {
      toast.success(`${threadLabel} archived`);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not archive')),
  });

  const unarchive = useMutation({
    mutationFn: () => apiServices.messaging.userUnarchiveChatThread(threadId),
    onSuccess: () => {
      toast.success(`${threadLabel} restored to inbox`);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not restore')),
  });

  const hide = useMutation({
    mutationFn: () => apiServices.messaging.userHideChatThread(threadId),
    onSuccess: () => {
      toast.success(`${threadLabel} removed from your inbox`);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not delete')),
  });

  const handleDelete = () => {
    if (
      !window.confirm(
        `Delete this ${threadLabel} from your inbox? Support will still have the full conversation on their side.`
      )
    ) {
      return;
    }
    hide.mutate();
  };

  const pending = archive.isPending || unarchive.isPending || hide.isPending;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Chat actions
      </p>
      {globallyArchived ? (
        <p className="mt-2 text-xs text-muted-foreground">
          This {threadLabel} was archived by support and is read-only.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {userArchived ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled={pending}
              onClick={() => unarchive.mutate()}
            >
              Move to inbox
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled={pending}
              onClick={() => archive.mutate()}
            >
              Archive {threadLabel}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            Delete {threadLabel}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Archive keeps the chat in your Archived tab. Delete removes it from your inbox only —
            support still has the full record.
          </p>
        </div>
      )}
    </div>
  );
}
