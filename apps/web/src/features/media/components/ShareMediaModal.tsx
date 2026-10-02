'use client';

import { useState } from 'react';
import { toast } from '@nestlancer/ui';

import { Button } from '@nestlancer/ui';

type ShareMediaModalProps = {
  filename: string;
  open: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (options: {
    purpose: string;
    expiresInSeconds: number;
    password?: string;
  }) => Promise<{ shareUrl?: string } | null>;
};

const EXPIRY_PRESETS = [
  { label: '24 hours', seconds: 86400 },
  { label: '7 days', seconds: 604800 },
  { label: '30 days', seconds: 2592000 },
  { label: '90 days', seconds: 7776000 },
];

export function ShareMediaModal({
  filename,
  open,
  isSubmitting,
  onClose,
  onSubmit,
}: ShareMediaModalProps) {
  const [purpose, setPurpose] = useState('');
  const [expirySeconds, setExpirySeconds] = useState(604800);
  const [password, setPassword] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  if (!open) return null;

  const handleCreate = async () => {
    const trimmedPurpose = purpose.trim();
    if (trimmedPurpose.length < 3) return;

    const result = await onSubmit({
      purpose: trimmedPurpose,
      expiresInSeconds: expirySeconds,
      ...(password.trim() ? { password: password.trim() } : {}),
    });
    const url = result?.shareUrl ? String(result.shareUrl) : null;
    if (url) {
      setShareUrl(url);
      toast.success('Share link created');
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleClose = () => {
    setShareUrl(null);
    setPassword('');
    setPurpose('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-lg"
        role="dialog"
      >
        <h2 className="text-lg font-semibold">Share file</h2>
        <p className="mt-1 truncate text-sm text-muted-foreground">{filename}</p>

        {!shareUrl ? (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Purpose</label>
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Why are you sharing this file?"
                maxLength={500}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Link timeout</label>
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={expirySeconds}
                onChange={(e) => setExpirySeconds(Number(e.target.value))}
              >
                {EXPIRY_PRESETS.map((p) => (
                  <option key={p.label} value={p.seconds}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Password (optional)
              </label>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a password, or leave blank"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
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
            <input
              readOnly
              className="w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-xs"
              value={shareUrl}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button type="button" onClick={() => void handleCopy()}>
                Copy link
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
