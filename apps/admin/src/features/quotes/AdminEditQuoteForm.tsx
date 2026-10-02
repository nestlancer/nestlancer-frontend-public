'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@nestlancer/ui';
import { ChevronLeft, ChevronRight } from '@nestlancer/ui/icons';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { DEFAULT_CURRENCY, PLATFORM_CURRENCIES, STANDARD_QUOTE_TERMS } from '@nestlancer/constants';
import { formatCurrency, formatMoneyFromPaise } from '@nestlancer/utils';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, cn } from '@nestlancer/ui';

import {
  calculateQuoteTotals,
  canAdminSendQuote,
  defaultValidUntilDate,
  isChangesRequestedStatus,
  isQuoteEditable,
  parseClientChangeNotes,
  parsePaymentBreakdown,
  quoteRecordFromPayload,
} from '@/features/quotes/admin-quote-utils';
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
  groupsFromFlatItems,
  itemsFromGroups,
  newGroup,
  type QuoteLineItemGroup,
} from '@/features/quotes/quote-line-item-groups';
import { adminKeys } from '@/lib/admin-query-keys';
import { apiServices } from '@/lib/axios';
import type { PaymentScheduleInstallment, PaymentSchedulePresetId } from '@nestlancer/types';

const ADDITIONAL_TERMS_PLACEHOLDER =
  'e.g. Client provides brand assets within 5 business days of kickoff. Two revision rounds per milestone.';

export type AdminEditQuoteFormProps = {
  quoteId: string;
  onSaved?: () => void;
  onSend?: () => void;
  sendPending?: boolean;
  /** @deprecated Use variant="embedded" */
  compact?: boolean;
  variant?: 'embedded' | 'fullscreen';
};

function ClientFeedbackBanner({
  clientFeedback,
}: {
  clientFeedback: NonNullable<ReturnType<typeof parseClientChangeNotes>>;
}) {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-4">
      <h4 className="text-sm font-semibold text-amber-950 dark:text-amber-100">
        Client change request
      </h4>
      <ul className="mt-3 space-y-2 text-sm text-amber-900/90 dark:text-amber-100/90">
        {clientFeedback.changes.map((c, i) => (
          <li key={`${c.area}-${i}`}>
            <span className="font-medium capitalize">{c.area.replace(/_/g, ' ')}:</span> {c.request}
          </li>
        ))}
      </ul>
      {clientFeedback.additionalNotes ? (
        <p className="mt-3 text-sm text-amber-800/90 dark:text-amber-200/90">
          <span className="font-medium">Additional notes:</span> {clientFeedback.additionalNotes}
        </p>
      ) : null}
    </div>
  );
}

export function AdminEditQuoteForm({
  quoteId,
  onSaved,
  onSend,
  sendPending,
  compact,
  variant: variantProp,
}: AdminEditQuoteFormProps) {
  const variant = variantProp ?? (compact ? 'embedded' : 'fullscreen');
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: adminKeys.quote(quoteId),
    queryFn: () => apiServices.admin.getAdminQuote(quoteId),
  });

  const record = useMemo(() => quoteRecordFromPayload(q.data), [q.data]);
  const status = String(record.status ?? '');
  const editable = isQuoteEditable(status);
  const changesRequested = isChangesRequestedStatus(status);
  const clientFeedback = useMemo(
    () => parseClientChangeNotes(record.clientNotes),
    [record.clientNotes]
  );
  const showSend = onSend && canAdminSendQuote(status);

  const [groups, setGroups] = useState<QuoteLineItemGroup[]>([newGroup('Phase 1')]);
  const items = useMemo(() => itemsFromGroups(groups), [groups]);
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [validUntil, setValidUntil] = useState(defaultValidUntilDate());
  const [requiresContract, setRequiresContract] = useState(true);
  const [additionalTerms, setAdditionalTerms] = useState('');
  const [standardTermsSnapshot, setStandardTermsSnapshot] = useState(STANDARD_QUOTE_TERMS);
  const [internalNotes, setInternalNotes] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<QuoteFormTab>('items');
  const [schedule, setSchedule] = useState<PaymentScheduleSelection>(
    defaultPaymentScheduleSelection('50-50')
  );
  const [existingSchedule, setExistingSchedule] = useState<PaymentScheduleInstallment[] | null>(
    null
  );

  useEffect(() => {
    if (!q.data || hydrated) return;
    const r = quoteRecordFromPayload(q.data);
    setGroups(groupsFromFlatItems(parsePaymentBreakdown(r.paymentBreakdown)));
    setCurrency(
      typeof r.currency === 'string' ? r.currency.toUpperCase().slice(0, 3) : DEFAULT_CURRENCY
    );
    setTaxPercentage(typeof r.taxPercentage === 'number' ? r.taxPercentage : 0);
    setStandardTermsSnapshot(
      typeof r.terms === 'string' && r.terms.trim() ? String(r.terms) : STANDARD_QUOTE_TERMS
    );
    setAdditionalTerms(
      typeof r.termsAndConditions === 'string' ? String(r.termsAndConditions) : ''
    );
    setRequiresContract(r.requiresContract !== false);
    setInternalNotes(String(r.internalNotes ?? r.notes ?? ''));
    if (r.validUntil) {
      const d = new Date(String(r.validUntil));
      if (!Number.isNaN(d.getTime())) setValidUntil(d.toISOString().slice(0, 10));
    }
    const scheduleRaw = r.paymentSchedule;
    if (Array.isArray(scheduleRaw) && scheduleRaw.length) {
      setExistingSchedule(scheduleRaw as PaymentScheduleInstallment[]);
      const pcts = (scheduleRaw as PaymentScheduleInstallment[])
        .map((row) => row.percentage)
        .filter((p): p is number => typeof p === 'number');
      const joined = pcts.join('-');
      const known: PaymentSchedulePresetId[] = [
        '50-50',
        '30-70',
        '30-40-30',
        '25-25-25-25',
        '100-upfront',
      ];
      if (joined === '100') {
        setSchedule(defaultPaymentScheduleSelection('100-upfront'));
      } else if (known.includes(joined as PaymentSchedulePresetId)) {
        setSchedule(defaultPaymentScheduleSelection(joined as PaymentSchedulePresetId));
      } else {
        setSchedule({
          mode: 'custom',
          presetId: 'custom',
          customRows: (scheduleRaw as PaymentScheduleInstallment[]).map((row) => ({
            label: row.label,
            percentage: row.percentage ?? 0,
            dueTrigger: row.dueTrigger,
          })),
        });
      }
    }
    setHydrated(true);
  }, [q.data, hydrated]);

  const { subtotal, taxAmount, grandTotal } = useMemo(
    () => calculateQuoteTotals(items, taxPercentage),
    [items, taxPercentage]
  );
  const filledCount = useMemo(() => countFilledItems(groups), [groups]);

  const saveM = useMutation({
    mutationFn: () =>
      apiServices.admin.patchAdminQuote(quoteId, {
        items: items.filter((i) => i.description.trim()),
        currency,
        taxPercentage,
        validUntil: new Date(`${validUntil}T23:59:59`).toISOString(),
        termsAndConditions: additionalTerms.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
        requiresContract,
        ...paymentScheduleApiFields(schedule),
      }),
    onSuccess: () => {
      toast.success(
        changesRequested ? 'Quote revised. Resend it to the client when ready.' : 'Quote updated.'
      );
      setHydrated(false);
      void qc.invalidateQueries({ queryKey: adminKeys.quote(quoteId) });
      void qc.invalidateQueries({ queryKey: adminKeys.quotes() });
      onSaved?.();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update quote')),
  });

  function validate(): string | null {
    const filled = items.filter((i) => i.description.trim());
    if (filled.length === 0) return 'Add at least one line item with a description.';
    for (const item of filled) {
      if (item.quantity <= 0) return 'Each line item needs quantity of at least 1.';
      if (item.unitPrice <= 0) return 'Each line item needs a unit price greater than 0.';
    }
    if (grandTotal <= 0) return 'Quote total must be greater than zero.';
    if (!validUntil) return 'Set a valid-until date.';
    const expiry = new Date(`${validUntil}T23:59:59`);
    if (Number.isNaN(expiry.getTime()) || expiry.getTime() < Date.now()) {
      return 'Valid-until date must be in the future.';
    }
    if (additionalTerms.length > 2000) {
      return 'Project-specific terms must be 2000 characters or fewer.';
    }
    if (internalNotes.length > 1000) return 'Internal notes must be 1000 characters or fewer.';
    if (schedule.mode === 'custom') {
      const pct = schedule.customRows.reduce((s, r) => s + r.percentage, 0);
      if (pct !== 100) return 'Custom payment schedule percentages must total 100%.';
    }
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    saveM.mutate();
  }

  const stepIndex = QUOTE_FORM_TABS.findIndex((t) => t.id === activeTab);
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= QUOTE_FORM_TABS.length - 1;

  if (q.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading quote…</p>;
  }
  if (q.isError) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(q.error, 'Could not load quote')}
      </p>
    );
  }

  if (!editable) {
    return (
      <section className="ge-card rounded-lg border border-border/70 bg-muted/20 p-5">
        <h3 className="font-semibold text-foreground">Quote locked</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This quote has status{' '}
          <span className="font-medium capitalize">{status.replace(/_/g, ' ')}</span> and can no
          longer be edited.
        </p>
        <p className="mt-3 text-lg font-semibold tabular-nums">
          {typeof record.totalAmount === 'number'
            ? formatMoneyFromPaise(Number(record.totalAmount), currency)
            : '—'}
        </p>
      </section>
    );
  }

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
            <h3 className="text-lg font-semibold text-foreground">
              {changesRequested ? 'Revise quote' : 'Edit quote'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {changesRequested
                ? 'Address the client feedback below, save, then resend the revised quote.'
                : 'Update phases, pricing, and terms before sending to the client.'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Status: <span className="font-medium capitalize">{status.replace(/_/g, ' ')}</span>
              {' · '}
              ID <span className="font-mono">{quoteId.slice(0, 8)}…</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-muted-foreground">Live total</p>
              <p className="font-display text-2xl font-semibold tabular-nums text-primary">
                {formatCurrency(grandTotal, currency)}
              </p>
            </div>
            {showSend ? (
              <Button
                type="button"
                className="shrink-0 rounded-lg font-semibold"
                disabled={sendPending || saveM.isPending}
                onClick={onSend}
              >
                {sendPending
                  ? 'Sending…'
                  : changesRequested
                    ? 'Resend to client'
                    : 'Send to client'}
              </Button>
            ) : null}
          </div>
        </div>

        <nav className="mt-4 flex flex-wrap gap-1" aria-label="Quote editor steps">
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
            <>
              {changesRequested && clientFeedback ? (
                <ClientFeedbackBanner clientFeedback={clientFeedback} />
              ) : changesRequested ? (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                  The client requested changes. Review their notes and update line items
                  accordingly.
                </div>
              ) : null}
              <QuoteLineItemsEditor groups={groups} onChange={setGroups} currency={currency} />
            </>
          ) : null}

          {activeTab === 'pricing' ? (
            <div className="space-y-6">
              <PaymentScheduleSection
                currency={currency}
                totalMajor={grandTotal}
                value={schedule}
                onChange={setSchedule}
                existingSchedule={existingSchedule}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <FormFieldLabel
                    htmlFor={`edit-currency-${quoteId}`}
                    fieldKey="quotes.currency"
                    label="Currency"
                    required
                  >
                    Currency
                  </FormFieldLabel>
                  <select
                    id={`edit-currency-${quoteId}`}
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
                    htmlFor={`edit-tax-${quoteId}`}
                    fieldKey="quotes.taxPercentage"
                    label="Tax (%)"
                  >
                    Tax (%)
                  </FormFieldLabel>
                  <input
                    id={`edit-tax-${quoteId}`}
                    type="number"
                    min={0}
                    value={taxPercentage}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm tabular-nums"
                    onChange={(e) => setTaxPercentage(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="18"
                  />
                </div>
                <div className="space-y-2">
                  <FormFieldLabel
                    htmlFor={`edit-valid-${quoteId}`}
                    fieldKey="quotes.validUntil"
                    label="Valid until"
                    required
                  >
                    Valid until
                  </FormFieldLabel>
                  <input
                    id={`edit-valid-${quoteId}`}
                    type="date"
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
                  Standard Nestlancer terms (included on this quote)
                </FormFieldLabel>
                <div
                  className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap"
                  aria-readonly
                >
                  {standardTermsSnapshot}
                </div>
                <p className="text-xs text-muted-foreground">
                  Fixed for this quote version. Create a revised quote if platform terms change.
                </p>
              </div>
              <div className="space-y-2">
                <FormFieldLabel
                  htmlFor={`edit-additional-terms-${quoteId}`}
                  fieldKey="quotes.termsAndConditions"
                  label="Additional terms"
                >
                  Project-specific terms (optional)
                </FormFieldLabel>
                <textarea
                  id={`edit-additional-terms-${quoteId}`}
                  rows={6}
                  maxLength={2000}
                  value={additionalTerms}
                  placeholder={ADDITIONAL_TERMS_PLACEHOLDER}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  onChange={(e) => setAdditionalTerms(e.target.value)}
                />
                <span className="text-xs text-muted-foreground">{additionalTerms.length}/2000</span>
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
                    Client signs the Nestlancer service agreement when accepting this quote.
                  </span>
                </span>
              </label>
              <div className="space-y-2">
                <FormFieldLabel
                  htmlFor={`edit-notes-${quoteId}`}
                  fieldKey="quotes.internalNotes"
                  label="Internal notes"
                >
                  Internal notes (not sent to client)
                </FormFieldLabel>
                <textarea
                  id={`edit-notes-${quoteId}`}
                  rows={4}
                  maxLength={1000}
                  value={internalNotes}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Team-only context, discount approvals, delivery risks…"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border/60 bg-muted/10 p-4 xl:sticky xl:top-0 xl:self-start xl:border-l xl:border-t-0">
          <QuoteSummaryPanel
            currency={currency}
            subtotal={subtotal}
            taxPercentage={taxPercentage}
            taxAmount={taxAmount}
            grandTotal={grandTotal}
            lineCount={filledCount}
            phaseCount={groups.length}
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            className="rounded-lg font-semibold"
            disabled={saveM.isPending}
            onClick={handleSave}
          >
            {saveM.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          {showSend ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-lg font-semibold"
              disabled={sendPending || saveM.isPending}
              onClick={onSend}
            >
              {sendPending ? 'Sending…' : changesRequested ? 'Resend' : 'Send'}
            </Button>
          ) : null}
        </div>
      </footer>
    </section>
  );
}
