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

type LegalProfile = {
  id: string;
  label: string;
  legalName?: string | null;
  tradeName?: string | null;
  address?: string | null;
  state?: string | null;
  stateCode?: string | null;
  gstin?: string | null;
  pan?: string | null;
  cin?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  isActive?: boolean;
  isPrimary?: boolean;
  sortOrder?: number;
};

const emptyForm = {
  label: 'Primary legal entity',
  legalName: '',
  tradeName: '',
  address: '',
  state: '',
  stateCode: '',
  gstin: '',
  pan: '',
  cin: '',
  email: '',
  phone: '',
  website: '',
  isPrimary: true,
  isActive: true,
};

export function CompanyLegalProfilesClient() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: [...adminKeys.payments(), 'company-legal'],
    queryFn: () => apiServices.admin.listCompanyLegalProfiles(),
  });

  const profiles = useMemo(() => {
    const peeled = pickAdminRecord(listQ.data);
    if (Array.isArray(peeled?.data)) return peeled.data as LegalProfile[];
    return pickAdminRows(listQ.data) as LegalProfile[];
  }, [listQ.data]);

  const saveM = useMutation({
    mutationFn: async () => {
      const gstin = form.gstin.trim().toUpperCase();
      const pan = form.pan.trim().toUpperCase();
      if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
        throw new Error('GSTIN must be a valid 15-character Indian GST identification number');
      }
      if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
        throw new Error('PAN must be a valid 10-character Indian permanent account number');
      }
      const body = {
        label: form.label.trim(),
        legalName: form.legalName.trim() || undefined,
        tradeName: form.tradeName.trim() || undefined,
        address: form.address.trim() || undefined,
        state: form.state.trim() || undefined,
        stateCode: form.stateCode.trim() || undefined,
        gstin: gstin || undefined,
        pan: pan || undefined,
        cin: form.cin.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        website: form.website.trim() || undefined,
        isPrimary: form.isPrimary,
        isActive: form.isActive,
      };
      if (editingId) {
        return apiServices.admin.updateCompanyLegalProfile(editingId, body);
      }
      return apiServices.admin.createCompanyLegalProfile(body);
    },
    onSuccess: () => {
      toast.success(editingId ? 'Legal profile updated' : 'Legal profile created');
      setForm(emptyForm);
      setEditingId(null);
      void qc.invalidateQueries({ queryKey: [...adminKeys.payments(), 'company-legal'] });
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e) || (e instanceof Error ? e.message : 'Save failed')),
  });

  const removeM = useMutation({
    mutationFn: (id: string) => apiServices.admin.deleteCompanyLegalProfile(id),
    onSuccess: () => {
      toast.success('Legal profile removed');
      if (editingId) {
        setEditingId(null);
        setForm(emptyForm);
      }
      void qc.invalidateQueries({ queryKey: [...adminKeys.payments(), 'company-legal'] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const startEdit = (p: LegalProfile) => {
    setEditingId(p.id);
    setForm({
      label: p.label ?? 'Primary legal entity',
      legalName: p.legalName ?? '',
      tradeName: p.tradeName ?? '',
      address: p.address ?? '',
      state: p.state ?? '',
      stateCode: p.stateCode ?? '',
      gstin: p.gstin ?? '',
      pan: p.pan ?? '',
      cin: p.cin ?? '',
      email: p.email ?? '',
      phone: p.phone ?? '',
      website: p.website ?? '',
      isPrimary: Boolean(p.isPrimary),
      isActive: p.isActive !== false,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="Payments"
        title="Company legal identity"
        description="GSTIN, PAN, CIN and registered address printed on invoices, receipts and quotations. Leave fields blank to omit them from PDFs."
        actions={
          <Button variant="outline" size="sm" asChild>
            <a href="/payments">← Payments hub</a>
          </Button>
        }
      />

      <AdminQueryState isLoading={listQ.isLoading} error={listQ.error}>
        <GeCard flush>
          <GeCardHeader
            title={editingId ? 'Edit legal profile' : 'Add legal profile'}
            subtitle="Primary profile is used on all generated tax documents"
          />
          <div className="ge-card-body space-y-3 border-t border-border">
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['label', 'Label', 'e.g. Primary legal entity'],
                  ['legalName', 'Legal name', 'Nestlancer Pvt Ltd'],
                  ['tradeName', 'Trade / brand name', 'Nestlancer'],
                  ['gstin', 'GSTIN', '29AABCT1332L1ZV'],
                  ['pan', 'PAN', 'AABCT1332L'],
                  ['cin', 'CIN', 'U72900KA2020PTC123456'],
                  ['state', 'State', 'Karnataka'],
                  ['stateCode', 'State code', '29'],
                  ['email', 'Billing e-mail', 'billing@nestlancer.com'],
                  ['phone', 'Phone', '+91 80 1234 5678'],
                  ['website', 'Website', 'https://nestlancer.com'],
                ] as const
              ).map(([key, label, placeholder]) => (
                <label key={key} className="block text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <input
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                </label>
              ))}
              <label className="block text-sm sm:col-span-2">
                <span className="text-muted-foreground">Registered address</span>
                <textarea
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Full registered office address"
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
                Primary (used on PDFs)
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
                {saveM.isPending ? 'Saving…' : editingId ? 'Update profile' : 'Create profile'}
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
          <GeCardHeader title="Profiles" subtitle={`${profiles.length} configured`} />
          <div className="overflow-auto border-t border-border">
            {listQ.error ? (
              <ErrorState
                message={getApiErrorMessage(listQ.error)}
                onRetry={() => void listQ.refetch()}
              />
            ) : null}
            {profiles.length === 0 && !listQ.isLoading ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                No legal profile yet. Add GSTIN and registered address above — until then invoice
                supplier boxes stay blank.
              </p>
            ) : null}
            {profiles.length > 0 ? (
              <table className="ge-table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Legal name</th>
                    <th>GSTIN</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.label}
                        {p.isPrimary ? (
                          <span className="ml-2 text-xs text-muted-foreground">· primary</span>
                        ) : null}
                      </td>
                      <td>{p.legalName || '—'}</td>
                      <td className="font-mono text-xs">{p.gstin || '—'}</td>
                      <td>
                        <StatusBadge variant={p.isActive === false ? 'neutral' : 'success'}>
                          {p.isActive === false ? 'Disabled' : 'Active'}
                        </StatusBadge>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={removeM.isPending}
                            onClick={() => {
                              if (
                                typeof window !== 'undefined' &&
                                !window.confirm(
                                  `Remove “${p.label}”? It will no longer appear on new PDFs.`
                                )
                              ) {
                                return;
                              }
                              removeM.mutate(p.id);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
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
