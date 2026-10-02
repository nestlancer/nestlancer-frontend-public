'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';
import { getApiErrorMessage } from '@nestlancer/api-client';
import { Button, cn } from '@nestlancer/ui';
import { formatMoneyFromPaise } from '@nestlancer/utils';

import { useMediaUpload } from '@/features/media/hooks/useMediaUpload';
import { apiServices } from '@/lib/axios';
import { invalidateByAction } from '@/lib/invalidate-queries';

type PlatformAccount = {
  id: string;
  label: string;
  type: string;
  accountHolderName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifsc?: string | null;
  upiVpa?: string | null;
  instructions?: string | null;
  isPrimary?: boolean;
};

export function OfflineBankTransferPanel({
  amount,
  currency = 'INR',
  projectId,
  milestoneId,
  onSuccess,
  className,
}: {
  amount: number;
  currency?: string;
  projectId: string;
  milestoneId: string;
  onSuccess?: () => void;
  className?: string;
}) {
  const qc = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [transferReference, setTransferReference] = useState('');
  const [notes, setNotes] = useState('');
  const [mediaIds, setMediaIds] = useState<string[]>([]);

  const accountsQ = useQuery({
    queryKey: ['payments', 'platform-accounts'],
    queryFn: () => apiServices.payments.listPlatformAccounts(),
  });

  const accounts = useMemo(() => (accountsQ.data ?? []) as PlatformAccount[], [accountsQ.data]);
  const activeAccountId =
    selectedAccountId ?? accounts.find((a) => a.isPrimary)?.id ?? accounts[0]?.id;

  const { uploadAsync, isUploading } = useMediaUpload();

  const submitM = useMutation({
    mutationFn: () =>
      apiServices.payments.submitBankTransfer({
        projectId,
        milestoneId,
        amount,
        platformAccountId: activeAccountId!,
        transferReference: transferReference.trim(),
        mediaIds,
        notes: notes.trim() || undefined,
      }),
    onSuccess: async () => {
      toast.success('Transfer submitted — awaiting admin verification');
      await invalidateByAction(qc, 'payments.confirm', undefined, projectId);
      void qc.invalidateQueries({ queryKey: ['payments'] });
      onSuccess?.();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not submit transfer')),
  });

  const selected = useMemo(
    () => accounts.find((a) => a.id === activeAccountId) ?? null,
    [accounts, activeAccountId]
  );

  const formatted = formatMoneyFromPaise(amount, currency, currency === 'INR' ? 'en-IN' : 'en-US');
  const canSubmit =
    Boolean(activeAccountId) &&
    transferReference.trim().length >= 4 &&
    mediaIds.length > 0 &&
    !submitM.isPending &&
    !isUploading;

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <p className="text-sm font-medium text-foreground">Pay {formatted} via bank / UPI</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Transfer to a Nestlancer account below, then upload your receipt and UTR for verification.
        </p>
      </div>

      {accountsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading settlement accounts…</p>
      ) : null}
      {accounts.length === 0 && !accountsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">
          Offline transfer is unavailable right now. Please use Razorpay or contact support.
        </p>
      ) : null}

      {accounts.length > 0 ? (
        <div className="space-y-2">
          {accounts.map((a) => (
            <label
              key={a.id}
              className={cn(
                'flex cursor-pointer flex-col gap-1 rounded-lg border px-3 py-3 text-sm',
                activeAccountId === a.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background'
              )}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="platform-account"
                  checked={activeAccountId === a.id}
                  onChange={() => setSelectedAccountId(a.id)}
                />
                <span className="font-medium">{a.label}</span>
                {a.isPrimary ? (
                  <span className="text-xs text-muted-foreground">Primary</span>
                ) : null}
              </span>
              <span className="pl-6 text-muted-foreground">
                {[
                  a.accountHolderName,
                  a.bankName,
                  a.accountNumber ? `A/C ${a.accountNumber}` : null,
                  a.ifsc ? `IFSC ${a.ifsc}` : null,
                  a.upiVpa ? `UPI ${a.upiVpa}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              {a.instructions ? (
                <span className="pl-6 text-xs text-muted-foreground">{a.instructions}</span>
              ) : null}
            </label>
          ))}
        </div>
      ) : null}

      {selected ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Tip: include the project name in the transfer remarks when your bank allows it.
        </div>
      ) : null}

      <label className="block text-sm">
        <span className="text-muted-foreground">UTR / UPI reference</span>
        <input
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          value={transferReference}
          onChange={(e) => setTransferReference(e.target.value)}
          placeholder="e.g. 123456789012"
        />
      </label>

      <label className="block text-sm">
        <span className="text-muted-foreground">Notes (optional)</span>
        <textarea
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Paid from HDFC, project name in remarks"
        />
      </label>

      <div>
        <p className="text-sm text-muted-foreground">Receipt / screenshot (image or PDF)</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              try {
                const result = await uploadAsync({ file, projectId });
                if (result?.mediaId) {
                  setMediaIds((prev) => [...new Set([...prev, result.mediaId])].slice(0, 5));
                }
              } catch {
                /* toast handled by hook */
              }
            }}
          />
          {isUploading ? <span className="text-xs text-muted-foreground">Uploading…</span> : null}
        </div>
        {mediaIds.length > 0 ? (
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {mediaIds.map((id) => (
              <li key={id} className="flex items-center gap-2">
                <span className="font-mono">{id.slice(0, 10)}…</span>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setMediaIds((prev) => prev.filter((x) => x !== id))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Button className="w-full sm:w-auto" disabled={!canSubmit} onClick={() => submitM.mutate()}>
        {submitM.isPending ? 'Submitting…' : 'Submit for verification'}
      </Button>
    </div>
  );
}
