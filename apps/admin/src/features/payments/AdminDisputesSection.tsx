'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { FormFieldLabel } from '@nestlancer/field-help';
import {
  Button,
  DataTable,
  type DataTableColumn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  ErrorState,
  SkeletonTable,
  Text,
  Textarea,
} from '@nestlancer/ui';

import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRecord, pickAdminRows, rowId } from '@/lib/admin-response';
import { cellPreview, humanizeKey, inferColumns } from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';
import { AdminDataShell, adminDataTableClass } from '@/components/admin/AdminPageChrome';

type DisputeRow = Record<string, unknown>;

function DisputeDetailModal({ disputeId, onClose }: { disputeId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [response, setResponse] = useState('');

  const detailQ = useQuery({
    queryKey: [...adminKeys.payments(), 'dispute', disputeId],
    queryFn: () => apiServices.admin.getDisputeDetails(disputeId),
  });

  const respond = useMutation({
    mutationFn: () =>
      apiServices.admin.respondDispute(disputeId, {
        response: response.trim(),
        message: response.trim(),
      }),
    onSuccess: () => {
      toast.success('Response submitted');
      setResponse('');
      void qc.invalidateQueries({ queryKey: adminKeys.payments() });
      onClose();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const detail = pickAdminRecord(detailQ.data) ?? (detailQ.data as Record<string, unknown> | null);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Dispute details</DialogTitle>
        <DialogDescription>
          Dispute <span className="font-mono text-xs">{disputeId.slice(0, 12)}…</span>
        </DialogDescription>

        {detailQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : detailQ.error ? (
          <ErrorState
            message={getApiErrorMessage(detailQ.error)}
            onRetry={() => void detailQ.refetch()}
          />
        ) : detail ? (
          <div className="mt-3 space-y-2 text-sm">
            {Object.entries(detail)
              .filter(([k]) => !['evidence', 'timeline'].includes(k))
              .slice(0, 8)
              .map(([key, val]) => (
                <div key={key} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{humanizeKey(key)}</span>
                  <span className="text-right">{cellPreview(val)}</span>
                </div>
              ))}
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          <FormFieldLabel fieldKey="payments.disputeResponse" label="Response" required>
            Your response
          </FormFieldLabel>
          <Textarea
            rows={4}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Explain resolution steps…"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            disabled={!response.trim() || respond.isPending}
            onClick={() => respond.mutate()}
          >
            {respond.isPending ? 'Submitting…' : 'Submit response'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminDisputesSection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const disputesQ = useQuery({
    queryKey: [...adminKeys.payments(), 'disputes'],
    queryFn: () => apiServices.admin.listPaymentDisputes({ limit: 50 }),
  });

  const rows = useMemo(() => {
    const fromKnown = pickAdminRows(disputesQ.data);
    if (fromKnown.length > 0) return fromKnown;
    const rec = pickAdminRecord(disputesQ.data);
    if (rec && Array.isArray(rec.disputes)) {
      return rec.disputes.filter((x) => x && typeof x === 'object') as DisputeRow[];
    }
    return fromKnown;
  }, [disputesQ.data]);
  const columnKeys = useMemo(() => inferColumns(rows, 5), [rows]);

  const columns = useMemo<DataTableColumn<DisputeRow>[]>(
    () => [
      {
        id: 'status',
        header: 'Status',
        cell: (row) => (
          <span className="text-sm font-medium">{cellPreview(row.status ?? row.state)}</span>
        ),
      },
      {
        id: 'payment',
        header: 'Payment',
        cell: (row) => {
          const payment =
            row.payment && typeof row.payment === 'object'
              ? (row.payment as Record<string, unknown>)
              : null;
          const pid = String(row.paymentId ?? payment?.id ?? '—');
          return <span className="font-mono text-xs">{pid}</span>;
        },
      },
      {
        id: 'client',
        header: 'Client',
        cell: (row) => {
          const client =
            row.client && typeof row.client === 'object'
              ? (row.client as Record<string, unknown>)
              : null;
          return (
            <span className="text-sm text-muted-foreground">
              {cellPreview(client?.email ?? client?.firstName ?? row.clientId ?? row.userId)}
            </span>
          );
        },
      },
      ...columnKeys
        .filter(
          (key) => !['status', 'state', 'payment', 'paymentId', 'client', 'clientId'].includes(key)
        )
        .slice(0, 2)
        .map((key) => ({
          id: key,
          header: humanizeKey(key),
          cell: (row: DisputeRow) => <span className="text-sm">{cellPreview(row[key])}</span>,
        })),
      {
        id: 'actions',
        header: 'Actions',
        className: 'text-right',
        cell: (row: DisputeRow) => {
          const id = rowId(row) || String(row.id ?? '');
          if (!id) return null;
          return (
            <Button variant="outline" size="sm" onClick={() => setSelectedId(id)}>
              View & respond
            </Button>
          );
        },
      },
    ],
    [columnKeys]
  );

  return (
    <section className="space-y-3">
      <Text className="text-sm font-semibold text-foreground">Payment disputes</Text>

      <AdminDataShell>
        {disputesQ.isLoading ? <SkeletonTable rows={4} cols={5} /> : null}
        {!disputesQ.isLoading && disputesQ.error ? (
          <ErrorState
            message={getApiErrorMessage(disputesQ.error, 'Could not load disputes')}
            onRetry={() => void disputesQ.refetch()}
          />
        ) : null}
        {!disputesQ.isLoading && !disputesQ.error ? (
          <DataTable
            className={adminDataTableClass}
            columns={columns}
            rows={rows}
            getRowId={(row) => rowId(row) || JSON.stringify(row)}
            emptyTitle="No open disputes"
            emptyDescription="Disputed payments will appear here for review and response."
          />
        ) : null}
      </AdminDataShell>

      {selectedId ? (
        <DisputeDetailModal disputeId={selectedId} onClose={() => setSelectedId(null)} />
      ) : null}
    </section>
  );
}
