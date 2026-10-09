'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys, routes } from '@nestlancer/constants';
import { Button, cn, ErrorState, Skeleton, SkeletonText } from '@nestlancer/ui';

import { FieldHelp, FormFieldLabel } from '@nestlancer/field-help';

import { SwitchRow } from '@/components/common/SwitchRow';
import { WebPanel } from '@/components/web/WebPanel';
import { apiServices } from '@/lib/axios';
import { webPrimaryButtonClass, webStickyActionBarClass } from '@/lib/tailadmin-classes';
import {
  NOTIFICATION_PREFERENCE_CATEGORIES,
  normalizePreferenceCategory,
} from '@nestlancer/utils/notifications';

import {
  asRecord,
  normalizeChannelPrefs,
  parseDeliveryChannels,
  type ChannelTriState,
  type DeliveryChannelInfo,
} from '@/lib/client-api-view';

const DEFAULT_CATEGORIES = NOTIFICATION_PREFERENCE_CATEGORIES;

const defaultChannels = (): ChannelTriState => ({
  email: true,
  push: true,
  inApp: true,
});

function humanizeCategory(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function mergePreferenceMap(fromApi: Record<string, unknown>): Record<string, ChannelTriState> {
  const base: Record<string, ChannelTriState> = {
    quotes: { email: true, push: true, inApp: true },
    payments: { email: true, push: false, inApp: true },
    messages: { email: false, push: true, inApp: true },
    projects: { email: true, push: true, inApp: true },
    requests: { email: true, push: true, inApp: true },
    account: { email: true, push: false, inApp: true },
  };

  const mergedInput: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fromApi)) {
    mergedInput[normalizePreferenceCategory(key)] = val;
  }

  const out: Record<string, ChannelTriState> = {};
  for (const key of DEFAULT_CATEGORIES) {
    const raw = mergedInput[key];
    const b = base[key] ?? defaultChannels();
    if (raw == null || typeof raw !== 'object') {
      out[key] = { ...b };
      continue;
    }
    const o = raw as Record<string, unknown>;
    const n = normalizeChannelPrefs(raw);
    out[key] = {
      email: typeof o.email === 'boolean' ? n.email : b.email,
      push: typeof o.push === 'boolean' ? n.push : b.push,
      inApp: typeof o.inApp === 'boolean' ? n.inApp : b.inApp,
    };
  }
  return out;
}

function ChannelToggle({
  id,
  label,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-theme focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50',
        checked
          ? 'border-ta-brand-500 bg-ta-brand-500'
          : 'border-gray-300 bg-gray-200 dark:border-border dark:bg-muted-foreground/25'
      )}
    >
      <span
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-1 ring-black/10 transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

export function SettingsNotificationsClient({ embedded = false }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: queryKeys.notifications.preferences,
    queryFn: () => apiServices.notifications.getPreferences(),
  });

  const channelsQ = useQuery({
    queryKey: [...queryKeys.notifications.preferences, 'channels'],
    queryFn: () => apiServices.notifications.getChannels(),
    retry: 1,
  });

  const [quietEnabled, setQuietEnabled] = useState(false);
  const [quiet, setQuiet] = useState({
    start: '22:00',
    end: '08:00',
    timezone: 'Asia/Kolkata',
  });
  const [prefs, setPrefs] = useState<Record<string, ChannelTriState>>({});

  useEffect(() => {
    if (!q.data) return;
    const r = asRecord(q.data) ?? {};
    const qh = asRecord(r.quietHours) ?? {};
    const hasQuietHours =
      qh.start != null &&
      String(qh.start).length > 0 &&
      qh.end != null &&
      String(qh.end).length > 0;
    setQuietEnabled(hasQuietHours);
    setQuiet({
      start: hasQuietHours ? String(qh.start).slice(0, 5) : '22:00',
      end: hasQuietHours ? String(qh.end).slice(0, 5) : '08:00',
      timezone: String(qh.timezone ?? 'Asia/Kolkata'),
    });
    const rawPref = r.preferences;
    if (rawPref && typeof rawPref === 'object' && !Array.isArray(rawPref)) {
      setPrefs(mergePreferenceMap(rawPref as Record<string, unknown>));
    } else {
      setPrefs({
        quotes: defaultChannels(),
        payments: { ...defaultChannels(), push: false },
        messages: { email: false, push: true, inApp: true },
        projects: defaultChannels(),
        requests: defaultChannels(),
        account: { ...defaultChannels(), push: false },
      });
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = { preferences: prefs };
      if (quietEnabled && quiet.start && quiet.end && quiet.timezone) {
        payload.quietHours = {
          start: quiet.start,
          end: quiet.end,
          timezone: quiet.timezone,
        };
      }
      return apiServices.notifications.patchPreferences(payload);
    },
    onSuccess: () => {
      toast.success('Notification preferences saved');
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.preferences });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deliveryChannels: DeliveryChannelInfo[] = parseDeliveryChannels(channelsQ.data);
  const pushChannel = deliveryChannels.find((c) => c.id === 'push');
  const pushVapidConfigured = Boolean(process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?.trim());
  const pushUnavailable =
    pushChannel?.status === 'unavailable' || (pushChannel != null && !pushVapidConfigured);
  const pushNeedsSubscription = pushChannel?.status === 'requires_subscription';

  const setChannel = (category: string, channel: keyof ChannelTriState, value: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] ?? defaultChannels()),
        [channel]: value,
      },
    }));
  };

  if (q.isPending) {
    return (
      <div className={embedded ? 'space-y-4' : 'mx-auto max-w-3xl space-y-4'}>
        <Skeleton className="h-8 w-48" />
        <SkeletonText lines={8} />
      </div>
    );
  }
  if (q.isError) {
    return (
      <ErrorState
        title="Could not load notification settings"
        message={getApiErrorMessage(q.error)}
        onRetry={() => void q.refetch()}
      />
    );
  }

  const categories = Object.keys(prefs).sort((a, b) => {
    const order = (k: string) => {
      const i = DEFAULT_CATEGORIES.indexOf(k as (typeof DEFAULT_CATEGORIES)[number]);
      return i >= 0 ? i : 99;
    };
    return order(a) - order(b) || a.localeCompare(b);
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <form
      className={embedded ? 'space-y-6' : 'mx-auto max-w-3xl space-y-6'}
      onSubmit={onSubmit}
      method="post"
    >
      {!embedded ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Choose how we reach you for each type of update.
          </p>
          <Button variant="outline" className="w-fit rounded-xl font-semibold" asChild>
            <Link href={routes.notifications}>Open inbox</Link>
          </Button>
        </div>
      ) : null}

      {deliveryChannels.length > 0 ? (
        <WebPanel padding="md">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Available channels
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Delivery options you can toggle per category below.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {deliveryChannels.map((channel) => (
              <li
                key={channel.id}
                className={cn(
                  'rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground',
                  channel.status === 'requires_subscription' && 'opacity-80'
                )}
                title={
                  channel.status === 'requires_subscription'
                    ? 'Requires a browser push subscription'
                    : undefined
                }
              >
                {channel.name}
                {channel.status === 'requires_subscription' ? ' · setup required' : null}
              </li>
            ))}
          </ul>
        </WebPanel>
      ) : null}

      <WebPanel padding="lg">
        <h2 className="flex items-center gap-1.5 text-base font-semibold text-gray-900 dark:text-white">
          Quiet hours
          <FieldHelp fieldKey="settings.quietHoursFrom" label="Quiet hours" />
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Pause non-urgent alerts during this window (times use your chosen timezone).
        </p>

        <div className="mt-4">
          <SwitchRow
            id="notif-quiet-enabled"
            label="Enable quiet hours"
            description="When off, alerts can arrive at any time."
            checked={quietEnabled}
            onChange={setQuietEnabled}
          />
        </div>

        <fieldset
          disabled={!quietEnabled}
          className={cn(
            'mt-4 grid gap-4 border-0 p-0 sm:grid-cols-3',
            !quietEnabled && 'opacity-50'
          )}
        >
          <legend className="sr-only">Quiet hours schedule</legend>
          <div className="space-y-1.5 text-sm">
            <FormFieldLabel
              htmlFor="quiet-hours-from"
              fieldKey="settings.quietHoursFrom"
              label="From"
            >
              From
            </FormFieldLabel>
            <input
              id="quiet-hours-from"
              type="time"
              name="quietHoursFrom"
              className="mt-1 h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3 text-sm"
              value={quiet.start}
              onChange={(e) => setQuiet((q0) => ({ ...q0, start: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5 text-sm">
            <FormFieldLabel htmlFor="quiet-hours-to" fieldKey="settings.quietHoursTo" label="To">
              To
            </FormFieldLabel>
            <input
              id="quiet-hours-to"
              type="time"
              name="quietHoursTo"
              className="mt-1 h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3 text-sm"
              value={quiet.end}
              onChange={(e) => setQuiet((q0) => ({ ...q0, end: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5 text-sm">
            <FormFieldLabel
              htmlFor="quiet-hours-tz"
              fieldKey="settings.quietHoursTimezone"
              label="Timezone"
            >
              Timezone
            </FormFieldLabel>
            <input
              id="quiet-hours-tz"
              name="quietHoursTimezone"
              className="mt-1 h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3 text-sm placeholder:text-muted-foreground"
              value={quiet.timezone}
              onChange={(e) => setQuiet((q0) => ({ ...q0, timezone: e.target.value }))}
              placeholder="e.g. Asia/Kolkata"
              autoComplete="off"
              aria-describedby="quiet-hours-tz-hint"
            />
            <p id="quiet-hours-tz-hint" className="text-xs text-muted-foreground">
              Quiet hours are evaluated in this timezone (defaults to your account timezone).
            </p>
          </div>
        </fieldset>
      </WebPanel>

      <WebPanel padding="none" className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Category preferences
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Toggle email, push, and in-app delivery for each category.
            {pushUnavailable
              ? ' Push is unavailable in this environment.'
              : pushNeedsSubscription
                ? ' Push requires browser notification permission.'
                : null}
          </p>
        </div>

        {/* Desktop matrix */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th scope="col" className="px-6 py-3 font-medium">
                  Category
                </th>
                <th scope="col" className="px-4 py-3 text-center font-medium">
                  Email
                </th>
                <th scope="col" className="px-4 py-3 text-center font-medium">
                  Push
                </th>
                <th scope="col" className="px-4 py-3 text-center font-medium">
                  In-app
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {categories.map((cat) => {
                const ch = prefs[cat] ?? defaultChannels();
                return (
                  <tr key={cat} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {humanizeCategory(cat)}
                    </th>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <ChannelToggle
                          id={`notif-${cat}-email`}
                          label={`${humanizeCategory(cat)} email`}
                          checked={ch.email}
                          onChange={(v) => setChannel(cat, 'email', v)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <ChannelToggle
                          id={`notif-${cat}-push`}
                          label={`${humanizeCategory(cat)} push`}
                          checked={ch.push}
                          disabled={pushUnavailable}
                          onChange={(v) => setChannel(cat, 'push', v)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <ChannelToggle
                          id={`notif-${cat}-inapp`}
                          label={`${humanizeCategory(cat)} in-app`}
                          checked={ch.inApp}
                          onChange={(v) => setChannel(cat, 'inApp', v)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked rows */}
        <ul className="divide-y divide-gray-100 md:hidden dark:divide-gray-800">
          {categories.map((cat) => {
            const ch = prefs[cat] ?? defaultChannels();
            return (
              <li key={cat} className="space-y-3 px-5 py-4">
                <p className="font-medium text-gray-900 dark:text-white">{humanizeCategory(cat)}</p>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      ['email', 'Email', ch.email, false],
                      ['push', 'Push', ch.push, pushUnavailable],
                      ['inApp', 'In-app', ch.inApp, false],
                    ] as const
                  ).map(([key, label, checked, disabled]) => (
                    <div key={key} className="flex flex-col items-center gap-2">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <ChannelToggle
                        id={`notif-m-${cat}-${key}`}
                        label={`${humanizeCategory(cat)} ${label}`}
                        checked={checked}
                        disabled={disabled}
                        onChange={(v) => setChannel(cat, key, v)}
                      />
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </WebPanel>

      <div className="h-16" aria-hidden />
      <div
        className={cn(
          webStickyActionBarClass,
          'lg:left-[var(--sidebar-width,16rem)]',
          'pb-[max(0.75rem,env(safe-area-inset-bottom))]'
        )}
      >
        <div className="mx-auto flex max-w-dashboard justify-end">
          <Button
            type="submit"
            className={cn('h-10 rounded-lg px-5 font-semibold', webPrimaryButtonClass)}
            disabled={save.isPending}
          >
            {save.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
