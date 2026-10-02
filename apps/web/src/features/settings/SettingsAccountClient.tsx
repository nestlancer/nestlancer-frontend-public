'use client';

import { openSafeHttpUrl } from '@nestlancer/utils';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys, routes } from '@nestlancer/constants';
import { Button, ErrorState, Skeleton, SkeletonText, cn } from '@nestlancer/ui';
import Link from 'next/link';

import { FieldHelp, FormFieldLabel } from '@nestlancer/field-help';

import { SwitchRow } from '@/components/common/SwitchRow';
import { useWebConfirm } from '@/components/web/WebConfirmProvider';
import { WebPanel } from '@/components/web/WebPanel';
import { apiServices } from '@/lib/axios';
import { webPrimaryButtonClass } from '@/lib/tailadmin-classes';
import { asRecord } from '@/lib/client-api-view';

type Digest = 'daily' | 'weekly' | 'never';

type AccountForm = {
  notifications: {
    email: {
      projectUpdates: boolean;
      paymentReminders: boolean;
      marketing: boolean;
      digest: Digest;
    };
    push: { messages: boolean; projectUpdates: boolean };
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'connections';
    showEmail: boolean;
    showPhone: boolean;
  };
};

const defaultForm: AccountForm = {
  notifications: {
    email: { projectUpdates: true, paymentReminders: true, marketing: false, digest: 'weekly' },
    push: { messages: true, projectUpdates: true },
  },
  privacy: { profileVisibility: 'public', showEmail: false, showPhone: false },
};

function mergeFromApi(raw: unknown): AccountForm {
  const r = asRecord(raw) ?? {};
  const n = asRecord(r.notifications) ?? {};
  const e = asRecord(n.email) ?? {};
  const p = asRecord(n.push) ?? {};
  const pr = asRecord(r.privacy) ?? {};
  const digestRaw = e.digest;
  const digest: Digest =
    digestRaw === 'daily' || digestRaw === 'weekly' || digestRaw === 'never' ? digestRaw : 'weekly';
  const vis = pr.profileVisibility;
  const profileVisibility =
    vis === 'public' || vis === 'private' || vis === 'connections' ? vis : 'public';

  return {
    notifications: {
      email: {
        projectUpdates: Boolean(e.projectUpdates ?? defaultForm.notifications.email.projectUpdates),
        paymentReminders: Boolean(
          e.paymentReminders ?? defaultForm.notifications.email.paymentReminders
        ),
        marketing: Boolean(e.marketing ?? defaultForm.notifications.email.marketing),
        digest,
      },
      push: {
        messages: Boolean(p.messages ?? defaultForm.notifications.push.messages),
        projectUpdates: Boolean(p.projectUpdates ?? defaultForm.notifications.push.projectUpdates),
      },
    },
    privacy: {
      profileVisibility,
      showEmail: Boolean(pr.showEmail ?? defaultForm.privacy.showEmail),
      showPhone: Boolean(pr.showPhone ?? defaultForm.privacy.showPhone),
    },
  };
}

export function SettingsAccountClient() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: queryKeys.users.preferences,
    queryFn: () => apiServices.users.getPreferences(),
  });
  const [form, setForm] = useState<AccountForm>(defaultForm);

  useEffect(() => {
    if (q.data) setForm(mergeFromApi(q.data));
  }, [q.data]);

  const save = useMutation({
    mutationFn: () =>
      apiServices.users.updatePreferences({
        notifications: form.notifications,
        privacy: form.privacy,
      }),
    onSuccess: () => {
      toast.success('Preferences saved');
      void qc.invalidateQueries({ queryKey: queryKeys.users.preferences });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not save preferences')),
  });

  if (q.isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <SkeletonText lines={6} />
      </div>
    );
  }
  if (q.isError) {
    return (
      <ErrorState
        title="Could not load preferences"
        message={getApiErrorMessage(q.error)}
        onRetry={() => void q.refetch()}
      />
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Privacy, data export, and account deletion. Delivery channels live under{' '}
        <Link href={routes.settingsNotifications} className="font-medium text-ta-brand-500">
          Notification settings
        </Link>
        . Update your public identity from{' '}
        <Link href={routes.profile} className="font-medium text-ta-brand-500">
          Profile
        </Link>
        .
      </p>

      <form className="space-y-6" onSubmit={onSubmit} method="post">
        <WebPanel padding="lg">
          <h2 className="flex items-center gap-1.5 text-base font-semibold text-gray-900 dark:text-white">
            Privacy
            <FieldHelp fieldKey="settings.privacy" label="Privacy settings" />
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Control who can see your profile and contact details.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block text-sm" htmlFor="acc-profile-visibility">
              <span className="font-medium text-foreground">Profile visibility</span>
              <select
                id="acc-profile-visibility"
                name="profileVisibility"
                className="mt-1.5 h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3 text-sm"
                value={form.privacy.profileVisibility}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    privacy: {
                      ...f.privacy,
                      profileVisibility: e.target
                        .value as AccountForm['privacy']['profileVisibility'],
                    },
                  }))
                }
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="connections">Connections only</option>
              </select>
            </label>
            <SwitchRow
              id="acc-privacy-email"
              label="Show email on profile"
              checked={form.privacy.showEmail}
              onChange={(v) => setForm((f) => ({ ...f, privacy: { ...f.privacy, showEmail: v } }))}
            />
            <SwitchRow
              id="acc-privacy-phone"
              label="Show phone on profile"
              checked={form.privacy.showPhone}
              onChange={(v) => setForm((f) => ({ ...f, privacy: { ...f.privacy, showPhone: v } }))}
            />
          </div>

          <div className="mt-6 flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button
              type="submit"
              className={cn('h-11 rounded-xl px-6 font-semibold', webPrimaryButtonClass)}
              disabled={save.isPending}
            >
              {save.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </WebPanel>
      </form>

      <AccountDangerZone />
    </div>
  );
}

function AccountDangerZone() {
  const confirm = useWebConfirm();
  const [password, setPassword] = useState('');
  const [exportId, setExportId] = useState<string | null>(null);
  const exportM = useMutation({
    mutationFn: () => apiServices.users.requestDataExport(),
    onSuccess: (data) => {
      const row = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
      const id = row.exportId != null ? String(row.exportId) : null;
      if (id) setExportId(id);
      toast.success('Data export requested. Check status below when ready.');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const downloadExportM = useMutation({
    mutationFn: () => {
      if (!exportId) throw new Error('Request an export first');
      return apiServices.users.downloadDataExport(exportId);
    },
    onSuccess: (data) => {
      const row = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
      const url = row.downloadUrl != null ? String(row.downloadUrl) : '';
      const status = row.status != null ? String(row.status) : '';
      if (url) {
        openSafeHttpUrl(url);
        toast.success('Opening export download');
        return;
      }
      if (status === 'processing' || status === 'pending') {
        toast.message('Export still processing — try again shortly.');
        return;
      }
      toast.message('Export not ready yet.');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not download export')),
  });
  const deleteM = useMutation({
    mutationFn: () => apiServices.users.requestAccountDeletion({ password }),
    onSuccess: () => toast.success('Account deletion scheduled. Check your email to confirm.'),
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
  const cancelM = useMutation({
    mutationFn: () => apiServices.users.cancelDeletion(),
    onSuccess: () => toast.success('Account deletion cancelled'),
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <WebPanel
      padding="lg"
      className="border-destructive/30 bg-destructive/[0.03] dark:bg-destructive/[0.06]"
    >
      <h2 className="text-base font-semibold text-destructive">Danger zone</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Export your data or permanently delete your account.
      </p>

      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Data export</h3>
          <p className="text-xs text-muted-foreground">
            Request a copy of your account data. Processing may take a few minutes.
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={exportM.isPending}
            onClick={() => exportM.mutate()}
          >
            {exportM.isPending ? 'Requesting…' : 'Request data export'}
          </Button>
          {exportId ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">Export ID: {exportId}</span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-lg"
                disabled={downloadExportM.isPending}
                onClick={() => downloadExportM.mutate()}
              >
                Check status / download
              </Button>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Delete account</h3>
          <p className="text-xs text-muted-foreground">
            Schedules permanent deletion. You can cancel while it is still pending.
          </p>
          <div className="space-y-1.5">
            <FormFieldLabel
              htmlFor="acc-delete-password"
              fieldKey="settings.deleteAccountPassword"
              label="Deletion password"
            >
              Password to confirm deletion
            </FormFieldLabel>
            <input
              id="acc-delete-password"
              name="deletePassword"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              disabled={!password || deleteM.isPending}
              onClick={async () => {
                if (
                  await confirm({
                    title: 'Delete your account?',
                    description:
                      'This cannot be undone easily. Your account deletion will be scheduled.',
                    destructive: true,
                  })
                ) {
                  deleteM.mutate();
                }
              }}
            >
              Delete account
            </Button>
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
              disabled={cancelM.isPending}
              onClick={() => cancelM.mutate()}
            >
              Cancel pending deletion
            </button>
          </div>
        </div>
      </div>
    </WebPanel>
  );
}
