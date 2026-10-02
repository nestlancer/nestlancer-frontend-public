'use client';

import { useCallback, useState } from 'react';
import { toast } from '@nestlancer/ui';

type Props = {
  title: string;
  /** Absolute or site-relative path used for share / copy. */
  url: string;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
};

const DEFAULT_APP_ORIGIN = 'https://app.nestlancer.com';

function resolveAppOrigin(): string {
  const fromEnv =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_APP_URL?.trim() : undefined;
  if (fromEnv && !/localhost|127\.0\.0\.1/.test(fromEnv)) {
    return fromEnv.replace(/\/$/, '');
  }
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return DEFAULT_APP_ORIGIN;
  }
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return DEFAULT_APP_ORIGIN;
}

/** Always return an absolute https URL for social intents and clipboard. */
export function absoluteShareUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${resolveAppOrigin()}${path}`;
}

export function BlogShareRail({ title, url, orientation = 'vertical', className }: Props) {
  const [copied, setCopied] = useState(false);

  const shareUrl = absoluteShareUrl(url);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  }, [shareUrl]);

  const isVertical = orientation === 'vertical';

  return (
    <div className={className}>
      <p
        className={
          isVertical
            ? 'font-mono text-[11px] font-medium uppercase tracking-widest text-[hsl(var(--article-meta))]'
            : 'sr-only'
        }
      >
        Share
      </p>
      <div
        className={isVertical ? 'mt-3 flex flex-col gap-2' : 'flex flex-wrap items-center gap-2'}
      >
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[hsl(var(--article-border))] bg-[hsl(var(--article-bg))] px-3 text-xs font-medium text-[hsl(var(--article-text))] transition hover:border-[hsl(var(--article-accent))] hover:text-[hsl(var(--article-accent))]"
          aria-label="Copy link"
        >
          <CopyIcon />
          {copied ? 'Copied' : isVertical ? 'Copy link' : 'Copy'}
        </button>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[hsl(var(--article-border))] bg-[hsl(var(--article-bg))] px-3 text-xs font-medium text-[hsl(var(--article-text))] transition hover:border-[hsl(var(--article-accent))] hover:text-[hsl(var(--article-accent))]"
          aria-label="Share on LinkedIn"
        >
          <LinkedInIcon />
          {isVertical ? 'LinkedIn' : null}
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[hsl(var(--article-border))] bg-[hsl(var(--article-bg))] px-3 text-xs font-medium text-[hsl(var(--article-text))] transition hover:border-[hsl(var(--article-accent))] hover:text-[hsl(var(--article-accent))]"
          aria-label="Share on X"
        >
          <XIcon />
          {isVertical ? 'X / Twitter' : null}
        </a>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path d="M7 3.5A1.5 1.5 0 018.5 2h6A1.5 1.5 0 0116 3.5v6a1.5 1.5 0 01-1.5 1.5h-6A1.5 1.5 0 017 9.5v-6z" />
      <path d="M4.5 6A1.5 1.5 0 003 7.5v6A1.5 1.5 0 004.5 15h6a1.5 1.5 0 001.5-1.5V12H9.5A2.5 2.5 0 017 9.5V6H4.5z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
