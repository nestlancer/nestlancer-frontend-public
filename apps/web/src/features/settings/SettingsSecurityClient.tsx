'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import { changePasswordSchema, type ChangePasswordInput } from '@nestlancer/validators';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, cn, ErrorState, Input, SkeletonTable, StatusBadge } from '@nestlancer/ui';

import { useWebConfirm } from '@/components/web/WebConfirmProvider';
import { WebPanel } from '@/components/web/WebPanel';
import { apiServices } from '@/lib/axios';
import { webPrimaryButtonClass } from '@/lib/tailadmin-classes';
import { asRecord, extractSessionRows } from '@/lib/client-api-view';

import { TotpQrCode, extractTotpSecret } from './TotpQrCode';

export function SettingsSecurityClient() {
  const confirm = useWebConfirm();
  const qc = useQueryClient();
  const sessions = useQuery({
    queryKey: queryKeys.users.sessions,
    queryFn: () => apiServices.users.listSessions(),
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePw = useMutation({
    mutationFn: (input: ChangePasswordInput) => apiServices.users.changePassword(input),
    onSuccess: () => {
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const killOthers = useMutation({
    mutationFn: () => apiServices.users.terminateOtherSessions(),
    onSuccess: () => {
      toast.success('Other sessions signed out');
      void qc.invalidateQueries({ queryKey: queryKeys.users.sessions });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const logoutAll = useMutation({
    mutationFn: () => apiServices.auth.logoutAll(),
    onSuccess: () => {
      toast.success('Signed out on all devices');
      void qc.invalidateQueries({ queryKey: queryKeys.users.sessions });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const revokeOne = useMutation({
    mutationFn: (sessionId: string) => apiServices.users.deleteSession(sessionId),
    onSuccess: () => {
      toast.success('Session ended');
      void qc.invalidateQueries({ queryKey: queryKeys.users.sessions });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const rows = extractSessionRows(sessions.data);
  const otherSessionCount = rows.filter((s) => !s.current).length;

  const onSubmitPassword = (e: FormEvent) => {
    e.preventDefault();
    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Check the password fields.');
      return;
    }
    changePw.mutate(parsed.data);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Protect your account with a strong password, two-factor authentication, and session control.
      </p>

      <WebPanel padding="lg">
        <form className="space-y-5" onSubmit={onSubmitPassword} method="post">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Change password
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Use a unique password you do not reuse on other sites.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-1">
            <div className="space-y-1.5">
              <FormFieldLabel
                htmlFor="security-current-password"
                fieldKey="settings.currentPassword"
                label="Current password"
              >
                Current password
              </FormFieldLabel>
              <Input
                id="security-current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your current password"
                className="h-9 rounded-md border-border/80 bg-background/80"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <FormFieldLabel
                  htmlFor="security-new-password"
                  fieldKey="settings.newPassword"
                  label="New password"
                >
                  New password
                </FormFieldLabel>
                <Input
                  id="security-new-password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a new password"
                  className="h-9 rounded-md border-border/80 bg-background/80"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <FormFieldLabel
                  htmlFor="security-confirm-password"
                  fieldKey="auth.confirmPassword"
                  label="Confirm new password"
                >
                  Confirm new password
                </FormFieldLabel>
                <Input
                  id="security-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className="h-9 rounded-md border-border/80 bg-background/80"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button
              type="submit"
              className={cn('h-9 rounded-md px-5 font-semibold', webPrimaryButtonClass)}
              disabled={changePw.isPending}
            >
              {changePw.isPending ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </form>
      </WebPanel>

      <TwoFactorSettingsSection />

      <WebPanel padding="lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Active sessions
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Devices currently signed in to your account.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl font-semibold"
              disabled={killOthers.isPending || otherSessionCount === 0}
              onClick={() => killOthers.mutate()}
            >
              Sign out other devices
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl font-semibold text-red-800 hover:bg-destructive/10 dark:text-red-300"
              disabled={logoutAll.isPending}
              onClick={async () => {
                if (
                  await confirm({
                    title: 'Sign out everywhere?',
                    description:
                      'This ends every active session including this browser. You will need to sign in again.',
                    destructive: true,
                  })
                ) {
                  logoutAll.mutate();
                }
              }}
            >
              Sign out all
            </Button>
          </div>
        </div>

        {otherSessionCount >= 5 ? (
          <div
            role="status"
            className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
          >
            You have {rows.length} active sessions ({otherSessionCount} on other devices). Use{' '}
            <strong>Sign out other devices</strong> if you do not recognize them.
          </div>
        ) : null}

        {sessions.isPending ? <SkeletonTable rows={3} cols={2} className="mt-6" /> : null}
        {sessions.isError ? (
          <ErrorState
            className="mt-6"
            title="Could not load sessions"
            message={getApiErrorMessage(sessions.error)}
            onRetry={() => void sessions.refetch()}
          />
        ) : null}

        {!sessions.isPending && !sessions.isError && rows.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">No active sessions found.</p>
        ) : null}

        {!sessions.isPending && !sessions.isError && rows.length > 0 ? (
          <ul className="mt-6 divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p
                    className="font-medium text-gray-900 dark:text-white"
                    title={s.userAgentFull ?? undefined}
                  >
                    {s.browser !== 'Web browser' &&
                    s.browser !== 'Unknown browser' &&
                    s.os !== 'Unknown OS'
                      ? `${s.browser} · ${s.os}`
                      : s.summary}
                  </p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">{s.deviceType}</p>
                  {s.ip ? <p className="font-mono text-xs text-muted-foreground">{s.ip}</p> : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last active · {s.lastActivity}
                  </p>
                </div>
                <div className="shrink-0">
                  {s.current ? (
                    <StatusBadge variant="info">This device</StatusBadge>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={revokeOne.isPending}
                      className="font-semibold text-red-800 hover:bg-destructive/10 hover:text-red-900 dark:text-red-300 dark:hover:text-red-200"
                      onClick={async () => {
                        if (
                          await confirm({
                            title: 'Sign out this device?',
                            description: 'This session will be ended immediately.',
                            destructive: true,
                          })
                        ) {
                          revokeOne.mutate(s.id);
                        }
                      }}
                    >
                      Sign out
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </WebPanel>
    </div>
  );
}

function TwoFactorSettingsSection() {
  const qc = useQueryClient();
  const [password, setPassword] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);

  const statusQ = useQuery({
    queryKey: queryKeys.users.twoFactorStatus,
    queryFn: () => apiServices.users.get2FAStatus(),
  });

  const enabled = Boolean((asRecord(statusQ.data) ?? {}).enabled);

  const clearSetup = () => {
    setOtpauthUri(null);
    setManualSecret(null);
    setSetupCode('');
  };

  const enableM = useMutation({
    mutationFn: () => apiServices.users.enable2FA({ password }),
    onSuccess: (data) => {
      const r = asRecord(data) ?? {};
      // Backend returns otpauth URI in `qrCodeUrl` (not an image).
      const uri =
        r.qrCodeUrl != null
          ? String(r.qrCodeUrl)
          : r.otpauthUrl != null
            ? String(r.otpauthUrl)
            : null;
      const secret = extractTotpSecret(uri ?? '', r.secret != null ? String(r.secret) : null);
      setOtpauthUri(uri);
      setManualSecret(secret);
      toast.success('Scan the QR code, then enter the verification code');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const verifyM = useMutation({
    mutationFn: () => apiServices.users.verify2FASetup({ code: setupCode.trim() }),
    onSuccess: async (data) => {
      const r = asRecord(data) ?? {};
      const codes = Array.isArray(r.backupCodes) ? r.backupCodes.map(String) : [];
      setBackupCodes(codes);
      clearSetup();
      setPassword(''); // NL-BV-W9-02
      // Optimistic status so the badge does not stay "Not enabled" while refetch/replica catches up.
      qc.setQueryData(queryKeys.users.twoFactorStatus, { enabled: true, method: 'totp' });
      toast.success('Two-factor authentication enabled');
      void qc.invalidateQueries({ queryKey: queryKeys.users.twoFactorStatus });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const disableM = useMutation({
    mutationFn: () =>
      apiServices.users.disable2FA({
        password,
        code: disableCode.trim(),
      }),
    onSuccess: () => {
      toast.success('Two-factor authentication disabled');
      setPassword('');
      setDisableCode('');
      clearSetup();
      setBackupCodes(null);
      void qc.invalidateQueries({ queryKey: queryKeys.users.twoFactorStatus });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not disable 2FA')),
  });

  const regenM = useMutation({
    mutationFn: () => apiServices.users.regenerateBackupCodes({ password }),
    onSuccess: (data) => {
      const r = asRecord(data) ?? {};
      // Users API returns `codes`; older clients used `backupCodes`.
      const raw = Array.isArray(r.codes)
        ? r.codes
        : Array.isArray(r.backupCodes)
          ? r.backupCodes
          : [];
      const codes = raw.map(String).filter(Boolean);
      setBackupCodes(codes.length > 0 ? codes : null);
      setPassword(''); // NL-BV-W9-02
      if (codes.length > 0) {
        toast.success('New backup codes generated — save them now');
      } else {
        toast.success('Backup codes regenerated');
      }
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const copySecret = async () => {
    if (!manualSecret) return;
    try {
      await navigator.clipboard.writeText(manualSecret);
      toast.success('Secret copied');
    } catch {
      toast.error('Could not copy secret');
    }
  };

  return (
    <WebPanel padding="lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Two-factor authentication
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add an authenticator app as a second step when signing in.
          </p>
        </div>
        {statusQ.isPending ? (
          <span className="text-xs text-muted-foreground">Checking…</span>
        ) : (
          <StatusBadge variant={enabled ? 'success' : 'neutral'}>
            {enabled ? 'Enabled' : 'Not enabled'}
          </StatusBadge>
        )}
      </div>

      <div className="mt-5 space-y-4">
        <div className="max-w-md space-y-1.5">
          <FormFieldLabel
            htmlFor="security-2fa-password"
            fieldKey="settings.currentPassword"
            label="Current password"
          >
            Confirm with password
          </FormFieldLabel>
          <Input
            id="security-2fa-password"
            name="twoFactorPassword"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-9 rounded-md"
          />
        </div>

        {!enabled ? (
          <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
            {!otpauthUri ? (
              <>
                <ol className="list-decimal space-y-1 ps-5 text-sm text-muted-foreground">
                  <li>Enter your password and start setup</li>
                  <li>Scan the QR code in your authenticator app</li>
                  <li>Enter the 6-digit code to confirm</li>
                </ol>

                <Button
                  type="button"
                  className={cn('rounded-xl font-semibold', webPrimaryButtonClass)}
                  disabled={!password || enableM.isPending}
                  onClick={() => enableM.mutate()}
                >
                  {enableM.isPending ? 'Starting…' : 'Start 2FA setup'}
                </Button>
              </>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    1. Scan with your authenticator app
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Google Authenticator, Authy, 1Password, or similar.
                  </p>
                  <div className="mt-3 flex justify-center sm:justify-start">
                    <TotpQrCode value={otpauthUri} size={180} />
                  </div>
                </div>

                {manualSecret ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Can&apos;t scan? Enter this key manually
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <code className="block flex-1 break-all rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-mono text-xs tracking-wider text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                        {manualSecret}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 rounded-xl"
                        onClick={() => void copySecret()}
                      >
                        Copy key
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="max-w-xs space-y-1.5 border-t border-gray-200 pt-4 dark:border-gray-800">
                  <FormFieldLabel
                    htmlFor="security-2fa-code"
                    fieldKey="auth.twoFactorCode"
                    label="Verification code"
                  >
                    2. Enter the 6-digit code from your app
                  </FormFieldLabel>
                  <Input
                    id="security-2fa-code"
                    name="twoFactorCode"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    value={setupCode}
                    onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onInput={(e) =>
                      setSetupCode((e.currentTarget.value || '').replace(/\D/g, '').slice(0, 6))
                    }
                    aria-invalid={verifyM.isError || undefined}
                    className="h-9 rounded-md"
                  />
                  {verifyM.isError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {getApiErrorMessage(verifyM.error, 'Invalid verification code')}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    className={cn('mt-2 rounded-xl font-semibold', webPrimaryButtonClass)}
                    disabled={setupCode.trim().length < 6 || verifyM.isPending}
                    onClick={() => verifyM.mutate()}
                  >
                    {verifyM.isPending ? 'Verifying…' : 'Verify and enable'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To disable 2FA, confirm with your password and a current authenticator code.
            </p>
            <div className="max-w-xs space-y-1.5">
              <FormFieldLabel
                htmlFor="security-2fa-disable-code"
                fieldKey="auth.twoFactorCode"
                label="Verification code"
              >
                6-digit code from app
              </FormFieldLabel>
              <Input
                id="security-2fa-disable-code"
                name="disableTwoFactorCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-9 rounded-md"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={!password || regenM.isPending}
                onClick={() => regenM.mutate()}
              >
                Regenerate backup codes
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-red-800 hover:bg-destructive/10 dark:text-red-300"
                disabled={!password || disableCode.trim().length < 6 || disableM.isPending}
                onClick={() => disableM.mutate()}
              >
                {disableM.isPending ? 'Disabling…' : 'Disable 2FA'}
              </Button>
            </div>
          </div>
        )}

        {backupCodes && backupCodes.length > 0 ? (
          <div
            role="status"
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
          >
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              Save these backup codes now — they are shown once
            </p>
            <ul className="mt-3 grid gap-1 font-mono text-xs sm:grid-cols-2">
              {backupCodes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </WebPanel>
  );
}
