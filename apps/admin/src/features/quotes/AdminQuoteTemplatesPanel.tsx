'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';
import { useState } from 'react';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, Card, DataTable, type DataTableColumn, Input, Textarea } from '@nestlancer/ui';

import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRecord, pickAdminRows, rowId } from '@/lib/admin-response';
import { cellPreview, humanizeKey, inferColumns } from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';

type TemplateRow = Record<string, unknown>;

export function AdminQuoteTemplatesPanel() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const q = useQuery({
    queryKey: [...adminKeys.quotes(), 'templates'],
    queryFn: () => apiServices.admin.getAdminQuoteTemplates(),
  });

  const createM = useMutation({
    mutationFn: () =>
      apiServices.admin.createAdminQuoteTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: (created) => {
      toast.success('Template created');
      setName('');
      setDescription('');
      setShowCreate(false);
      const record = pickAdminRecord(created);
      if (record && typeof record.id === 'string') {
        qc.setQueryData([...adminKeys.quotes(), 'templates'], (prev: unknown) => {
          const existing = pickAdminRows(prev);
          const ids = new Set(existing.map((row) => rowId(row)));
          if (ids.has(record.id as string)) return prev;
          return { templates: [...existing, record] };
        });
      }
      void qc.invalidateQueries({ queryKey: [...adminKeys.quotes(), 'templates'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const rows = pickAdminRows(q.data);
  const columnKeys = inferColumns(rows, 4);
  const columns: DataTableColumn<TemplateRow>[] = columnKeys.map((key) => ({
    id: key,
    header: humanizeKey(key),
    cell: (row) => <span className="text-sm">{cellPreview(row[key])}</span>,
  }));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Quote templates</h2>
          <p className="text-xs text-muted-foreground">
            Reusable pricing shells for common engagement types.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Cancel' : 'New template'}
        </Button>
      </div>

      {showCreate ? (
        <Card className="max-w-lg space-y-3 p-4">
          <FormFieldLabel fieldKey="quotes.templateName" label="Name" required>
            Template name
          </FormFieldLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. MVP build"
          />
          <FormFieldLabel fieldKey="quotes.templateDescription" label="Description">
            Description
          </FormFieldLabel>
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Default scope and terms…"
          />
          <Button
            size="sm"
            disabled={!name.trim() || createM.isPending}
            onClick={() => createM.mutate()}
          >
            {createM.isPending ? 'Creating…' : 'Create template'}
          </Button>
        </Card>
      ) : null}

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading templates…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No templates yet.</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => rowId(row) || String(row.name ?? '')}
          emptyTitle="No templates"
        />
      )}
    </section>
  );
}
