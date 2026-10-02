'use client';

import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
} from '@nestlancer/ui';

const EXPIRY_PRESETS = [
  { label: '24 hours', seconds: 86400 },
  { label: '7 days', seconds: 604800 },
  { label: '30 days', seconds: 2592000 },
  { label: '90 days', seconds: 7776000 },
] as const;

export type AdminMediaCreateShareOptions = {
  purpose: string;
  expiresInSeconds: number;
  password?: string;
};

export function AdminMediaCreateShareDialog({
  filename,
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: {
  filename: string;
  open: boolean;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (options: AdminMediaCreateShareOptions) => Promise<{ shareUrl?: string } | void>;
}) {
  const [purpose, setPurpose] = useState('');
  const [expirySeconds, setExpirySeconds] = useState<number>(604800);
  const [password, setPassword] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const reset = () => {
    setPurpose('');
    setExpirySeconds(604800);
    setPassword('');
    setShareUrl(null);
  };

  const handleClose = (next: boolean) => {
    if (isSubmitting) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleCreate = async () => {
    const trimmedPurpose = purpose.trim();
    if (trimmedPurpose.length < 3) return;

    const result = await onSubmit({
      purpose: trimmedPurpose,
      expiresInSeconds: expirySeconds,
      ...(password.trim() ? { password: password.trim() } : {}),
    });

    const url =
      result && typeof result === 'object' && typeof result.shareUrl === 'string'
        ? result.shareUrl
        : null;
    if (url) setShareUrl(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogTitle>Create share link</DialogTitle>
        <DialogDescription>
          Describe why you are sharing <span className="font-medium">{filename}</span>. Each purpose
          gets its own link with a timeout — expired links are revoked automatically.
        </DialogDescription>

        {!shareUrl ? (
          <div className="mt-4 space-y-4">
            <label className="block text-xs font-medium text-muted-foreground">
              Purpose / statement
              <Input
                className="mt-1"
                placeholder="e.g. Client preview for milestone 2 — expires after review"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                maxLength={500}
              />
            </label>

            <label className="block text-xs font-medium text-muted-foreground">
              Link timeout
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={expirySeconds}
                onChange={(e) => setExpirySeconds(Number(e.target.value))}
              >
                {EXPIRY_PRESETS.map((preset) => (
                  <option key={preset.label} value={preset.seconds}>
                    {preset.label} — auto-revoke after expiry
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-medium text-muted-foreground">
              Password (optional)
              <Input
                className="mt-1"
                type="password"
                placeholder="Enter a password, or leave blank"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => handleClose(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSubmitting || purpose.trim().length < 3}
                onClick={() => void handleCreate()}
              >
                {isSubmitting ? 'Creating…' : 'Create link'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Input readOnly className="font-mono text-xs" value={shareUrl} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Done
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                  } catch {
                    // ignore
                  }
                }}
              >
                Copy link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
