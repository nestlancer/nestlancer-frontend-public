'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
} from '@nestlancer/ui';
import { toPaise } from '@nestlancer/utils';

import { adminKeys } from '@/lib/admin-query-keys';
import { apiServices } from '@/lib/axios';

export type ManualPaymentMilestoneOption = {
  id: string;
  label: string;
  amountPaise?: number;
};

export type ManualPaymentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  clientId?: string;
  milestoneId?: string;
  milestones?: ManualPaymentMilestoneOption[];
};

function rupeesFromPaise(paise: number): string {
  return (paise / 100).toFixed(2);
}

export function ManualPaymentModal({
  open,
  onOpenChange,
  projectId,
  clientId: initialClientId,
  milestoneId: initialMilestoneId,
  milestones = [],
}: ManualPaymentModalProps) {
  const qc = useQueryClient();
  const billable = useMemo(
    () => milestones.filter((row) => row.id && (row.amountPaise ?? 0) > 0),
    [milestones]
  );
  const [milestoneId, setMilestoneId] = useState(initialMilestoneId ?? '');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const selected = billable.find((row) => row.id === milestoneId) ?? null;
  const lockedAmount =
    typeof selected?.amountPaise === 'number' && selected.amountPaise > 0
      ? rupeesFromPaise(selected.amountPaise)
      : null;

  const billableKey = billable.map((row) => `${row.id}:${row.amountPaise ?? 0}`).join('|');

  useEffect(() => {
    if (!open) return;
    const preferred =
      (initialMilestoneId && billable.some((row) => row.id === initialMilestoneId)
        ? initialMilestoneId
        : billable[0]?.id) ?? '';
    setMilestoneId(preferred);
    const row = billable.find((item) => item.id === preferred);
    setAmount(
      typeof row?.amountPaise === 'number' && row.amountPaise > 0
        ? rupeesFromPaise(row.amountPaise)
        : ''
    );
    setNotes('');
    // Reset only when the dialog opens or the installment list changes, not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialMilestoneId, billableKey]);

  const createM = useMutation({
    mutationFn: () => {
      const rupees = Number((lockedAmount ?? amount).trim());
      const amountPaise = toPaise(rupees);
      return apiServices.admin.createManualPayment({
        projectId,
        clientId: initialClientId?.trim() || undefined,
        milestoneId: milestoneId.trim(),
        amount: amountPaise,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Manual payment recorded');
      onOpenChange(false);
      setAmount('');
      void qc.invalidateQueries({ queryKey: adminKeys.payments() });
      void qc.invalidateQueries({ queryKey: adminKeys.milestones() });
      void qc.invalidateQueries({ queryKey: adminKeys.reconciliation() });
    },
    onError: (e) => {
      const msg = getApiErrorMessage(e);
      // Gateway may 504 after DB commit while docs generate — ask operator to refresh.
      if (/timed?\s*out|504|GATEWAY_003/i.test(msg)) {
        toast.error(
          'Request timed out — the payment may still have been recorded. Refresh the payments list to confirm.'
        );
        void qc.invalidateQueries({ queryKey: adminKeys.payments() });
        void qc.invalidateQueries({ queryKey: adminKeys.milestones() });
        return;
      }
      toast.error(msg);
    },
  });

  const amountValue = lockedAmount ?? amount;
  const canSubmit =
    Boolean(projectId) &&
    Boolean(milestoneId.trim()) &&
    Number.isFinite(Number(amountValue)) &&
    Number(amountValue) >= 1 &&
    !createM.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md space-y-4">
        <DialogTitle>Record manual payment</DialogTitle>
        <DialogDescription>
          Marks the selected installment completed immediately (no client proof). Prefer the
          Awaiting verification queue when the client submitted a bank or UPI transfer.
        </DialogDescription>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="manual-milestone">
              Installment
            </label>
            {billable.length > 0 ? (
              <select
                id="manual-milestone"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={milestoneId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setMilestoneId(nextId);
                  const row = billable.find((item) => item.id === nextId);
                  setAmount(
                    typeof row?.amountPaise === 'number' && row.amountPaise > 0
                      ? rupeesFromPaise(row.amountPaise)
                      : ''
                  );
                }}
              >
                {billable.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                No billable installments on this project. Delivery-only milestones cannot be paid.
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="manual-amount">
              Amount (₹)
            </label>
            <input
              id="manual-amount"
              className="mt-1 w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-sm"
              value={amountValue}
              readOnly
              aria-readonly="true"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Must match the installment exactly. Zero-value delivery milestones are excluded.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="manual-notes">
              Notes
            </label>
            <Input
              id="manual-notes"
              className="mt-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. NEFT UTR 123456789012"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={() => createM.mutate()}>
            {createM.isPending ? 'Recording…' : 'Record payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
