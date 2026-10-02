'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';
import { getApiErrorMessage } from '@nestlancer/api-client';
import { Button, ErrorState, StatusBadge } from '@nestlancer/ui';

import {
  GeCard,
  GeCardHeader,
  GePageHeader as PageHeader,
} from '@/components/admin/AdminGentelellaUI';
import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { pickAdminRecord, pickAdminRows } from '@/lib/admin-response';
import { adminKeys } from '@/lib/admin-query-keys';
import { apiServices } from '@/lib/axios';

type AccountType = 'BANK' | 'UPI' | 'BOTH';

type PlatformAccount = {
  id: string;
  label: string;
  type: AccountType;
  accountHolderName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifsc?: string | null;
  accountType?: string | null;
  upiVpa?: string | null;
  instructions?: string | null;
  currency?: string;
  isActive?: boolean;
  isPrimary?: boolean;
  sortOrder?: number;
};

const emptyForm = {
  label: '',
  type: 'BOTH' as AccountType,
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifsc: '',
  accountType: 'current',
  upiVpa: '',
  instructions: '',
  isPrimary: false,
  isActive: true,
};

export function PlatformPaymentAccountsClient() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: [...adminKeys.payments(), 'accounts'],
    queryFn: () => apiServices.admin.listPlatformPaymentAccounts(),
  });

  const accounts = useMemo(() => {
    const peeled = pickAdminRecord(listQ.data);
    if (Array.isArray(peeled?.data)) return peeled.data as PlatformAccount[];
    return pickAdminRows(listQ.data) as PlatformAccount[];
  }, [listQ.data]);

  const saveM = useMutation({
    mutationFn: async () => {
      const body = {
        label: form.label.trim(),
        type: form.type,
        accountHolderName: form.accountHolderName.trim() || undefined,
        bankName: form.bankName.trim() || undefined,
        accountNumber: form.accountNumber.trim() || undefined,
        ifsc: form.ifsc.trim() || undefined,
        accountType: form.accountType.trim() || undefined,
        upiVpa: form.upiVpa.trim() || undefined,
        instructions: form.instructions.trim() || undefined,
        isPrimary: form.isPrimary,
        isActive: form.isActive,
      };
      if (editingId) {
        return apiServices.admin.updatePlatformPaymentAccount(editingId, body);
      }
      return apiServices.admin.createPlatformPaymentAccount(body);
    },
    onSuccess: () => {
      toast.success(editingId ? 'Account updated' : 'Account created');
      setForm(emptyForm);
      setEditingId(null);
      void qc.invalidateQueries({ queryKey: [...adminKeys.payments(), 'accounts'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const disableM = useMutation({
    mutationFn: (id: string) => apiServices.admin.deletePlatformPaymentAccount(id),
    onSuccess: () => {
      toast.success('Account disabled');
      void qc.invalidateQueries({ queryKey: [...adminKeys.payments(), 'accounts'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const startEdit = (a: PlatformAccount) => {
    setEditingId(a.id);
    setForm({
      label: a.label ?? '',
      type: (a.type as AccountType) || 'BOTH',
      accountHolderName: a.accountHolderName ?? '',
      bankName: a.bankName ?? '',
      accountNumber: a.accountNumber ?? '',
      ifsc: a.ifsc ?? '',
      accountType: a.accountType ?? 'current',
      upiVpa: a.upiVpa ?? '',
      instructions: a.instructions ?? '',
      isPrimary: Boolean(a.isPrimary),
      isActive: a.isActive !== false,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="Payments"
        title="Settlement accounts"
        description="Bank and UPI details shown to clients for offline transfers. Stored in the database — not in env."
        actions={
          <Button variant="outline" size="sm" asChild>
            <a href="/payments">← Payments hub</a>
          </Button>
        }
      />

      <AdminQueryState isLoading={listQ.isLoading} error={listQ.error}>
        <GeCard flush>
          <GeCardHeader
            title={editingId ? 'Edit account' : 'Add account'}
            subtitle="Primary account appears on invoices; all active accounts are offered at checkout"
          />
          <div className="ge-card-body space-y-3 border-t border-border">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-muted-foreground">Label</span>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. HDFC current — Nestlancer"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">Type</span>
                <select
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AccountType }))}
                >
                  <option value="BANK">Bank</option>
                  <option value="UPI">UPI</option>
                  <option value="BOTH">Bank + UPI</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">Account holder</span>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                  value={form.accountHolderName}
                  onChange={(e) => setForm((f) => ({ ...f, accountHolderName: e.target.value }))}
                  placeholder="Account holder name"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">Bank name</span>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                  value={form.bankName}
                  onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                  placeholder="e.g. HDFC Bank"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">Account number</span>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                  value={form.accountNumber}
                  onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                  placeholder="Bank account number"
                  autoComplete="off"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">IFSC</span>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                  value={form.ifsc}
                  onChange={(e) => setForm((f) => ({ ...f, ifsc: e.target.value }))}
                  placeholder="HDFC0001234"
                  autoComplete="off"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">UPI VPA</span>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                  value={form.upiVpa}
                  onChange={(e) => setForm((f) => ({ ...f, upiVpa: e.target.value }))}
                  placeholder="studio@okicici"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-muted-foreground">Instructions for clients</span>
                <textarea
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                  rows={2}
                  value={form.instructions}
                  onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                  placeholder="Transfer INR and upload the UTR on checkout"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPrimary}
                  onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
                />
                Primary (invoices)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active
              </label>
              <Button
                size="sm"
                disabled={!form.label.trim() || saveM.isPending}
                onClick={() => saveM.mutate()}
              >
                {saveM.isPending ? 'Saving…' : editingId ? 'Update account' : 'Create account'}
              </Button>
              {editingId ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                >
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </div>
        </GeCard>

        <GeCard flush>
          <GeCardHeader title="Accounts" subtitle={`${accounts.length} configured`} />
          <div className="overflow-auto border-t border-border">
            {listQ.error ? (
              <ErrorState
                message={getApiErrorMessage(listQ.error)}
                onRetry={() => void listQ.refetch()}
              />
            ) : null}
            {accounts.length === 0 && !listQ.isLoading ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                No settlement accounts yet. Add a bank or UPI account above.
              </p>
            ) : null}
            {accounts.length > 0 ? (
              <table className="ge-table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Type</th>
                    <th>Details</th>
                    <th>Flags</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id}>
                      <td className="font-medium">{a.label}</td>
                      <td>{a.type}</td>
                      <td className="text-sm text-muted-foreground">
                        {[
                          a.accountNumber ? `A/C ${a.accountNumber}` : null,
                          a.ifsc ? `IFSC ${a.ifsc}` : null,
                          a.upiVpa ? `UPI ${a.upiVpa}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </td>
                      <td className="space-x-1">
                        {a.isPrimary ? (
                          <StatusBadge variant="info" dot>
                            Primary
                          </StatusBadge>
                        ) : null}
                        <StatusBadge variant={a.isActive === false ? 'error' : 'success'} dot>
                          {a.isActive === false ? 'Inactive' : 'Active'}
                        </StatusBadge>
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <Button size="sm" variant="outline" onClick={() => startEdit(a)}>
                          Edit
                        </Button>{' '}
                        {a.isActive !== false ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={disableM.isPending}
                            onClick={() => disableM.mutate(a.id)}
                          >
                            Disable
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </GeCard>
      </AdminQueryState>
    </div>
  );
}
