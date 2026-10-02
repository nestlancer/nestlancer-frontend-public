'use client';

import { useMemo, useState } from 'react';
import { ShieldCheck, Search } from '@nestlancer/ui/icons';

import { Button, Card, CardContent, CardHeader, Input, StatusBadge } from '@nestlancer/ui';

import { useDocumentVerifyQuery } from '@/features/documents/hooks/useDocumentsApi';

function formatIssuedAt(raw: string | undefined): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
}

/** Pull number + HMAC token from pasted verify URLs (PDF QR / API / portal). */
export function parseVerifyInput(raw: string): { number: string; token: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { number: '', token: '' };

  try {
    const url = new URL(trimmed);
    const number =
      url.searchParams.get('number') ||
      url.pathname.split('/').filter(Boolean).pop()?.split('?')[0] ||
      '';
    const token = url.searchParams.get('t') || '';
    if (number || token) {
      return {
        number: decodeURIComponent(number),
        token,
      };
    }
  } catch {
    // not a URL — fall through
  }

  // Allow "NL-INV-… <token>" or "NL-INV-…?t=…" pasted as plain text
  const qIdx = trimmed.indexOf('?');
  if (qIdx >= 0) {
    try {
      const params = new URLSearchParams(trimmed.slice(qIdx + 1));
      const token = params.get('t') || '';
      const number = trimmed.slice(0, qIdx).trim();
      if (number) return { number, token };
    } catch {
      // ignore
    }
  }

  return { number: trimmed, token: '' };
}

export function DocumentVerifyClient({
  initialNumber = '',
  initialToken = '',
}: {
  initialNumber?: string;
  initialToken?: string;
}) {
  const [input, setInput] = useState(
    initialToken
      ? initialNumber
        ? `${initialNumber}?t=${initialToken}`
        : initialToken
      : initialNumber
  );
  const [submittedNumber, setSubmittedNumber] = useState(initialNumber.trim());
  const [submittedToken, setSubmittedToken] = useState(initialToken.trim());

  const q = useDocumentVerifyQuery(
    submittedNumber,
    submittedToken,
    Boolean(submittedNumber && submittedToken)
  );

  const missingToken = useMemo(() => {
    if (!submittedNumber) return false;
    return !submittedToken;
  }, [submittedNumber, submittedToken]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseVerifyInput(input);
    setSubmittedNumber(parsed.number);
    setSubmittedToken(parsed.token);
    if (parsed.number && parsed.token) {
      setInput(parsed.number);
    }
  }

  const result = q.data;
  const notFound = q.isFetched && !q.isPending && !result && Boolean(submittedToken);
  const status = String(result?.status ?? '').toUpperCase();
  const isValid = status === 'VALID';
  const isPending = status === 'PENDING';
  const isRevoked = status === 'REVOKED';
  const issuedLabel = formatIssuedAt(result?.issuedAt);
  const typeLabel =
    result?.type && String(result.type).toLowerCase() !== 'undefined'
      ? String(result.type).toLowerCase()
      : null;
  const versionLabel =
    typeof result?.version === 'number' && result.version > 0 ? `v${result.version}` : null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]">
          <ShieldCheck className="h-7 w-7" aria-hidden />
        </div>
        <p className="fig-label mx-auto mb-3">FIG · Trust</p>
        <h1 className="text-2xl font-bold tracking-[-0.03em]">Verify a Nestlancer document</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Open the verification link or QR code from your PDF. Document numbers alone are not enough
          — each link includes a one-time authenticity token.
        </p>
      </div>

      <Card className="rounded-2xl border-border shadow-[var(--elevation-1)]">
        <CardHeader>
          <h2 className="text-base font-semibold">Verification link or document number</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste PDF verify URL, or NL-INV-…?t=…"
              className="rounded-xl font-mono text-sm"
              aria-label="Document verification link or number"
            />
            <Button
              type="submit"
              className="shrink-0 rounded-full"
              disabled={!input.trim() || q.isFetching}
            >
              <Search className="mr-2 h-4 w-4" aria-hidden />
              Verify
            </Button>
          </form>
        </CardContent>
      </Card>

      {missingToken ? (
        <Card className="border-amber-500/30">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            A verification token is required. Use the full link from your PDF QR code (it includes{' '}
            <span className="font-mono">?t=…</span>), not the document number alone.
          </CardContent>
        </Card>
      ) : null}

      {submittedNumber && submittedToken && q.isPending ? (
        <p className="text-center text-sm text-muted-foreground">Checking document registry…</p>
      ) : null}

      {notFound ? (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No document found for <strong className="font-mono">{submittedNumber}</strong>. Check
            the link from your PDF and try again.
          </CardContent>
        </Card>
      ) : null}

      {result ? (
        <Card
          className={
            isValid
              ? 'border-emerald-500/30'
              : isRevoked
                ? 'border-destructive/30'
                : 'border-amber-500/30'
          }
        >
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Verification result</h2>
              <StatusBadge variant={isValid ? 'success' : isPending ? 'warning' : 'neutral'}>
                {result.status}
              </StatusBadge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {isPending ? (
              <p className="text-muted-foreground">
                This invoice number is known, but the PDF has not been issued yet. Try again after
                the document is generated.
              </p>
            ) : null}
            {isRevoked ? (
              <p className="text-muted-foreground">
                This document was issued, then voided after a refund or cancellation. Do not treat
                it as a live invoice or receipt.
              </p>
            ) : null}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Document number</span>
              <span className="font-mono font-medium">{result.documentNumber}</span>
            </div>
            {typeLabel ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{typeLabel}</span>
              </div>
            ) : null}
            {versionLabel ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Version</span>
                <span>{versionLabel}</span>
              </div>
            ) : null}
            {issuedLabel ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Issued</span>
                <span>{issuedLabel}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
