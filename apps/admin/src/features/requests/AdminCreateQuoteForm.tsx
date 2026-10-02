'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';
import { ChevronLeft, ChevronRight } from '@nestlancer/ui/icons';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { DEFAULT_CURRENCY, PLATFORM_CURRENCIES, STANDARD_QUOTE_TERMS } from '@nestlancer/constants';
import { createQuoteSchema, type CreateQuoteInput } from '@nestlancer/validators';
import { formatCurrency, formatMoneyFromPaise } from '@nestlancer/utils';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, cn } from '@nestlancer/ui';

import { adminKeys } from '@/lib/admin-query-keys';
import { apiServices } from '@/lib/axios';
import {
  defaultPaymentScheduleSelection,
  paymentScheduleApiFields,
  PaymentScheduleSection,
  type PaymentScheduleSelection,
} from '@/features/quotes/PaymentScheduleSection';
import { QuoteLineItemsEditor } from '@/features/quotes/QuoteLineItemsEditor';
import { QuoteSummaryPanel } from '@/features/quotes/QuoteSummaryPanel';
import { QUOTE_FORM_TABS, type QuoteFormTab } from '@/features/quotes/quote-builder-types';
import {
  countFilledItems,
  groupsFromPresets,
  itemsFromGroups,
  newGroup,
  type QuoteLineItemGroup,
} from '@/features/quotes/quote-line-item-groups';

export type AdminCreateQuoteFormProps = {
  requestId: string;
  requestTitle?: string;
  clientBudget?: { min?: number; max?: number; currency?: string; flexible?: boolean };
  category?: string;
  variant?: 'embedded' | 'fullscreen';
  onCreated?: () => void;
};

const DEFAULT_VALIDITY_DAYS = 14;

const ADDITIONAL_TERMS_PLACEHOLDER =
  'e.g. Client provides brand assets within 5 business days of kickoff. Two revision rounds per milestone.';

type LineItemPreset = { label: string; description: string; quantity: number; unitPrice: number };

const PRESETS_BY_CATEGORY: Record<string, LineItemPreset[]> = {
  webDevelopment: [
    {
      label: 'Discovery',
      description: 'Requirements workshop, technical specification, and delivery plan',
      quantity: 1,
      unitPrice: 0,
    },
    {
      label: 'Build',
      description: 'Design and development per the client brief (frontend, backend, integrations)',
      quantity: 1,
      unitPrice: 0,
    },
    {
      label: 'Launch',
      description: 'QA, deployment, documentation, and post-launch handover support',
      quantity: 1,
      unitPrice: 0,
    },
  ],
  mobileApp: [
    {
      label: 'Discovery',
      description: 'UX flows, platform scope (iOS/Android), and technical architecture',
      quantity: 1,
      unitPrice: 0,
    },
    {
      label: 'Development',
      description: 'App build, API integration, and device testing',
      quantity: 1,
      unitPrice: 0,
    },
    {
      label: 'Release',
      description: 'Store submission support, QA, and launch handover',
      quantity: 1,
      unitPrice: 0,
    },
  ],
};

const DEFAULT_PRESETS: LineItemPreset[] = [
  {
    label: 'Phase 1 — Setup',
    description: 'Kickoff, planning, and environment or account setup',
    quantity: 1,
    unitPrice: 0,
  },
  {
    label: 'Phase 2 — Delivery',
    description: 'Core work described in the client request',
    quantity: 1,
    unitPrice: 0,
  },
  {
    label: 'Phase 3 — Wrap-up',
    description: 'Review, revisions, documentation, and handover',
    quantity: 1,
    unitPrice: 0,
  },
];

function defaultValidUntilDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + DEFAULT_VALIDITY_DAYS);
  return d.toISOString().slice(0, 10);
}

function presetsForCategory(category: string | undefined): LineItemPreset[] {
  const key = (category ?? '').replace(/\s+/g, '');
  return PRESETS_BY_CATEGORY[key] ?? DEFAULT_PRESETS;
}

export function AdminCreateQuoteForm({
  requestId,
  requestTitle,
  clientBudget,
  category,
  variant = 'embedded',
  onCreated,
}: AdminCreateQuoteFormProps) {
  const qc = useQueryClient();
  const initialCurrency =
    typeof clientBudget?.currency === 'string' && clientBudget.currency.length >= 3
      ? clientBudget.currency.toUpperCase().slice(0, 3)
      : DEFAULT_CURRENCY;

  const [groups, setGroups] = useState<QuoteLineItemGroup[]>([newGroup('Phase 1')]);
  const [currency, setCurrency] = useState(initialCurrency);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [validUntil, setValidUntil] = useState(defaultValidUntilDate());
  const [requiresContract, setRequiresContract] = useState(true);
  const [additionalTerms, setAdditionalTerms] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [activeTab, setActiveTab] = useState<QuoteFormTab>('items');
  const [schedule, setSchedule] = useState<PaymentScheduleSelection>(
    defaultPaymentScheduleSelection('50-50')
  );
  const [sourceQuoteId, setSourceQuoteId] = useState('');
  const [prefillPending, setPrefillPending] = useState(false);

  const items = useMemo(() => itemsFromGroups(groups), [groups]);
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Math.max(0, item.quantity) * Math.max(0, item.unitPrice),
        0
      ),
    [items]
  );
  const taxAmount = useMemo(
    () => (subtotal * Math.max(0, taxPercentage)) / 100,
    [subtotal, taxPercentage]
  );
  const grandTotal = subtotal + taxAmount;
  const filledCount = useMemo(() => countFilledItems(groups), [groups]);

  const budgetHint =
    typeof clientBudget?.min === 'number' && typeof clientBudget?.max === 'number'
      ? `${formatMoneyFromPaise(clientBudget.min, initialCurrency)} – ${formatMoneyFromPaise(clientBudget.max, initialCurrency)}${
          clientBudget.flexible ? ' (flexible)' : ''
        }`
      : null;

  const createQuoteM = useMutation({
    mutationFn: (payload: CreateQuoteInput) =>
      apiServices.admin.createQuoteFromRequest(requestId, payload),
    onSuccess: async () => {
      toast.success('Quote created. Review totals, then send it to the client when ready.');
      await qc.invalidateQueries({ queryKey: adminKeys.request(requestId) });
      void qc.invalidateQueries({ queryKey: adminKeys.requests() });
      void qc.invalidateQueries({ queryKey: adminKeys.quotes() });
      onCreated?.();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create quote')),
  });

  async function loadPrefill() {
    const id = sourceQuoteId.trim();
    if (!id) {
      toast.error('Enter a source quote UUID to load prefill.');
      return;
    }
    setPrefillPending(true);
    try {
      const raw = await apiServices.admin.suggestQuotePrefill(requestId, { sourceQuoteId: id });
      const rec = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
      const data =
        rec.data && typeof rec.data === 'object' ? (rec.data as Record<string, unknown>) : rec;
      const suggested = Array.isArray(data.suggestedItems)
        ? (data.suggestedItems as Array<{
            description?: string;
            quantity?: number;
            unitPrice?: number;
          }>)
        : [];
      if (suggested.length) {
        setGroups([
          newGroup(
            'Deliverables',
            suggested.map((item) => ({
              description: String(item.description ?? ''),
              quantity: Math.max(1, Number(item.quantity ?? 1)),
              unitPrice: Math.max(0, Number(item.unitPrice ?? 0)),
            }))
          ),
        ]);
      }
      if (typeof data.suggestedSchedulePreset === 'string' && data.suggestedSchedulePreset) {
        setSchedule(defaultPaymentScheduleSelection(String(data.suggestedSchedulePreset)));
      }
      if (typeof data.suggestedTermsAndConditions === 'string') {
        setAdditionalTerms(String(data.suggestedTermsAndConditions));
      }
      if (typeof data.suggestedTaxPercentage === 'number') {
        setTaxPercentage(Number(data.suggestedTaxPercentage));
      }
      if (typeof data.suggestedCurrency === 'string') {
        setCurrency(String(data.suggestedCurrency).toUpperCase().slice(0, 3));
      }
      toast.success('Prefill loaded — review phases and pricing before creating.');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Could not load prefill'));
    } finally {
      setPrefillPending(false);
    }
  }

  function quoteValidUntilIso(value: string): string {
    if (!value) return '';
    const expiry = new Date(`${value}T23:59:59`);
    if (Number.isNaN(expiry.getTime())) return '';
    return expiry.toISOString();
  }

  function handleSubmit() {
    const scheduleFields = paymentScheduleApiFields(schedule);
    const parsed = createQuoteSchema.safeParse({
      items: items
        .filter((item) => item.description.trim())
        .map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      currency,
      taxPercentage,
      validUntil: quoteValidUntilIso(validUntil),
      termsAndConditions: additionalTerms.trim() || undefined,
      internalNotes: internalNotes.trim() || undefined,
      requiresContract,
      schedulePreset: scheduleFields.schedulePreset,
      paymentSchedule:
        schedule.mode === 'custom' ? schedule.customRows : scheduleFields.paymentSchedule,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Check the quote.');
      return;
    }
    createQuoteM.mutate(parsed.data);
  }

  function applyPresets() {
    setGroups(groupsFromPresets(presetsForCategory(category)));
    toast.message('Phase template applied — set unit prices for each deliverable.');
  }

  const stepIndex = QUOTE_FORM_TABS.findIndex((t) => t.id === activeTab);
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= QUOTE_FORM_TABS.length - 1;

  return (
    <section
      className={cn(
        'ge-card overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm',
        variant === 'fullscreen' && 'min-h-0 flex-1'
      )}
    >
      <header className="border-b border-border/60 bg-muted/20 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Quote builder</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Structure the project into phases, price each deliverable, then set payment terms.
            </p>
            {requestTitle ? (
              <p className="mt-1 text-xs text-muted-foreground">
                For: <span className="font-medium text-foreground">{requestTitle}</span>
              </p>
            ) : null}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-xs text-muted-foreground">Live total</p>
            <p className="font-display text-2xl font-semibold tabular-nums text-primary">
              {formatCurrency(grandTotal, currency)}
            </p>
          </div>
        </div>

        <nav className="mt-4 flex flex-wrap gap-1" aria-label="Quote builder steps">
          {QUOTE_FORM_TABS.map((tab, i) => (
            <button
              key={tab.id}
              type="button"
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="mr-1.5 text-xs opacity-70">{i + 1}.</span>
              {tab.short}
            </button>
          ))}
        </nav>
      </header>

      <div
        className={cn(
          'grid gap-0',
          variant === 'fullscreen' ? 'xl:grid-cols-[1fr_18rem]' : 'xl:grid-cols-[1fr_17rem]'
        )}
      >
        <div
          className={cn(
            'min-w-0 space-y-6 p-4 sm:p-6',
            variant === 'fullscreen' && 'max-h-[calc(100vh-12rem)] overflow-y-auto'
          )}
        >
          {activeTab === 'items' ? (
            <QuoteLineItemsEditor
              groups={groups}
              onChange={setGroups}
              currency={currency}
              onApplyPresets={applyPresets}
              presetLabel="Apply phase template"
              showPrefill
              sourceQuoteId={sourceQuoteId}
              onSourceQuoteIdChange={setSourceQuoteId}
              onLoadPrefill={() => void loadPrefill()}
              prefillPending={prefillPending}
            />
          ) : null}

          {activeTab === 'pricing' ? (
            <div className="space-y-6">
              <PaymentScheduleSection
                currency={currency}
                totalMajor={grandTotal}
                value={schedule}
                onChange={setSchedule}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <FormFieldLabel
                    htmlFor="quote-currency"
                    fieldKey="quotes.currency"
                    label="Currency"
                    required
                  >
                    Currency
                  </FormFieldLabel>
                  <select
                    id="quote-currency"
                    value={currency}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    {PLATFORM_CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <FormFieldLabel
                    htmlFor="quote-tax"
                    fieldKey="quotes.taxPercentage"
                    label="Tax (%)"
                  >
                    Tax (%)
                  </FormFieldLabel>
                  <input
                    id="quote-tax"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={taxPercentage}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm tabular-nums"
                    onChange={(e) => setTaxPercentage(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="18"
                  />
                </div>
                <div className="space-y-2">
                  <FormFieldLabel
                    htmlFor="quote-valid-until"
                    fieldKey="quotes.validUntil"
                    label="Valid until"
                    required
                  >
                    Valid until
                  </FormFieldLabel>
                  <input
                    id="quote-valid-until"
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={validUntil}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'terms' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <FormFieldLabel fieldKey="quotes.terms" label="Standard terms">
                  Standard Nestlancer terms (always included)
                </FormFieldLabel>
                <div
                  className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap"
                  aria-readonly
                >
                  {STANDARD_QUOTE_TERMS}
                </div>
                <p className="text-xs text-muted-foreground">
                  Snapshotted onto the quote when you create it. Clients see these with any
                  project-specific terms below.
                </p>
              </div>
              <div className="space-y-2">
                <FormFieldLabel
                  htmlFor="quote-additional-terms"
                  fieldKey="quotes.termsAndConditions"
                  label="Additional terms"
                >
                  Project-specific terms (optional)
                </FormFieldLabel>
                <textarea
                  id="quote-additional-terms"
                  rows={6}
                  maxLength={2000}
                  placeholder={ADDITIONAL_TERMS_PLACEHOLDER}
                  value={additionalTerms}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  onChange={(e) => setAdditionalTerms(e.target.value)}
                />
                <div className="flex justify-end text-xs text-muted-foreground">
                  {additionalTerms.length}/2000
                </div>
              </div>
              <label className="flex items-start gap-2 rounded-md border border-border bg-muted/20 px-3 py-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={requiresContract}
                  onChange={(e) => setRequiresContract(e.target.checked)}
                />
                <span>
                  <span className="font-medium">Require signed service agreement</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Client must review and sign the Nestlancer service agreement when accepting this
                    quote.
                  </span>
                </span>
              </label>
              <div className="space-y-2">
                <FormFieldLabel
                  htmlFor="quote-internal-notes"
                  fieldKey="quotes.internalNotes"
                  label="Internal notes"
                >
                  Internal notes (not sent to client)
                </FormFieldLabel>
                <textarea
                  id="quote-internal-notes"
                  rows={4}
                  maxLength={1000}
                  placeholder="Team-only context, discount approvals, delivery risks…"
                  value={internalNotes}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  onChange={(e) => setInternalNotes(e.target.value)}
                />
                <span className="text-xs text-muted-foreground">{internalNotes.length}/1000</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border/60 bg-muted/10 p-4 xl:border-l xl:border-t-0">
          <QuoteSummaryPanel
            currency={currency}
            subtotal={subtotal}
            taxPercentage={taxPercentage}
            taxAmount={taxAmount}
            grandTotal={grandTotal}
            lineCount={filledCount}
            phaseCount={groups.length}
            budgetHint={budgetHint}
            activeStep={activeTab}
            validUntil={validUntil}
          />
        </div>
      </div>

      <footer className="flex flex-col gap-3 border-t border-border/60 bg-muted/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFirst}
            onClick={() => setActiveTab(QUOTE_FORM_TABS[stepIndex - 1]!.id)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
            Back
          </Button>
          {!isLast ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveTab(QUOTE_FORM_TABS[stepIndex + 1]!.id)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
            </Button>
          ) : null}
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground sm:mr-2">
            {grandTotal <= 0
              ? 'Price each deliverable to enable create.'
              : `${filledCount} line item${filledCount === 1 ? '' : 's'} across ${groups.length} phase${groups.length === 1 ? '' : 's'}`}
          </p>
          <Button
            type="button"
            className="shrink-0 rounded-lg font-semibold"
            disabled={createQuoteM.isPending}
            onClick={handleSubmit}
          >
            {createQuoteM.isPending
              ? 'Creating quote…'
              : grandTotal > 0
                ? `Create quote · ${formatCurrency(grandTotal, currency)}`
                : 'Create quote'}
          </Button>
        </div>
      </footer>
    </section>
  );
}
