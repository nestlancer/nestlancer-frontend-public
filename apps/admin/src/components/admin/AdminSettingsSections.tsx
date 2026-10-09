'use client';

import { Card, Divider, Switch, Text, TextInput } from '@nestlancer/ui';
import type { ReactNode } from 'react';

import { FieldHelp } from '@nestlancer/field-help';

import { asRecord } from '@/lib/admin-view-model';
import { pickAdminRows } from '@/lib/admin-response';

import { adminCardClass } from '@/components/admin/AdminPageChrome';

export function SettingsSection({
  title,
  description,
  children,
  actions,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`${adminCardClass} !p-4${className ? ` ${className}` : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Text className="text-sm font-semibold text-foreground">{title}</Text>
          {description ? (
            <Text className="mt-0.5 text-xs text-muted-foreground">{description}</Text>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>
        ) : null}
      </div>
      <Divider className="my-3" />
      <div className="divide-y divide-border/60">{children}</div>
    </Card>
  );
}

export function SettingsRow({
  label,
  description,
  hint,
  labelExtra,
  htmlFor,
  children,
}: {
  label: string;
  description?: string;
  hint?: string;
  labelExtra?: ReactNode;
  /** When set, the visible label is associated with the control via htmlFor. */
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 py-3 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:gap-6">
      <div className="min-w-0">
        <Text className="inline-flex items-center gap-1 font-medium text-foreground">
          {htmlFor ? (
            <label htmlFor={htmlFor} className="cursor-default">
              {label}
            </label>
          ) : (
            label
          )}
          {labelExtra}
        </Text>
        {description ? (
          <Text className="mt-1 text-sm text-muted-foreground">{description}</Text>
        ) : null}
        {hint ? (
          <Text className="mt-1 break-all font-mono text-[11px] text-muted-foreground/80">
            {hint}
          </Text>
        ) : null}
      </div>
      <div className="flex w-full items-center md:w-auto md:justify-end">{children}</div>
    </div>
  );
}

export function ReadOnlyField({
  value,
  placeholder,
  id,
  name,
}: {
  value: string;
  placeholder?: string;
  id?: string;
  name?: string;
}) {
  return (
    <TextInput
      id={id}
      name={name ?? id}
      value={value}
      onValueChange={() => undefined}
      placeholder={placeholder}
      disabled
      className="w-full max-w-md"
    />
  );
}

export type FeatureFlagRow = { key: string; label: string; enabled: boolean; description?: string };

function looksLikeTechnicalId(value: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ||
    /^[0-9a-f]{20,}$/i.test(value)
  );
}

/** Enum keys / “TWO FACTOR ENFORCEMENT” style titles — never primary UI copy (NL-UI-004). */
function looksLikeEnumLabel(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^[A-Z][A-Z0-9_]+$/.test(trimmed)) return true;
  // Underscores swapped for spaces but still all-caps tokens.
  if (/^[A-Z0-9]+(?:\s+[A-Z0-9]+)+$/.test(trimmed) && trimmed === trimmed.toUpperCase()) {
    return true;
  }
  return false;
}

function titleCaseFromKey(key: string): string {
  return key
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function extractFeatureFlagRows(data: unknown): FeatureFlagRow[] {
  const list = pickAdminRows(data);
  if (list.length) {
    return list.map((row, i) => {
      // Prefer human description over enum key (NL-UI-004).
      const key = String(row.flag ?? row.key ?? row.name ?? i);
      const raw = row.enabled ?? row.active ?? row.value ?? row.isEnabled;
      const description =
        typeof row.description === 'string' && row.description.trim()
          ? row.description.trim()
          : undefined;
      const namedRaw =
        typeof row.name === 'string' && row.name.trim() ? row.name.trim() : undefined;
      const named =
        namedRaw && !looksLikeTechnicalId(namedRaw) && !looksLikeEnumLabel(namedRaw)
          ? namedRaw
          : undefined;
      // Primary label must be operator-friendly prose, not SCREAMING enum titles.
      const label =
        named ||
        description ||
        (looksLikeTechnicalId(key) ? 'Feature flag' : titleCaseFromKey(key));
      return {
        key,
        label,
        enabled: raw === true || raw === 'true' || raw === 1 || raw === '1',
        // Avoid repeating the same sentence under the title.
        description: description && description !== label ? description : undefined,
      };
    });
  }
  const rec = asRecord(data);
  if (!rec) return [];
  return Object.entries(rec).map(([k, v]) => {
    const description = typeof v === 'string' && v !== 'true' && v !== 'false' ? v : undefined;
    const label = description || (!looksLikeTechnicalId(k) ? titleCaseFromKey(k) : 'Feature flag');
    return {
      key: k,
      label,
      enabled: v === true || v === 'true' || v === 1,
      description: description && description !== label ? description : undefined,
    };
  });
}

export function FeatureFlagList({
  flags,
  readOnly = true,
  values,
  onChange,
}: {
  flags: FeatureFlagRow[];
  readOnly?: boolean;
  values?: Record<string, boolean>;
  onChange?: (key: string, enabled: boolean) => void;
}) {
  if (!flags.length) {
    return <Text className="text-muted-foreground">No feature flags returned.</Text>;
  }
  return (
    <>
      {flags.map((flag) => {
        const checked = values ? (values[flag.key] ?? flag.enabled) : flag.enabled;
        return (
          <SettingsRow
            key={flag.key}
            label={flag.label}
            description={flag.description}
            // Never surface enum/UUID flag keys in the operator UI (NL-UI-004).
          >
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-medium ${checked ? 'text-emerald-500' : 'text-muted-foreground'}`}
              >
                {checked ? 'On' : 'Off'}
              </span>
              <Switch
                checked={checked}
                onChange={(v) => onChange?.(flag.key, v)}
                disabled={readOnly}
                aria-label={`Toggle ${flag.label}`}
              />
            </div>
          </SettingsRow>
        );
      })}
    </>
  );
}

export function ConfigFields({
  rows,
  readOnly = true,
}: {
  rows: { key: string; value: string }[];
  readOnly?: boolean;
}) {
  if (!rows.length) {
    return <Text className="text-muted-foreground">No configuration keys returned.</Text>;
  }
  return (
    <>
      {rows.map((row) => {
        const fieldId = `config-${row.key.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
        return (
          <SettingsRow
            key={row.key}
            label={row.key}
            htmlFor={fieldId}
            hint={readOnly ? 'Loaded from API (read-only)' : undefined}
            labelExtra={<FieldHelp fieldKey={`system.${row.key}`} label={row.key} />}
          >
            <ReadOnlyField id={fieldId} name={fieldId} value={row.value} />
          </SettingsRow>
        );
      })}
    </>
  );
}
