'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { Button, Input } from '@nestlancer/ui';

import { adminKeys } from '@/lib/admin-query-keys';
import { apiServices } from '@/lib/axios';

function asRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const rec = raw as Record<string, unknown>;
  if (rec.data && typeof rec.data === 'object' && !Array.isArray(rec.data)) {
    return rec.data as Record<string, unknown>;
  }
  return rec;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function CapacityDashboard() {
  const qc = useQueryClient();
  const [maxActive, setMaxActive] = useState('');
  const [warningAt, setWarningAt] = useState('');

  const q = useQuery({
    queryKey: adminKeys.capacityDashboard(),
    queryFn: () => apiServices.admin.getCapacityDashboard(),
  });

  const data = asRecord(q.data);
  const settings = asRecord(data.settings ?? data.capacitySettings);

  const saveM = useMutation({
    mutationFn: () =>
      apiServices.admin.updateCapacitySettings({
        ...(maxActive.trim()
          ? { maxActiveProjects: Number(maxActive), maxConcurrentProjects: Number(maxActive) }
          : {}),
        ...(warningAt.trim() ? { warningThreshold: Number(warningAt) } : {}),
      }),
    onSuccess: () => {
      toast.success('Capacity settings updated');
      setMaxActive('');
      setWarningAt('');
      void qc.invalidateQueries({ queryKey: adminKeys.capacityDashboard() });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const activeProjects = asNumber(data.activeProjects ?? data.active);
  const maxProjects = asNumber(
    settings.maxActiveProjects ??
      settings.maxConcurrentProjects ??
      data.maxActiveProjects ??
      data.maxConcurrentProjects
  );
  const utilizationRaw = asNumber(
    data.capacityUsedPercent ?? data.utilization ?? data.capacityUsed
  );
  const isOverCapacity =
    data.isOverCapacity === true ||
    (activeProjects != null && maxProjects != null && activeProjects > maxProjects);

  const utilization =
    utilizationRaw != null
      ? `${utilizationRaw}%`
      : activeProjects != null && maxProjects != null && maxProjects > 0
        ? `${Math.round((activeProjects / maxProjects) * 100)}%`
        : '—';

  const metrics = [
    { label: 'Active projects', value: activeProjects ?? '—' },
    {
      label: 'Queued requests',
      value: data.queuedRequests ?? data.queued ?? data.pendingPayments ?? '—',
    },
    { label: 'Capacity used', value: utilization },
    { label: 'Max active', value: maxProjects ?? '—' },
  ];

  return (
    <section className="ge-card space-y-4 rounded-lg border border-border/70 bg-card p-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Capacity dashboard</h2>
        <p className="text-xs text-muted-foreground">
          Studio load vs configured limits. Adjust thresholds when intake should slow down.
        </p>
      </div>

      {isOverCapacity ? (
        <div
          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
          role="status"
        >
          Over capacity: {activeProjects ?? '—'} active projects exceed the max of{' '}
          {maxProjects ?? '—'}. Raise max active or complete projects so intake limits stay
          meaningful.
        </div>
      ) : null}

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading capacity…</p>
      ) : (
        <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border/60 bg-card/80 divide-x divide-y divide-border/50 lg:grid-cols-4 lg:divide-y-0">
          {metrics.map((m) => (
            <div
              key={m.label}
              className={
                m.label === 'Capacity used' && isOverCapacity
                  ? 'bg-amber-500/10 px-3 py-2'
                  : 'px-3 py-2'
              }
            >
              <p className="text-[11px] font-medium text-muted-foreground">{m.label}</p>
              <p className="mt-0.5 text-base font-semibold tabular-nums">{String(m.value)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid max-w-xl gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="cap-max">
            Max active projects
          </label>
          <Input
            id="cap-max"
            type="number"
            min={1}
            className="mt-1"
            placeholder={String(maxProjects ?? '')}
            value={maxActive}
            onChange={(e) => setMaxActive(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="cap-warn">
            Warning threshold
          </label>
          <Input
            id="cap-warn"
            type="number"
            min={1}
            className="mt-1"
            placeholder={String(settings.warningThreshold ?? '')}
            value={warningAt}
            onChange={(e) => setWarningAt(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Button
          size="sm"
          disabled={saveM.isPending || (!maxActive.trim() && !warningAt.trim())}
          title={
            !maxActive.trim() && !warningAt.trim()
              ? 'Enter a max active count or warning threshold to save'
              : undefined
          }
          onClick={() => saveM.mutate()}
        >
          {saveM.isPending ? 'Saving…' : 'Update capacity settings'}
        </Button>
        {!maxActive.trim() && !warningAt.trim() ? (
          <p className="text-xs text-muted-foreground">
            Enter a max active count or warning threshold to enable save.
          </p>
        ) : null}
      </div>
    </section>
  );
}
