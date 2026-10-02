'use client';

import { Button, Input } from '@nestlancer/ui';

export function TwoFactorPrompt() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code from your authenticator app.
      </p>
      <Input
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="Two-factor code"
        placeholder="000000"
      />
      <Button className="w-full" type="button">
        Verify
      </Button>
    </div>
  );
}
