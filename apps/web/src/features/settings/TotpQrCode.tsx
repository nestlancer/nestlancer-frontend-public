'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

import { Skeleton, cn } from '@nestlancer/ui';

type TotpQrCodeProps = {
  /** otpauth:// URI or data:/http(s) image URL */
  value: string;
  className?: string;
  size?: number;
};

function isImageSource(value: string): boolean {
  return (
    value.startsWith('data:image') ||
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('blob:')
  );
}

/** Renders a scannable QR for TOTP setup (handles otpauth URIs from the API). */
export function TotpQrCode({ value, className, size = 180 }: TotpQrCodeProps) {
  const [src, setSrc] = useState<string | null>(isImageSource(value) ? value : null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (isImageSource(value)) {
      setSrc(value);
      setError(false);
      return;
    }

    setSrc(null);
    setError(false);

    void QRCode.toDataURL(value, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: size,
      color: { dark: '#111827', light: '#ffffff' },
    })
      .then((dataUrl) => {
        if (!cancelled) setSrc(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (error) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        Could not generate QR code. Use the manual secret below.
      </p>
    );
  }

  if (!src) {
    return <Skeleton className={cn('size-[180px] rounded-xl', className)} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- generated local data URL
    <img
      src={src}
      alt="Scan this QR code with your authenticator app"
      width={size}
      height={size}
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700',
        className
      )}
    />
  );
}

export function extractTotpSecret(
  otpauthOrSecret: string,
  explicitSecret?: string | null
): string | null {
  if (explicitSecret?.trim()) return explicitSecret.trim();
  if (!otpauthOrSecret.startsWith('otpauth://')) return null;
  try {
    const url = new URL(otpauthOrSecret);
    return url.searchParams.get('secret');
  } catch {
    const match = /[?&]secret=([^&]+)/i.exec(otpauthOrSecret);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}
