'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { FormFieldLabel } from '@nestlancer/field-help';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  Textarea,
} from '@nestlancer/ui';

import { adminKeys } from '@/lib/admin-query-keys';
import { apiServices } from '@/lib/axios';

import { adminPaymentsDebug, adminPaymentsDebugError } from './payments-debug';
import { formatAdminCurrency } from './payment-hub-utils';

export function PaymentRefundModal({
  paymentId,
  amount,
  currency,
  onClose,
}: {
  paymentId: string;
  amount: unknown;
  currency: unknown;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [partial, setPartial] = useState('');
  const qc = useQueryClient();

  const refundM = useMutation({
    mutationFn: () => {
      const body = {
        reason,
        ...(partial.trim() ? { amount: Number(partial) } : {}),
      };
      adminPaymentsDebug('refund:submit', { paymentId, body });
      return apiServices.admin.processPaymentRefund(paymentId, body);
    },
    onSuccess: () => {
      toast.success('Refund processed');
      void qc.invalidateQueries({ queryKey: adminKeys.payments() });
      void qc.invalidateQueries({ queryKey: adminKeys.payment(paymentId) });
      onClose();
    },
    onError: (e) => {
      adminPaymentsDebugError('refund:error', e, { paymentId });
      toast.error(getApiErrorMessage(e, 'Could not process refund'));
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle>Process refund</DialogTitle>
        <DialogDescription>
          Payment <span className="font-mono text-xs">{paymentId.slice(0, 12)}…</span> ·{' '}
          {formatAdminCurrency(amount, currency)}
        </DialogDescription>

        <div className="mt-4 space-y-3">
          <div>
            <FormFieldLabel fieldKey="payments.refundAmount" label="Partial refund amount">
              Partial amount (leave blank for full refund)
            </FormFieldLabel>
            <Input
              type="number"
              min={0}
              placeholder={`Max: ${formatAdminCurrency(amount, currency)}`}
              value={partial}
              onChange={(e) => setPartial(e.target.value)}
            />
          </div>
          <div>
            <FormFieldLabel fieldKey="payments.refundReason" label="Refund reason" required>
              Reason
            </FormFieldLabel>
            <Textarea
              rows={3}
              placeholder="Customer requested refund…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!reason.trim() || refundM.isPending}
              onClick={() => refundM.mutate()}
            >
              {refundM.isPending ? 'Processing…' : 'Process refund'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
