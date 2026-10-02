'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from '@nestlancer/ui';
import { Plus, Trash2 } from '@nestlancer/ui/icons';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { DEFAULT_CURRENCY, PLATFORM_CURRENCIES } from '@nestlancer/constants';
import { formatCurrency, fromPaise, toPaise } from '@nestlancer/utils';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@nestlancer/ui';

import { UserSearchCombobox } from '@/components/admin/UserSearchCombobox';
import {
  calculateQuoteTotals,
  defaultLineItem,
  defaultValidUntilDate,
  parsePaymentBreakdown,
  type QuoteLineItem,
} from '@/features/quotes/admin-quote-utils';
import { adminKeys } from '@/lib/admin-query-keys';
import { pickAdminRecord } from '@/lib/admin-response';
import { apiServices } from '@/lib/axios';

const STEPS = ['Client', 'Request', 'Quote', 'Milestones', 'Review'] as const;

type MilestoneDraft = {
  name: string;
  description: string;
  amountMajor: number;
  percentage: string;
  dueDate: string;
};

type WizardFormState = {
  clientId: string;
  clientLabel: string;
  adminId: string;
  requestTitle: string;
  requestDescription: string;
  requestCategory: string;
  quoteTitle: string;
  quoteDescription: string;
  items: QuoteLineItem[];
  currency: string;
  taxPercentage: number;
  validUntil: string;
  terms: string;
  internalNotes: string;
  targetEndDate: string;
  milestones: MilestoneDraft[];
};

function previewRecord(payload: unknown): Record<string, unknown> {
  return pickAdminRecord(payload) ?? {};
}

function isoDateOnly(value: unknown): string {
  if (!value) return '';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function buildInitialState(preview: Record<string, unknown>): WizardFormState {
  const request =
    preview.request && typeof preview.request === 'object'
      ? (preview.request as Record<string, unknown>)
      : {};
  const quote =
    preview.quote && typeof preview.quote === 'object'
      ? (preview.quote as Record<string, unknown>)
      : {};
  const project =
    preview.project && typeof preview.project === 'object'
      ? (preview.project as Record<string, unknown>)
      : {};
  const milestones = Array.isArray(preview.milestones) ? preview.milestones : [];

  return {
    clientId: '',
    clientLabel: '',
    adminId: String(project.adminId ?? ''),
    requestTitle: String(request.title ?? ''),
    requestDescription: String(request.description ?? ''),
    requestCategory: String(request.category ?? 'general'),
    quoteTitle: String(quote.title ?? request.title ?? ''),
    quoteDescription: String(quote.description ?? request.description ?? ''),
    items: parsePaymentBreakdown(quote.paymentBreakdown),
    currency:
      typeof quote.currency === 'string'
        ? quote.currency.toUpperCase().slice(0, 3)
        : DEFAULT_CURRENCY,
    taxPercentage: typeof quote.taxPercentage === 'number' ? quote.taxPercentage : 0,
    validUntil: isoDateOnly(quote.validUntil) || defaultValidUntilDate(),
    terms: String(quote.termsAndConditions ?? quote.terms ?? ''),
    internalNotes: String(quote.internalNotes ?? quote.notes ?? ''),
    targetEndDate: isoDateOnly(project.targetEndDate),
    milestones: milestones.map((row) => {
      const m = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        name: String(m.name ?? ''),
        description: String(m.description ?? ''),
        amountMajor: typeof m.amount === 'number' && m.amount > 0 ? fromPaise(m.amount) : 0,
        percentage: m.percentage != null ? String(m.percentage) : '',
        dueDate: isoDateOnly(m.dueDate),
      };
    }),
  };
}

function validateStep(step: number, form: WizardFormState): string | null {
  if (step === 0 && !form.clientId.trim()) {
    return 'Select the client this similar project is for.';
  }
  if (step === 1) {
    if (!form.requestTitle.trim()) return 'Request title is required.';
    if (!form.requestDescription.trim()) return 'Request description is required.';
    if (!form.requestCategory.trim()) return 'Request category is required.';
  }
  if (step === 2) {
    const filled = form.items.filter((i) => i.description.trim());
    if (filled.length === 0) return 'Add at least one quote line item.';
    for (const item of filled) {
      if (item.quantity <= 0) return 'Each line item needs quantity of at least 1.';
      if (item.unitPrice <= 0) return 'Each line item needs a unit price greater than 0.';
    }
    const { grandTotal } = calculateQuoteTotals(form.items, form.taxPercentage);
    if (grandTotal <= 0) return 'Quote total must be greater than zero.';
    if (!form.validUntil) return 'Set a valid-until date.';
    const expiry = new Date(`${form.validUntil}T23:59:59`);
    if (Number.isNaN(expiry.getTime()) || expiry.getTime() < Date.now()) {
      return 'Valid-until date must be in the future.';
    }
    if (!form.quoteTitle.trim()) return 'Quote title is required.';
  }
  return null;
}

export function AdminDuplicateProjectWizard({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardFormState | null>(null);

  const previewQ = useQuery({
    queryKey: [...adminKeys.root, 'project', projectId, 'duplicate-preview'],
    queryFn: () => apiServices.admin.getProjectDuplicatePreview(projectId),
    enabled: open && Boolean(projectId),
  });

  const preview = useMemo(() => previewRecord(previewQ.data), [previewQ.data]);
  const sourceClient =
    preview.meta &&
    typeof preview.meta === 'object' &&
    (preview.meta as Record<string, unknown>).sourceClient &&
    typeof (preview.meta as Record<string, unknown>).sourceClient === 'object'
      ? ((preview.meta as Record<string, unknown>).sourceClient as Record<string, unknown>)
      : null;
  const warnings = useMemo(() => {
    if (!preview.meta || typeof preview.meta !== 'object') return [];
    const list = (preview.meta as Record<string, unknown>).warnings;
    return Array.isArray(list) ? list.map(String) : [];
  }, [preview.meta]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setForm(null);
      return;
    }
    if (previewQ.data && !form) {
      setForm(buildInitialState(preview));
    }
  }, [open, previewQ.data, preview, form]);

  const totals = useMemo(() => {
    if (!form) return { subtotal: 0, taxAmount: 0, grandTotal: 0 };
    return calculateQuoteTotals(form.items, form.taxPercentage);
  }, [form]);

  const createM = useMutation({
    mutationFn: () => {
      if (!form) throw new Error('Form not ready');
      const scope =
        preview.quote && typeof preview.quote === 'object'
          ? (preview.quote as Record<string, unknown>).scope
          : undefined;
      const technicalDetails =
        preview.quote && typeof preview.quote === 'object'
          ? (preview.quote as Record<string, unknown>).technicalDetails
          : undefined;

      return apiServices.admin.createProjectFromTemplate({
        sourceProjectId: projectId,
        clientId: form.clientId,
        adminId: form.adminId.trim() || undefined,
        lifecycle: 'quote_draft',
        request: {
          title: form.requestTitle.trim(),
          description: form.requestDescription.trim(),
          category: form.requestCategory.trim(),
        },
        quote: {
          title: form.quoteTitle.trim(),
          description: form.quoteDescription.trim(),
          items: form.items
            .filter((i) => i.description.trim())
            .map((i) => ({
              description: i.description.trim(),
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
          taxPercentage: form.taxPercentage,
          currency: form.currency,
          validUntil: new Date(`${form.validUntil}T23:59:59`).toISOString(),
          termsAndConditions: form.terms.trim() || undefined,
          internalNotes: form.internalNotes.trim() || undefined,
          scope,
          technicalDetails,
        },
        project: form.targetEndDate ? { targetEndDate: form.targetEndDate } : undefined,
        milestones: form.milestones
          .filter((m) => m.name.trim())
          .map((m) => ({
            name: m.name.trim(),
            description: m.description.trim() || undefined,
            amount: m.amountMajor > 0 ? toPaise(m.amountMajor) : undefined,
            percentage: m.percentage.trim() ? Number(m.percentage) : undefined,
            dueDate: m.dueDate || undefined,
          })),
      });
    },
    onSuccess: (data) => {
      const record = pickAdminRecord(data);
      const quoteId = record?.quoteId ? String(record.quoteId) : '';
      toast.success('Draft quote created. Review and send it to the client when ready.');
      onOpenChange(false);
      void qc.invalidateQueries({ queryKey: adminKeys.quotes() });
      void qc.invalidateQueries({ queryKey: [...adminKeys.root, 'projects'] });
      if (quoteId) {
        router.push(`/quotes/${encodeURIComponent(quoteId)}`);
      }
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create from template')),
  });

  function patchForm(patch: Partial<WizardFormState>) {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function goNext() {
    if (!form) return;
    const err = validateStep(step, form);
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleSubmit() {
    if (!form) return;
    for (let i = 0; i <= 2; i++) {
      const err = validateStep(i, form);
      if (err) {
        toast.error(err);
        setStep(i);
        return;
      }
    }
    createM.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle>Use project as template</DialogTitle>
        <DialogDescription>
          Create a similar engagement for a client. You will get a draft quote to review and send —
          no payments or messages are copied.
        </DialogDescription>

        <div className="mt-4 flex flex-wrap gap-2">
          {STEPS.map((label, idx) => (
            <span
              key={label}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                idx === step
                  ? 'bg-primary text-primary-foreground'
                  : idx < step
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {idx + 1}. {label}
            </span>
          ))}
        </div>

        {previewQ.isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading template…</p>
        ) : null}

        {previewQ.isError ? (
          <p className="mt-6 text-sm text-destructive">
            {getApiErrorMessage(previewQ.error, 'Could not load project template')}
          </p>
        ) : null}

        {form && !previewQ.isLoading && !previewQ.isError ? (
          <div className="mt-6 space-y-4">
            {step === 0 ? (
              <>
                {sourceClient ? (
                  <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    Template from client{' '}
                    <span className="font-medium text-foreground">
                      {String(sourceClient.name ?? sourceClient.email ?? '')}
                    </span>
                    . Pick the client for this new engagement below.
                  </div>
                ) : null}
                <div className="space-y-1">
                  <FormFieldLabel fieldKey="projects.templateClient" label="Client" required>
                    Client for new project
                  </FormFieldLabel>
                  <UserSearchCombobox
                    mode="single"
                    roleFilter="USER"
                    value={form.clientId || undefined}
                    displayName={form.clientLabel || undefined}
                    placeholder="Search clients by name or email…"
                    onChange={(id, user) => {
                      patchForm({
                        clientId: id ?? '',
                        clientLabel: user ? `${user.name} · ${user.email}` : '',
                      });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <FormFieldLabel fieldKey="projects.templateAdmin" label="Assigned operator">
                    Assigned admin (optional)
                  </FormFieldLabel>
                  <input
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
                    placeholder="Admin user UUID (defaults to you)"
                    value={form.adminId}
                    onChange={(e) => patchForm({ adminId: e.target.value })}
                  />
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <div className="space-y-1">
                  <FormFieldLabel fieldKey="requests.title" label="Request title" required>
                    Request title
                  </FormFieldLabel>
                  <input
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={form.requestTitle}
                    onChange={(e) => patchForm({ requestTitle: e.target.value })}
                    placeholder="e.g. Redesign marketing site"
                  />
                </div>
                <div className="space-y-1">
                  <FormFieldLabel fieldKey="requests.description" label="Description" required>
                    Description
                  </FormFieldLabel>
                  <textarea
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={form.requestDescription}
                    onChange={(e) => patchForm({ requestDescription: e.target.value })}
                    placeholder="Goals, constraints, and what success looks like…"
                  />
                </div>
                <div className="space-y-1">
                  <FormFieldLabel fieldKey="requests.category" label="Category" required>
                    Category
                  </FormFieldLabel>
                  <input
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={form.requestCategory}
                    onChange={(e) => patchForm({ requestCategory: e.target.value })}
                    placeholder="webDevelopment"
                  />
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div className="space-y-1">
                  <FormFieldLabel fieldKey="quotes.title" label="Quote title" required>
                    Quote title
                  </FormFieldLabel>
                  <input
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={form.quoteTitle}
                    onChange={(e) => patchForm({ quoteTitle: e.target.value })}
                    placeholder="e.g. Marketing site — fixed price"
                  />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <FormFieldLabel fieldKey="quotes.lineItemDescription" label="Line items" required>
                    Line items
                  </FormFieldLabel>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => patchForm({ items: [...form.items, defaultLineItem()] })}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add row
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-border/70">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                        <th className="px-2 py-2">Description</th>
                        <th className="w-20 px-2 py-2">Qty</th>
                        <th className="w-28 px-2 py-2">Unit</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="px-2 py-1">
                            <input
                              className="w-full rounded border border-border px-2 py-1.5 text-sm"
                              value={item.description}
                              onChange={(e) => {
                                const next = [...form.items];
                                next[idx] = { ...item, description: e.target.value };
                                patchForm({ items: next });
                              }}
                              placeholder="What the client receives in this phase…"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              min={1}
                              className="w-full rounded border border-border px-2 py-1.5 text-sm"
                              value={item.quantity || ''}
                              onChange={(e) => {
                                const next = [...form.items];
                                next[idx] = {
                                  ...item,
                                  quantity: Math.max(1, Number(e.target.value) || 1),
                                };
                                patchForm({ items: next });
                              }}
                              placeholder="1"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              className="w-full rounded border border-border px-2 py-1.5 text-sm"
                              value={item.unitPrice || ''}
                              onChange={(e) => {
                                const next = [...form.items];
                                next[idx] = {
                                  ...item,
                                  unitPrice: Math.max(0, Number(e.target.value) || 0),
                                };
                                patchForm({ items: next });
                              }}
                              placeholder="50000"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <button
                              type="button"
                              className="rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-30"
                              disabled={form.items.length <= 1}
                              onClick={() =>
                                patchForm({ items: form.items.filter((_, i) => i !== idx) })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <FormFieldLabel fieldKey="quotes.currency" label="Currency">
                      Currency
                    </FormFieldLabel>
                    <select
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={form.currency}
                      onChange={(e) => patchForm({ currency: e.target.value })}
                    >
                      {PLATFORM_CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <FormFieldLabel fieldKey="quotes.taxPercentage" label="Tax %">
                      Tax %
                    </FormFieldLabel>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={form.taxPercentage}
                      onChange={(e) =>
                        patchForm({ taxPercentage: Math.max(0, Number(e.target.value) || 0) })
                      }
                      placeholder="18"
                    />
                  </div>
                  <div className="space-y-1">
                    <FormFieldLabel fieldKey="quotes.validUntil" label="Valid until" required>
                      Valid until
                    </FormFieldLabel>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={form.validUntil}
                      onChange={(e) => patchForm({ validUntil: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-sm font-medium tabular-nums">
                  Total: {formatCurrency(totals.grandTotal, form.currency)}
                </p>
                <div className="space-y-1">
                  <FormFieldLabel fieldKey="quotes.termsAndConditions" label="Terms">
                    Terms & conditions
                  </FormFieldLabel>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={form.terms}
                    onChange={(e) => patchForm({ terms: e.target.value })}
                    placeholder="e.g. Two revision rounds per milestone"
                  />
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <div className="space-y-1">
                  <FormFieldLabel fieldKey="projects.targetEndDate" label="Target end date">
                    Target end date
                  </FormFieldLabel>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={form.targetEndDate}
                    onChange={(e) => patchForm({ targetEndDate: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Milestone plan</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      patchForm({
                        milestones: [
                          ...form.milestones,
                          {
                            name: '',
                            description: '',
                            amountMajor: 0,
                            percentage: '',
                            dueDate: '',
                          },
                        ],
                      })
                    }
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add milestone
                  </Button>
                </div>
                {form.milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No milestones copied. Payment milestones will be generated from the quote when
                    the client accepts.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {form.milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className="grid gap-2 rounded-lg border border-border/70 p-3 sm:grid-cols-2"
                      >
                        <input
                          placeholder="Milestone name"
                          className="rounded border border-border px-2 py-1.5 text-sm sm:col-span-2"
                          value={m.name}
                          onChange={(e) => {
                            const next = [...form.milestones];
                            next[idx] = { ...m, name: e.target.value };
                            patchForm({ milestones: next });
                          }}
                        />
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="Amount"
                          className="rounded border border-border px-2 py-1.5 text-sm"
                          value={m.amountMajor || ''}
                          onChange={(e) => {
                            const next = [...form.milestones];
                            next[idx] = {
                              ...m,
                              amountMajor: Math.max(0, Number(e.target.value) || 0),
                            };
                            patchForm({ milestones: next });
                          }}
                        />
                        <input
                          type="date"
                          className="rounded border border-border px-2 py-1.5 text-sm"
                          value={m.dueDate}
                          onChange={(e) => {
                            const next = [...form.milestones];
                            next[idx] = { ...m, dueDate: e.target.value };
                            patchForm({ milestones: next });
                          }}
                        />
                        <button
                          type="button"
                          className="text-left text-xs text-destructive sm:col-span-2"
                          onClick={() =>
                            patchForm({ milestones: form.milestones.filter((_, i) => i !== idx) })
                          }
                        >
                          Remove milestone
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : null}

            {step === 4 ? (
              <>
                <ul className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
                  {warnings.map((w) => (
                    <li key={w}>• {w}</li>
                  ))}
                  <li>• New UUIDs will be generated for the request and quote.</li>
                  <li>• The project is created only after the client accepts the quote.</li>
                </ul>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Client</dt>
                    <dd className="text-right font-medium">{form.clientLabel || form.clientId}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Request</dt>
                    <dd className="text-right font-medium">{form.requestTitle}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Quote total</dt>
                    <dd className="text-right font-medium tabular-nums">
                      {formatCurrency(totals.grandTotal, form.currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Milestones</dt>
                    <dd className="text-right font-medium">
                      {form.milestones.filter((m) => m.name.trim()).length}
                    </dd>
                  </div>
                </dl>
              </>
            ) : null}

            <div className="flex justify-between gap-2 border-t border-border/60 pt-4">
              <Button type="button" variant="outline" disabled={step === 0} onClick={goBack}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={goNext}>
                    Next
                  </Button>
                ) : (
                  <Button type="button" disabled={createM.isPending} onClick={handleSubmit}>
                    {createM.isPending ? 'Creating…' : 'Create draft quote'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
