'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';
import { useMemo, useState } from 'react';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { CreateLineItemBlockDtoCategory } from '@nestlancer/api-client';
import { DEFAULT_CURRENCY } from '@nestlancer/constants';
import { formatCurrency } from '@nestlancer/utils';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, Card, DataTable, type DataTableColumn, Input, Textarea } from '@nestlancer/ui';

import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRecord, pickAdminRows, rowId } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

type LibraryRow = Record<string, unknown>;

const CATEGORIES = Object.values(CreateLineItemBlockDtoCategory);

function slugFromLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export type LineItemLibraryPanelProps = {
  /** When provided, show an Insert action that returns a line item for quote forms. */
  onInsert?: (item: { description: string; quantity: number; unitPrice: number }) => void;
};

export function LineItemLibraryPanel({ onInsert }: LineItemLibraryPanelProps) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CreateLineItemBlockDtoCategory>(
    CreateLineItemBlockDtoCategory.backend
  );
  const [defaultUnitPrice, setDefaultUnitPrice] = useState(0);
  const [defaultQuantity, setDefaultQuantity] = useState(1);
  const [includeInactive, setIncludeInactive] = useState(false);

  const q = useQuery({
    queryKey: [...adminKeys.lineItemLibrary(), includeInactive],
    queryFn: () => apiServices.admin.listLineItemLibrary({ includeInactive }),
  });

  const createM = useMutation({
    mutationFn: () =>
      apiServices.admin.createLineItemBlock({
        slug: slugFromLabel(label),
        label: label.trim(),
        description: description.trim(),
        category,
        defaultUnitPrice,
        defaultQuantity,
      }),
    onSuccess: () => {
      toast.success('Line-item block created');
      setLabel('');
      setDescription('');
      setDefaultUnitPrice(0);
      setDefaultQuantity(1);
      setShowCreate(false);
      void qc.invalidateQueries({ queryKey: adminKeys.lineItemLibrary() });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deactivateM = useMutation({
    mutationFn: (id: string) => apiServices.admin.deactivateLineItemBlock(id),
    onSuccess: () => {
      toast.success('Block deactivated');
      void qc.invalidateQueries({ queryKey: adminKeys.lineItemLibrary() });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const reactivateM = useMutation({
    mutationFn: (id: string) => apiServices.admin.updateLineItemBlock(id, { isActive: true }),
    onSuccess: () => {
      toast.success('Block reactivated');
      void qc.invalidateQueries({ queryKey: adminKeys.lineItemLibrary() });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const rows = useMemo(() => {
    const raw = q.data;
    if (Array.isArray(raw)) return raw as LibraryRow[];
    if (raw && typeof raw === 'object') {
      const rec = raw as Record<string, unknown>;
      if (Array.isArray(rec.blocks)) return rec.blocks as LibraryRow[];
      if (Array.isArray(rec.data)) return rec.data as LibraryRow[];
    }
    return pickAdminRows(q.data);
  }, [q.data]);

  const columns: DataTableColumn<LibraryRow>[] = [
    {
      id: 'label',
      header: 'Block',
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{String(row.label ?? '')}</p>
          <p className="text-xs text-muted-foreground">{String(row.description ?? '')}</p>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      cell: (row) => <span className="text-sm capitalize">{String(row.category ?? '')}</span>,
    },
    {
      id: 'price',
      header: 'Default',
      cell: (row) => {
        const qty = Number(row.defaultQuantity ?? 1);
        const price =
          typeof row.defaultUnitPrice === 'number'
            ? row.defaultUnitPrice
            : Number(row.defaultUnitPrice ?? 0);
        return (
          <span className="text-sm tabular-nums">
            {qty} × {formatCurrency(price, DEFAULT_CURRENCY)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: (row) => {
        const id = rowId(row);
        const active = row.isActive !== false;
        return (
          <div className="flex flex-wrap justify-end gap-2">
            {onInsert ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onInsert({
                    description: String(row.description ?? row.label ?? ''),
                    quantity: Math.max(1, Number(row.defaultQuantity ?? 1)),
                    unitPrice: Math.max(0, Number(row.defaultUnitPrice ?? 0)),
                  })
                }
              >
                Insert
              </Button>
            ) : null}
            {active && id ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={deactivateM.isPending}
                onClick={() => deactivateM.mutate(id)}
              >
                Deactivate
              </Button>
            ) : id ? (
              <Button
                size="sm"
                variant="outline"
                disabled={reactivateM.isPending}
                onClick={() => reactivateM.mutate(id)}
              >
                Activate
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Line-item library</h2>
          <p className="text-xs text-muted-foreground">
            Reusable quote blocks. Quote templates API is retired (410) — use this library instead.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setIncludeInactive((v) => !v)}>
            {includeInactive ? 'Hide inactive' : 'Show inactive'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Cancel' : 'New block'}
          </Button>
        </div>
      </div>

      {showCreate ? (
        <Card className="max-w-lg space-y-3 p-4">
          <FormFieldLabel fieldKey="quotes.libraryLabel" label="Label" required>
            Label
          </FormFieldLabel>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Custom API Integration"
          />
          <FormFieldLabel fieldKey="quotes.libraryDescription" label="Description" required>
            Description
          </FormFieldLabel>
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Shown as the quote line description…"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormFieldLabel fieldKey="quotes.libraryCategory" label="Category">
                Category
              </FormFieldLabel>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value as CreateLineItemBlockDtoCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FormFieldLabel fieldKey="quotes.libraryQty" label="Default qty">
                Default qty
              </FormFieldLabel>
              <Input
                type="number"
                min={1}
                value={defaultQuantity || ''}
                onChange={(e) => setDefaultQuantity(Math.max(1, Number(e.target.value) || 1))}
                placeholder="1"
              />
            </div>
          </div>
          <FormFieldLabel fieldKey="quotes.libraryPrice" label="Default unit price">
            Default unit price ({DEFAULT_CURRENCY})
          </FormFieldLabel>
          <Input
            type="number"
            min={0}
            value={defaultUnitPrice || ''}
            onChange={(e) => setDefaultUnitPrice(Math.max(0, Number(e.target.value) || 0))}
            placeholder="50000"
          />
          <Button
            size="sm"
            disabled={
              !label.trim() || !description.trim() || !slugFromLabel(label) || createM.isPending
            }
            onClick={() => createM.mutate()}
          >
            {createM.isPending ? 'Creating…' : 'Create block'}
          </Button>
          {pickAdminRecord(createM.data) ? null : null}
        </Card>
      ) : null}

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading library…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No line-item blocks yet.</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => rowId(row) || String(row.slug ?? row.label ?? '')}
          emptyTitle="No blocks"
        />
      )}
    </section>
  );
}
