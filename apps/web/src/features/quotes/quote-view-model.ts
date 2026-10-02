import { DEFAULT_CURRENCY, STANDARD_QUOTE_TERMS } from '@nestlancer/constants';

import { asRecord } from '@/lib/client-api-view';

export type QuoteLineItemRow = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type QuoteScheduleRow = {
  label: string;
  percentage: number;
  amountPaise: number;
  dueOn: string;
};

export type QuoteDetailView = {
  lineItems: QuoteLineItemRow[];
  schedule: QuoteScheduleRow[];
  standardTerms?: string;
  additionalTerms?: string;
  /** @deprecated Use standardTerms / additionalTerms */
  terms?: string;
  requiresContract?: boolean;
  contractStatus?: 'pending' | 'signed';
  contractNumber?: string;
  contractSignedAt?: string;
  validUntil?: string;
  version?: string | number;
  requestTitle?: string;
  requestId?: string;
  subtotal?: number;
  tax?: number;
  taxPercentage?: number;
  total: number;
  currency: string;
};

export function extractQuoteDetailView(
  quote: unknown,
  fallbackCurrency: string = DEFAULT_CURRENCY
): QuoteDetailView {
  const q = asRecord(quote) ?? {};
  const currency = String(q.currency ?? fallbackCurrency);
  // Prefer explicit line items; paymentBreakdown may be either stored line items
  // (unitPrice/totalPrice) or a payment schedule (milestone/amount) — never mix them.
  const preferredItems = Array.isArray(q.items)
    ? q.items
    : Array.isArray(q.lineItems)
      ? q.lineItems
      : null;
  const breakdown = Array.isArray(q.paymentBreakdown) ? q.paymentBreakdown : [];
  const breakdownLooksLikeLineItems = breakdown.some((row) => {
    const o = asRecord(row);
    return o != null && ('unitPrice' in o || 'totalPrice' in o || 'description' in o);
  });
  const rawItems = preferredItems ?? (breakdownLooksLikeLineItems ? breakdown : []);

  const lineItems: QuoteLineItemRow[] = (rawItems as unknown[]).map((item, i) => {
    const o = asRecord(item) ?? {};
    const quantity = typeof o.quantity === 'number' ? o.quantity : Number(o.quantity) || 1;
    const unitPricePaise =
      typeof o.unitPrice === 'number'
        ? o.unitPrice
        : typeof o.unit_price === 'number'
          ? o.unit_price
          : Number(o.unitPrice ?? o.unit_price) || 0;
    const totalPaise =
      typeof o.totalPrice === 'number'
        ? o.totalPrice
        : typeof o.total === 'number'
          ? o.total
          : typeof o.amount === 'number'
            ? o.amount
            : unitPricePaise * quantity;
    return {
      id: String(o.id ?? `line-${i}`),
      description: String(o.description ?? o.title ?? o.name ?? o.milestone ?? 'Line item'),
      quantity,
      unitPrice: unitPricePaise > 0 ? unitPricePaise : totalPaise / Math.max(1, quantity),
      total: totalPaise,
    };
  });

  const scheduleSource = Array.isArray(q.paymentSchedule)
    ? q.paymentSchedule
    : !breakdownLooksLikeLineItems && breakdown.length > 0
      ? breakdown
      : Array.isArray(q.paymentBreakdown) && !breakdownLooksLikeLineItems
        ? q.paymentBreakdown
        : [];

  const schedule: QuoteScheduleRow[] = (scheduleSource as unknown[])
    .map((row) => {
      const o = asRecord(row) ?? {};
      const label = String(o.label ?? o.milestone ?? o.name ?? o.title ?? '').trim();
      const percentage = Number(o.percentage ?? 0) || 0;
      const amountPaise = Math.round(
        Number(o.amountPaise ?? o.amount ?? o.totalPrice ?? o.total ?? 0) || 0
      );
      const dueOn = String(
        o.dueOn ??
          (o.dueTrigger === 'on_accept'
            ? 'Upon acceptance'
            : o.dueTrigger === 'on_date'
              ? String(o.dueDate ?? '')
              : o.dueTrigger === 'on_prior_approved'
                ? 'Upon prior milestone approval'
                : '')
      ).trim();
      if (!label && percentage <= 0 && amountPaise <= 0) return null;
      return {
        label: label || 'Installment',
        percentage,
        amountPaise,
        dueOn,
      };
    })
    .filter((row): row is QuoteScheduleRow => row != null);

  const totalRaw = q.totalAmount ?? q.total ?? q.amount;
  const total =
    typeof totalRaw === 'number' ? totalRaw : lineItems.reduce((s, l) => s + l.total, 0);

  const validRaw = q.validUntil ?? q.expiresAt ?? q.expiryDate;
  let validUntil: string | undefined;
  if (validRaw) {
    const d = new Date(String(validRaw));
    validUntil = Number.isNaN(d.getTime())
      ? String(validRaw)
      : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
  }

  const request = asRecord(q.request);
  const requestTitle =
    request?.title != null
      ? String(request.title)
      : q.requestTitle != null
        ? String(q.requestTitle)
        : undefined;
  const requestId =
    typeof q.requestId === 'string'
      ? q.requestId
      : request?.id != null
        ? String(request.id)
        : undefined;

  const standardTermsRaw =
    q.terms != null && String(q.terms).trim() ? String(q.terms).trim() : undefined;
  const additionalTerms =
    q.termsAndConditions != null && String(q.termsAndConditions).trim()
      ? String(q.termsAndConditions).trim()
      : undefined;
  const standardTerms = standardTermsRaw ?? STANDARD_QUOTE_TERMS;

  const contractStatusRaw = q.contractStatus;
  const contractStatus =
    contractStatusRaw === 'signed' || contractStatusRaw === 'pending'
      ? contractStatusRaw
      : q.acceptedAt
        ? 'signed'
        : 'pending';
  const contractSignedRaw = q.contractSignedAt ?? q.acceptedAt;
  let contractSignedAt: string | undefined;
  if (contractSignedRaw) {
    const d = new Date(String(contractSignedRaw));
    contractSignedAt = Number.isNaN(d.getTime())
      ? String(contractSignedRaw)
      : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
  }

  return {
    lineItems,
    schedule,
    standardTerms,
    additionalTerms,
    terms: standardTerms ?? additionalTerms,
    requiresContract: q.requiresContract !== false,
    contractStatus,
    contractNumber: q.contractNumber != null ? String(q.contractNumber) : undefined,
    contractSignedAt,
    validUntil,
    version:
      q.version != null
        ? (q.version as string | number)
        : q.revision != null
          ? (q.revision as string | number)
          : undefined,
    requestTitle,
    requestId,
    subtotal: typeof q.subtotal === 'number' ? q.subtotal : undefined,
    tax:
      typeof q.tax === 'number' ? q.tax : typeof q.taxAmount === 'number' ? q.taxAmount : undefined,
    taxPercentage: typeof q.taxPercentage === 'number' ? q.taxPercentage : undefined,
    total,
    currency,
  };
}
