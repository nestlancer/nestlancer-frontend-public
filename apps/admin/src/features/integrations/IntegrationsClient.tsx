'use client';

import { Badge, Switch } from '@nestlancer/ui';
import { useMemo, useState } from 'react';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
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
  Input,
  SkeletonTable,
} from '@nestlancer/ui';

import { GePageHeader as PageHeader } from '@/components/admin/AdminGentelellaUI';

import { useAdminConfirm } from '@/components/admin/AdminConfirmDialog';
import { AdminQueryState } from '@/components/admin/AdminConsolePrimitives';
import { DebugApiSection } from '@/components/admin/AdminDataViews';
import {
  AdminDataShell,
  AdminFilterBar,
  AdminMetricStrip,
  adminDataTableClass,
} from '@/components/admin/AdminPageChrome';
import { SliceFaultBanner } from '@/components/admin/AdminCharts';
import {
  ConfigFields,
  SettingsRow,
  SettingsSection,
} from '@/components/admin/AdminSettingsSections';
import { collectStatusFilterOptions, filterTableRows } from '@/components/admin/AdminTableViews';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRows, rowId } from '@/lib/admin-response';
import {
  cellPreview,
  extractMetricTiles,
  flattenShallow,
  humanizeKey,
  inferColumns,
} from '@/lib/admin-view-model';
import { apiServices } from '@/lib/axios';

type WebhookRow = Record<string, unknown>;

export function IntegrationsClient() {
  const qc = useQueryClient();
  const { confirm } = useAdminConfirm();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [retryFailed, setRetryFailed] = useState(true);
  const [signingRequired, setSigningRequired] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editEvents, setEditEvents] = useState('');
  const [deliveriesWebhookId, setDeliveriesWebhookId] = useState<string | null>(null);

  const deliveriesQ = useQuery({
    queryKey: [...adminKeys.webhooks(), 'deliveries', deliveriesWebhookId],
    queryFn: () => apiServices.admin.webhookDeliveries(deliveriesWebhookId!),
    enabled: Boolean(deliveriesWebhookId),
  });

  const results = useQueries({
    queries: [
      {
        queryKey: [...adminKeys.webhookMeta(), 'health'],
        queryFn: () => apiServices.admin.webhooksHealth(),
      },
      {
        queryKey: [...adminKeys.webhookMeta(), 'events'],
        queryFn: () => apiServices.admin.webhooksEvents(),
      },
      { queryKey: adminKeys.webhooks(), queryFn: () => apiServices.admin.listWebhooks() },
    ],
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: adminKeys.webhooks() });

  const createM = useMutation({
    mutationFn: () =>
      apiServices.admin.createWebhook({
        name: newName.trim(),
        url: newUrl.trim(),
        events: newEvents
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      toast.success('Webhook created.');
      setShowCreateForm(false);
      setNewName('');
      setNewUrl('');
      setNewEvents('');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create webhook')),
  });

  const updateM = useMutation({
    mutationFn: (id: string) =>
      apiServices.admin.patchWebhook(id, {
        url: editUrl.trim(),
        events: editEvents
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      toast.success('Webhook updated.');
      setEditingId(null);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update webhook')),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => apiServices.admin.deleteWebhook(id),
    onSuccess: () => {
      toast.success('Webhook deleted.');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not delete webhook')),
  });

  const testM = useMutation({
    mutationFn: (id: string) => apiServices.admin.testWebhook(id),
    onSuccess: () => toast.success('Test payload sent.'),
    onError: (e) => toast.error(getApiErrorMessage(e, 'Test failed')),
  });

  const enableM = useMutation({
    mutationFn: (id: string) => apiServices.admin.enableWebhook(id),
    onSuccess: () => {
      toast.success('Webhook enabled.');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not enable')),
  });

  const disableM = useMutation({
    mutationFn: (id: string) => apiServices.admin.disableWebhook(id),
    onSuccess: () => {
      toast.success('Webhook disabled.');
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not disable')),
  });

  const loading = results.some((r) => r.isPending && r.data === undefined);
  const sliceFaults: [string, unknown][] = [];
  const sliceNames = ['Health', 'Events', 'Webhooks'];
  results.forEach((r, i) => {
    if (r.error) sliceFaults.push([sliceNames[i]!, r.error]);
  });

  const health = results[0].data;
  const healthRec =
    health && typeof health === 'object' && !Array.isArray(health)
      ? (health as Record<string, unknown>)
      : null;

  const webhookRows = pickAdminRows(results[2].data);
  const statusOptions = useMemo(() => collectStatusFilterOptions(webhookRows), [webhookRows]);
  const filtered = useMemo(
    () => filterTableRows(webhookRows, search, statusFilter),
    [webhookRows, search, statusFilter]
  );
  const webhookColumns = useMemo<DataTableColumn<WebhookRow>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        cell: (row) => {
          const name = String(row.name ?? row.label ?? '').trim();
          return <span className="text-sm font-medium text-foreground">{name || '—'}</span>;
        },
      },
      {
        id: 'url',
        header: 'URL',
        cell: (row) => {
          const id = rowId(row);
          const url = String(row.url ?? row.endpoint ?? '—');
          return editingId === id ? (
            <div className="space-y-2">
              <Input
                id="webhook-edit-url"
                name="webhook-edit-url"
                value={editUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditUrl(e.target.value)}
                className="rounded-lg text-xs"
                placeholder="https://hooks.yourapp.com/nestlancer"
              />
              <Input
                id="webhook-edit-events"
                name="webhook-edit-events"
                value={editEvents}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditEvents(e.target.value)}
                placeholder="request.created, quote.accepted"
                className="rounded-lg text-xs"
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  disabled={updateM.isPending}
                  onClick={() => id && updateM.mutate(id)}
                >
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <span className="font-mono text-xs text-foreground">{url}</span>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => {
          const status = String(row.status ?? row.enabled ?? '—');
          const isEnabled =
            status === 'true' ||
            status === 'enabled' ||
            status === 'active' ||
            row.enabled === true;
          return (
            <Badge color={isEnabled ? 'emerald' : 'slate'} size="sm">
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        className: 'text-right',
        cell: (row) => {
          const id = rowId(row);
          if (!id) return null;
          const url = String(row.url ?? row.endpoint ?? '—');
          const name = String(row.name ?? row.label ?? url).trim() || url;
          const status = String(row.status ?? row.enabled ?? '—');
          const isEnabled =
            status === 'true' ||
            status === 'enabled' ||
            status === 'active' ||
            row.enabled === true;
          return (
            <div className="flex justify-end gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(id);
                  setEditUrl(url);
                  setEditEvents('');
                }}
              >
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDeliveriesWebhookId(id)}>
                Deliveries
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={testM.isPending}
                onClick={() => testM.mutate(id)}
              >
                Test
              </Button>
              {isEnabled ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disableM.isPending}
                  onClick={async () => {
                    // NL-BUG-INT-1: confirm before silently disabling deliveries.
                    const { confirmed } = await confirm({
                      title: 'Disable webhook',
                      description: `Stop deliveries to “${name}”? You can re-enable it later.`,
                      confirmLabel: 'Disable',
                      destructive: true,
                    });
                    if (!confirmed) return;
                    disableM.mutate(id);
                  }}
                >
                  Disable
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={enableM.isPending}
                  onClick={() => enableM.mutate(id)}
                >
                  Enable
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                disabled={deleteM.isPending}
                onClick={async () => {
                  const { confirmed } = await confirm({
                    title: 'Delete webhook',
                    description: 'This permanently removes the webhook integration.',
                    destructive: true,
                    confirmLabel: 'Delete',
                  });
                  if (!confirmed) return;
                  deleteM.mutate(id);
                }}
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [deleteM, disableM, editEvents, editUrl, editingId, enableM, testM, updateM, confirm]
  );

  const debugPayloads = {
    webhooksHealth: results[0].data,
    webhooksEvents: results[1].data,
    webhooksList: results[2].data,
  } as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <PageHeader
        pretitle="System"
        title="Webhooks"
        description="Outgoing webhook health, supported event catalog, and registered endpoints."
      />

      <AdminQueryState isLoading={loading} error={null}>
        <div className="space-y-8">
          <SliceFaultBanner faults={sliceFaults} />

          <div className="grid gap-8 lg:grid-cols-2">
            <SettingsSection title="Integration health" description="GET /admin/webhooks/health">
              <SettingsRow label="Delivery status" description="Current webhook subsystem health.">
                <div className="flex flex-wrap justify-end gap-2">
                  {typeof healthRec?.status === 'string' ? (
                    <Badge color={healthRec.status === 'ok' ? 'emerald' : 'amber'} size="sm">
                      {healthRec.status}
                    </Badge>
                  ) : (
                    <Badge color="slate" size="sm">
                      Unknown
                    </Badge>
                  )}
                  {typeof healthRec?.service === 'string' ? (
                    <Badge color="blue" size="sm">
                      {healthRec.service}
                    </Badge>
                  ) : null}
                </div>
              </SettingsRow>
              <div className="py-4">
                <AdminMetricStrip items={extractMetricTiles(health, 'Health')} max={2} />
              </div>
              {flattenShallow(health, 16).length > 0 ? (
                <ConfigFields rows={flattenShallow(health, 16)} />
              ) : null}
            </SettingsSection>

            <SettingsSection
              title="Delivery preferences"
              description="Operator defaults for webhook dispatch."
            >
              <SettingsRow
                label="Retry failed deliveries"
                description="Automatically retry 5xx responses with exponential backoff."
              >
                <Switch
                  checked={retryFailed}
                  onChange={setRetryFailed}
                  aria-label="Retry failed deliveries"
                />
              </SettingsRow>
              <SettingsRow
                label="Require signing secret"
                description="Reject payloads that fail HMAC signature verification."
              >
                <Switch
                  checked={signingRequired}
                  onChange={setSigningRequired}
                  aria-label="Require signing secret"
                />
              </SettingsRow>
            </SettingsSection>
          </div>

          <SettingsSection title="Event catalog" description="GET /admin/webhooks/events">
            <div className="space-y-4 py-2">
              <AdminMetricStrip items={extractMetricTiles(results[1].data, 'Events')} max={3} />
              {flattenShallow(results[1].data, 20).length > 0 ? (
                <ConfigFields rows={flattenShallow(results[1].data, 20)} />
              ) : null}
            </div>
          </SettingsSection>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <SettingsSection title="Configured webhooks" description="GET /admin/webhooks">
                <SettingsRow
                  label="Registered endpoints"
                  description="Filter and inspect outbound webhook registrations."
                >
                  <Badge color="blue" size="sm">
                    {filtered.length} endpoint{filtered.length === 1 ? '' : 's'}
                  </Badge>
                </SettingsRow>
              </SettingsSection>
              <Button size="sm" className="rounded-lg" onClick={() => setShowCreateForm((v) => !v)}>
                {showCreateForm ? 'Cancel' : '+ Add webhook'}
              </Button>
            </div>

            {showCreateForm ? (
              <div className="rounded-lg border border-border/60 bg-card/30 p-5 space-y-3">
                <h3 className="text-sm font-semibold">New webhook</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <FormFieldLabel
                      htmlFor="webhook-name"
                      fieldKey="integrations.webhookName"
                      label="Webhook name"
                    >
                      Name
                    </FormFieldLabel>
                    <Input
                      id="webhook-name"
                      name="webhook-name"
                      value={newName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewName(e.target.value)
                      }
                      placeholder="Project updates"
                      className="rounded-lg"
                    />
                  </div>
                  <div>
                    <FormFieldLabel
                      htmlFor="webhook-url"
                      fieldKey="integrations.webhookUrl"
                      label="Webhook URL"
                    >
                      URL
                    </FormFieldLabel>
                    <Input
                      id="webhook-url"
                      name="webhook-url"
                      value={newUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewUrl(e.target.value)
                      }
                      placeholder="https://example.com/hook"
                      className="rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FormFieldLabel
                      htmlFor="webhook-events"
                      fieldKey="integrations.webhookEvents"
                      label="Webhook events"
                    >
                      Events (comma-separated)
                    </FormFieldLabel>
                    <Input
                      id="webhook-events"
                      name="webhook-events"
                      value={newEvents}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewEvents(e.target.value)
                      }
                      placeholder="request.created, quote.accepted"
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <Button
                  disabled={!newName.trim() || !newUrl.trim() || createM.isPending}
                  className="rounded-lg"
                  onClick={() => createM.mutate()}
                >
                  {createM.isPending ? 'Creating…' : 'Create webhook'}
                </Button>
              </div>
            ) : null}

            <AdminDataShell
              filter={
                <AdminFilterBar
                  search={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Search URL, event, status…"
                  filters={[
                    {
                      id: 'status',
                      label: 'Status',
                      value: statusFilter,
                      options: [
                        { value: 'all', label: 'All statuses' },
                        ...statusOptions.map((opt) => ({ value: opt, label: opt })),
                      ],
                      onChange: setStatusFilter,
                    },
                  ]}
                  actions={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('all');
                      }}
                    >
                      Clear
                    </Button>
                  }
                />
              }
            >
              {results[2].isPending ? <SkeletonTable rows={5} cols={3} /> : null}
              {results[2].error ? (
                <ErrorState
                  message={getApiErrorMessage(results[2].error, 'Could not load webhooks')}
                  onRetry={() => {
                    void results[2].refetch();
                  }}
                />
              ) : null}
              {!results[2].isPending && !results[2].error ? (
                <DataTable
                  className={adminDataTableClass}
                  columns={webhookColumns}
                  rows={filtered}
                  getRowId={(row) =>
                    rowId(row) || String(row.url ?? row.endpoint ?? JSON.stringify(row))
                  }
                  emptyTitle="No webhooks registered yet"
                  emptyDescription="Add a webhook to start receiving outbound events."
                />
              ) : null}
            </AdminDataShell>
          </section>

          <DebugApiSection payloads={debugPayloads} />
        </div>
      </AdminQueryState>

      {deliveriesWebhookId ? (
        <Dialog open onOpenChange={(open) => !open && setDeliveriesWebhookId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogTitle>Webhook deliveries</DialogTitle>
            <DialogDescription>
              Delivery history for webhook {deliveriesWebhookId.slice(0, 12)}…
            </DialogDescription>
            {deliveriesQ.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading deliveries…</p>
            ) : deliveriesQ.error ? (
              <ErrorState
                message={getApiErrorMessage(deliveriesQ.error)}
                onRetry={() => void deliveriesQ.refetch()}
              />
            ) : (
              <DataTable
                columns={inferColumns(pickAdminRows(deliveriesQ.data), 5).map((key) => ({
                  id: key,
                  header: humanizeKey(key),
                  cell: (row: WebhookRow) => (
                    <span className="text-sm">{cellPreview(row[key])}</span>
                  ),
                }))}
                rows={pickAdminRows(deliveriesQ.data)}
                getRowId={(row) => rowId(row) || JSON.stringify(row)}
                emptyTitle="No deliveries yet"
                emptyDescription="Outbound delivery attempts will appear here."
              />
            )}
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
