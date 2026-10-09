'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from '@nestlancer/ui';

import { getApiErrorMessage } from '@nestlancer/api-client';
import { queryKeys } from '@nestlancer/constants';
import { FormFieldLabel } from '@nestlancer/field-help';
import { Button, Input, StatusBadge, Text } from '@nestlancer/ui';

import { GeCard } from '@/components/admin/AdminGentelellaUI';
import { apiServices } from '@/lib/axios';
import { asRecord } from '@/lib/admin-view-model';

import { TotpQrCode, extractTotpSecret } from './TotpQrCode';

/**
 * Operator 2FA enrollment — admin console previously only handled the login
 * challenge, with no path to enable TOTP (NL-BV-F3 / admin 2FA gap).
 */
export function OperatorTwoFactorSection() {
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
      const raw = Array.isArray(r.codes)
        ? r.codes
        : Array.isArray(r.backupCodes)
          ? r.backupCodes
          : [];
      const codes = raw.map(String).filter(Boolean);
      setBackupCodes(codes.length > 0 ? codes : null);
      setPassword(''); // NL-BV-W9-02
      toast.success(
        codes.length > 0 ? 'New backup codes generated — save them now' : 'Backup codes regenerated'
      );
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
    <GeCard>
      <div className="ge-card-body space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Two-factor authentication</h3>
            <Text className="mt-1 text-sm text-muted-foreground">
              Require an authenticator code after password when signing in to the admin console.
            </Text>
          </div>
          {statusQ.isPending ? (
            <span className="text-xs text-muted-foreground">Checking…</span>
          ) : (
            <StatusBadge variant={enabled ? 'success' : 'neutral'}>
              {enabled ? 'Enabled' : 'Not enabled'}
            </StatusBadge>
          )}
        </div>

        <div className="max-w-md space-y-1.5">
          <FormFieldLabel
            htmlFor="admin-2fa-password"
            fieldKey="settings.currentPassword"
            label="Current password"
          >
            Confirm with password
          </FormFieldLabel>
          <Input
            id="admin-2fa-password"
            name="twoFactorPassword"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {!enabled ? (
          <div className="space-y-4 rounded-md border border-border/60 bg-muted/20 p-4">
            {!otpauthUri ? (
              <>
                <ol className="list-decimal space-y-1 ps-5 text-sm text-muted-foreground">
                  <li>Enter your password and start setup</li>
                  <li>Scan the QR code in your authenticator app</li>
                  <li>Enter the 6-digit code to confirm</li>
                </ol>
                <Button
                  type="button"
                  disabled={!password || enableM.isPending}
                  onClick={() => enableM.mutate()}
                >
                  {enableM.isPending ? 'Starting…' : 'Start 2FA setup'}
                </Button>
              </>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    1. Scan with your authenticator app
                  </p>
                  <div className="mt-3 flex justify-center sm:justify-start">
                    <TotpQrCode value={otpauthUri} size={180} />
                  </div>
                </div>
                {manualSecret ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Can&apos;t scan? Enter this key manually
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <code className="block flex-1 break-all rounded-md border border-border bg-background px-3 py-2.5 font-mono text-xs tracking-wider">
                        {manualSecret}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => void copySecret()}
                      >
                        Copy key
                      </Button>
                    </div>
                  </div>
                ) : null}
                <div className="max-w-xs space-y-1.5 border-t border-border pt-4">
                  <FormFieldLabel
                    htmlFor="admin-2fa-code"
                    fieldKey="auth.twoFactorCode"
                    label="Verification code"
                  >
                    2. Enter the 6-digit code from your app
                  </FormFieldLabel>
                  <Input
                    id="admin-2fa-code"
                    name="twoFactorCode"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    value={setupCode}
                    onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    aria-invalid={verifyM.isError || undefined}
                  />
                  {verifyM.isError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {getApiErrorMessage(verifyM.error, 'Invalid verification code')}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    className="mt-2"
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
                htmlFor="admin-2fa-disable-code"
                fieldKey="auth.twoFactorCode"
                label="Verification code"
              >
                6-digit code from app
              </FormFieldLabel>
              <Input
                id="admin-2fa-disable-code"
                name="disableTwoFactorCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!password || regenM.isPending}
                onClick={() => regenM.mutate()}
              >
                {regenM.isPending ? 'Regenerating…' : 'Regenerate backup codes'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={!password || disableCode.trim().length < 6 || disableM.isPending}
                onClick={() => disableM.mutate()}
              >
                {disableM.isPending ? 'Disabling…' : 'Disable 2FA'}
              </Button>
            </div>
          </div>
        )}

        {backupCodes && backupCodes.length > 0 ? (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-foreground">
              Save these backup codes now — they will not be shown again.
            </p>
            <ul className="mt-2 grid gap-1 font-mono text-xs sm:grid-cols-2">
              {backupCodes.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </GeCard>
  );
}
