'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '../../utils/cn';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      execute?: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const VISIBLE_CHALLENGE_MIN_PX = 40;
const RENDER_TIMEOUT_MS = 4000;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Turnstile script failed')), {
        once: true,
      });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile script failed'));
    document.head.appendChild(script);
  });
}

function hasVisibleChallenge(el: HTMLElement): boolean {
  const iframe = el.querySelector('iframe');
  if (!iframe) return false;
  return iframe.getBoundingClientRect().height >= VISIBLE_CHALLENGE_MIN_PX;
}

export type TurnstileStatus = 'idle' | 'loading' | 'challenge' | 'solved' | 'unavailable';

type TurnstileWidgetProps = {
  onToken: (token: string | null) => void;
  onStatus?: (status: TurnstileStatus) => void;
  className?: string;
};

/**
 * Renders Cloudflare Turnstile when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set.
 * When unset (typical local/dev with bypass token), renders nothing.
 * Height is reserved only while a visible challenge iframe is present.
 */
export function TurnstileWidget({ onToken, onStatus, className }: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onStatusRef = useRef(onStatus);
  onTokenRef.current = onToken;
  onStatusRef.current = onStatus;

  const [ready, setReady] = useState(false);
  const [mountKey, setMountKey] = useState(0);
  const [status, setStatus] = useState<TurnstileStatus>(siteKey ? 'loading' : 'idle');

  const setStatusSafe = useCallback((next: TurnstileStatus) => {
    setStatus(next);
    onStatusRef.current?.(next);
  }, []);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    const id = window.requestAnimationFrame(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
    };
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey || !ready || !containerRef.current) return;

    let cancelled = false;
    let timeoutId = 0;
    let observer: MutationObserver | null = null;

    timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      setStatus((current) => {
        if (current === 'solved' || current === 'challenge') return current;
        onStatusRef.current?.('unavailable');
        return 'unavailable';
      });
    }, RENDER_TIMEOUT_MS);

    const evaluateVisibility = () => {
      if (cancelled || !containerRef.current) return;
      if (hasVisibleChallenge(containerRef.current)) {
        setStatusSafe('challenge');
      }
    };

    void loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) {
          if (!cancelled) {
            onTokenRef.current(null);
            setStatusSafe('unavailable');
          }
          return;
        }

        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            /* ignore */
          }
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            onTokenRef.current(token);
            setStatusSafe('solved');
          },
          'expired-callback': () => {
            onTokenRef.current(null);
            setStatusSafe(hasVisibleChallenge(containerRef.current!) ? 'challenge' : 'loading');
          },
          'error-callback': () => {
            onTokenRef.current(null);
            setStatusSafe('unavailable');
          },
          theme: 'auto',
          size: 'flexible',
        });

        try {
          window.turnstile.execute?.(widgetIdRef.current);
        } catch {
          /* invisible widgets may not expose execute */
        }

        observer = new MutationObserver(evaluateVisibility);
        observer.observe(containerRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
        });
        evaluateVisibility();
      })
      .catch(() => {
        if (!cancelled) {
          onTokenRef.current(null);
          setStatusSafe('unavailable');
        }
      });

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      observer?.disconnect();
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, ready, mountKey, setStatusSafe]);

  function retry() {
    onTokenRef.current(null);
    setStatusSafe('loading');
    setMountKey((key) => key + 1);
  }

  if (!siteKey) return null;

  return (
    <div className={cn('w-full max-w-full', className)} data-testid="turnstile-widget">
      {status === 'loading' ? (
        <p className="text-xs text-muted-foreground" role="status">
          Loading security check…
        </p>
      ) : null}
      <div
        key={mountKey}
        ref={containerRef}
        hidden={status === 'unavailable'}
        className={status === 'challenge' ? 'min-h-[65px] w-full max-w-full' : 'w-full max-w-full'}
      />
      {status === 'unavailable' ? (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2" role="status">
          <p className="text-xs text-muted-foreground">
            Security verification didn&apos;t load. Retry, then submit.
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-2 text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            Retry verification
          </button>
        </div>
      ) : null}
    </div>
  );
}
