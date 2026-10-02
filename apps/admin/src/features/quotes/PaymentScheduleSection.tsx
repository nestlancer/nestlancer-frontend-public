'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import type {
  PaymentScheduleDueTrigger,
  PaymentScheduleInstallment,
  PaymentSchedulePresetDefinition,
  PaymentSchedulePresetId,
} from '@nestlancer/types';
import { formatMoneyFromPaise } from '@nestlancer/utils';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, cn } from '@nestlancer/ui';

import { adminKeys } from '@/lib/admin-query-keys';
import { apiServices } from '@/lib/axios';

export type PaymentScheduleSelection = {
  mode: 'preset' | 'custom';
  /** Preset id when mode=preset; may be 'custom' when mode=custom. */
  presetId: PaymentSchedulePresetId | 'custom';
  /** Percentage-based rows for custom schedules (backend builds amounts from total). */
  customRows: Array<{
    label: string;
    percentage: number;
    dueTrigger: PaymentScheduleDueTrigger;
  }>;
};

type PaymentScheduleSectionProps = {
  currency: string;
  /** Quote total in major currency units (same as line-item unit prices). */
  totalMajor: number;
  value: PaymentScheduleSelection;
  onChange: (next: PaymentScheduleSelection) => void;
  /** Existing schedule from a loaded quote (for hydration preview). */
  existingSchedule?: PaymentScheduleInstallment[] | null;
  disabled?: boolean;
};

const FALLBACK_PRESETS: PaymentSchedulePresetDefinition[] = [
  {
    id: '50-50',
    label: '50% deposit / 50% on completion',
    description: 'Half upfront to start, half after final delivery approval.',
    installments: [
      { label: 'Deposit', percentage: 50, dueTrigger: 'on_accept', type: 'advance' },
      { label: 'Final payment', percentage: 50, dueTrigger: 'on_prior_approved', type: 'final' },
    ],
  },
  {
    id: '30-70',
    label: '30% deposit / 70% on completion',
    description: 'Lower upfront commitment; majority due after delivery approval.',
    installments: [
      { label: 'Deposit', percentage: 30, dueTrigger: 'on_accept', type: 'advance' },
      { label: 'Final payment', percentage: 70, dueTrigger: 'on_prior_approved', type: 'final' },
    ],
  },
  {
    id: '30-40-30',
    label: '30% / 40% / 30% phased',
    description: 'Deposit, mid-project payment, and final payment.',
    installments: [
      { label: 'Deposit', percentage: 30, dueTrigger: 'on_accept', type: 'advance' },
      {
        label: 'Mid-project payment',
        percentage: 40,
        dueTrigger: 'on_prior_approved',
        type: 'milestone',
      },
      { label: 'Final payment', percentage: 30, dueTrigger: 'on_prior_approved', type: 'final' },
    ],
  },
  {
    id: '25-25-25-25',
    label: '25% × 4 milestones',
    description: 'Four equal installments across the project.',
    installments: [
      { label: 'Deposit', percentage: 25, dueTrigger: 'on_accept', type: 'advance' },
      { label: 'Milestone 2', percentage: 25, dueTrigger: 'on_prior_approved', type: 'milestone' },
      { label: 'Milestone 3', percentage: 25, dueTrigger: 'on_prior_approved', type: 'milestone' },
      { label: 'Final payment', percentage: 25, dueTrigger: 'on_prior_approved', type: 'final' },
    ],
  },
  {
    id: '100-upfront',
    label: '100% upfront',
    description: 'Full amount due on quote acceptance.',
    installments: [
      { label: 'Full payment', percentage: 100, dueTrigger: 'on_accept', type: 'fullPayment' },
    ],
  },
];

function pickPresets(raw: unknown): PaymentSchedulePresetDefinition[] {
  if (!raw || typeof raw !== 'object') return FALLBACK_PRESETS;
  const rec = raw as Record<string, unknown>;
  const list = Array.isArray(rec.presets)
    ? rec.presets
    : Array.isArray(rec.data)
      ? rec.data
      : Array.isArray(raw)
        ? raw
        : null;
  if (!list?.length) return FALLBACK_PRESETS;
  return list as PaymentSchedulePresetDefinition[];
}

function previewRows(
  value: PaymentScheduleSelection,
  presets: PaymentSchedulePresetDefinition[],
  totalMajor: number
): Array<{ label: string; percentage: number; amountPaise: number; dueTrigger: string }> {
  const totalPaise = Math.round(Math.max(0, totalMajor) * 100);
  const source =
    value.mode === 'custom'
      ? value.customRows
      : (presets.find((p) => p.id === value.presetId)?.installments ?? []);

  let allocated = 0;
  return source.map((row, index) => {
    const isLast = index === source.length - 1;
    const pct = row.percentage ?? 0;
    const amountPaise = isLast
      ? Math.max(0, totalPaise - allocated)
      : Math.round((totalPaise * pct) / 100);
    allocated += amountPaise;
    return {
      label: row.label,
      percentage: pct,
      amountPaise,
      dueTrigger: row.dueTrigger,
    };
  });
}

export function defaultPaymentScheduleSelection(
  presetId: PaymentSchedulePresetId | string = '50-50'
): PaymentScheduleSelection {
  const known: PaymentSchedulePresetId[] = [
    '50-50',
    '30-70',
    '30-40-30',
    '25-25-25-25',
    '100-upfront',
  ];
  const resolved: PaymentSchedulePresetId = known.includes(presetId as PaymentSchedulePresetId)
    ? (presetId as PaymentSchedulePresetId)
    : '50-50';
  return {
    mode: 'preset',
    presetId: resolved,
    customRows: [
      { label: 'Deposit', percentage: 50, dueTrigger: 'on_accept' },
      { label: 'Final payment', percentage: 50, dueTrigger: 'on_prior_approved' },
    ],
  };
}

/** Build API payload fields for create/update quote (matches CreateQuoteDto). */
export function paymentScheduleApiFields(value: PaymentScheduleSelection): {
  schedulePreset?: PaymentSchedulePresetId;
  paymentSchedule?: Array<{
    label: string;
    percentage: number;
    dueTrigger: PaymentScheduleDueTrigger;
  }>;
} {
  if (value.mode === 'custom') {
    return {
      paymentSchedule: value.customRows.map((row) => ({
        label: row.label.trim() || 'Payment',
        percentage: row.percentage,
        dueTrigger: row.dueTrigger,
      })),
    };
  }
  return {
    schedulePreset: value.presetId === 'custom' ? '50-50' : value.presetId,
  };
}

export function PaymentScheduleSection({
  currency,
  totalMajor,
  value,
  onChange,
  existingSchedule,
  disabled,
}: PaymentScheduleSectionProps) {
  const presetsQ = useQuery({
    queryKey: adminKeys.paymentSchedulePresets(),
    queryFn: () => apiServices.admin.listPaymentSchedulePresets(),
    staleTime: 60_000,
  });

  const presets = useMemo(() => pickPresets(presetsQ.data), [presetsQ.data]);
  const rows = useMemo(() => previewRows(value, presets, totalMajor), [value, presets, totalMajor]);
  const pctSum = rows.reduce((s, r) => s + r.percentage, 0);

  const [showExisting, setShowExisting] = useState(false);
  useEffect(() => {
    if (existingSchedule?.length) setShowExisting(true);
  }, [existingSchedule]);

  return (
    <section className="space-y-3">
      <FormFieldLabel fieldKey="quotes.paymentSchedule" label="Payment schedule" required>
        Payment schedule
      </FormFieldLabel>
      <p className="text-xs text-muted-foreground">
        Choose how the client pays across the engagement. The backend stores this on the quote —
        send it explicitly when creating or updating.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={value.mode === 'preset' ? 'default' : 'outline'}
          disabled={disabled}
          onClick={() => onChange({ ...value, mode: 'preset' })}
        >
          Preset
        </Button>
        <Button
          type="button"
          size="sm"
          variant={value.mode === 'custom' ? 'default' : 'outline'}
          disabled={disabled}
          onClick={() => onChange({ ...value, mode: 'custom' })}
        >
          Custom %
        </Button>
      </div>

      {value.mode === 'preset' ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...value, mode: 'preset', presetId: preset.id })}
              className={cn(
                'rounded-lg border px-3 py-2.5 text-left transition-colors',
                value.presetId === preset.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border/70 hover:bg-muted/40'
              )}
            >
              <span className="block text-sm font-medium text-foreground">{preset.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {preset.description}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2 rounded-lg border border-border/70 p-3">
          {value.customRows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_5rem_8rem_auto] gap-2">
              <input
                aria-label={`Installment ${idx + 1} label`}
                disabled={disabled}
                value={row.label}
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
                placeholder="e.g. Kickoff deposit"
                onChange={(e) => {
                  const next = [...value.customRows];
                  next[idx] = { ...row, label: e.target.value };
                  onChange({ ...value, customRows: next });
                }}
              />
              <input
                type="number"
                min={1}
                max={100}
                aria-label={`Installment ${idx + 1} percentage`}
                disabled={disabled}
                value={row.percentage || ''}
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm tabular-nums"
                placeholder="40"
                onChange={(e) => {
                  const next = [...value.customRows];
                  next[idx] = {
                    ...row,
                    percentage: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                  };
                  onChange({ ...value, customRows: next });
                }}
              />
              <select
                aria-label={`Installment ${idx + 1} due trigger`}
                disabled={disabled}
                value={row.dueTrigger}
                className="nl-select min-w-[10.5rem] rounded-md border border-border bg-background py-1.5 text-sm"
                onChange={(e) => {
                  const next = [...value.customRows];
                  next[idx] = {
                    ...row,
                    dueTrigger: e.target.value as PaymentScheduleDueTrigger,
                  };
                  onChange({ ...value, customRows: next });
                }}
              >
                <option value="on_accept">On accept</option>
                <option value="on_prior_approved">After prior</option>
                <option value="on_date">On date</option>
              </select>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled || value.customRows.length <= 1}
                onClick={() =>
                  onChange({
                    ...value,
                    customRows: value.customRows.filter((_, i) => i !== idx),
                  })
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || value.customRows.length >= 12}
              onClick={() =>
                onChange({
                  ...value,
                  customRows: [
                    ...value.customRows,
                    {
                      label: `Payment ${value.customRows.length + 1}`,
                      percentage: 0,
                      dueTrigger: 'on_prior_approved',
                    },
                  ],
                })
              }
            >
              Add installment
            </Button>
            <span
              className={cn(
                'text-xs tabular-nums',
                pctSum === 100 ? 'text-muted-foreground' : 'text-destructive'
              )}
            >
              Total {pctSum}%{pctSum !== 100 ? ' (must equal 100%)' : ''}
            </span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border/70">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Installment</th>
              <th className="px-3 py-2 font-medium">%</th>
              <th className="px-3 py-2 text-right font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Due</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-2">{row.label}</td>
                <td className="px-3 py-2 tabular-nums">{row.percentage}%</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatMoneyFromPaise(row.amountPaise, currency)}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {row.dueTrigger.replace(/_/g, ' ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {existingSchedule?.length && showExisting ? (
        <p className="text-xs text-muted-foreground">
          Current quote has {existingSchedule.length} stored installment
          {existingSchedule.length === 1 ? '' : 's'}. Saving will replace them with the selection
          above.
        </p>
      ) : null}
    </section>
  );
}
