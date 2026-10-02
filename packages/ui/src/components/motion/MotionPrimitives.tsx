'use client';

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cn } from '../../utils/cn';

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return reduce;
}

/** Snap delay seconds to a stylesheet data-nl-delay bucket (50ms steps, 0–800). */
function delayAttr(delaySec = 0): string {
  const ms = Math.max(0, Math.min(800, Math.round(delaySec * 1000)));
  return String(Math.round(ms / 50) * 50);
}

function readCspNonce(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return (
    document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content')?.trim() || undefined
  );
}

function useInView(once = true, amount = 0.15, rootMargin = '0px 0px -8% 0px') {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    if (reduce) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold: amount, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, amount, rootMargin, reduce]);

  return { ref, inView: reduce || inView, reduce };
}

/** Scroll top bar — width via nonce `<style>` (CSP-safe; no style attributes). */
export function ScrollProgress() {
  const reduce = usePrefersReducedMotion();
  const reactId = useId().replace(/:/g, '');
  const elId = `nl-scroll-progress-${reactId}`;

  useEffect(() => {
    if (reduce) return;

    const styleId = `${elId}-css`;
    let tag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!tag) {
      tag = document.createElement('style');
      tag.id = styleId;
      const nonce = readCspNonce();
      if (nonce) tag.setAttribute('nonce', nonce);
      document.head.appendChild(tag);
    }

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      tag!.textContent = `#${elId}{transform:scaleX(${p.toFixed(4)})}`;
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      tag?.remove();
    };
  }, [reduce, elId]);

  if (reduce) return null;

  return <div id={elId} className="nl-scroll-progress" aria-hidden />;
}

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Kept for API parity with the former Motion prop; CSS uses a fixed y distance. */
  y?: number;
  once?: boolean;
};

export function Reveal({
  children,
  className,
  delay = 0,
  once = true,
  y: _y,
  ...props
}: RevealProps) {
  const { ref, inView } = useInView(once);
  return (
    <div
      ref={ref}
      className={cn('nl-motion nl-reveal', inView && 'is-inview', className)}
      data-nl-delay={delayAttr(delay)}
      {...props}
    >
      {children}
    </div>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
};

export function Stagger({ children, className, stagger = 0.07, delay = 0 }: StaggerProps) {
  return (
    <div className={className}>
      {Children.map(children, (child, i) => {
        if (!isValidElement(child)) return child;
        return cloneElement(child as ReactElement<{ delay?: number }>, {
          delay: delay + i * stagger,
        });
      })}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView(true, 0.12);

  return (
    <div
      ref={ref}
      className={cn('nl-motion nl-stagger-item', inView && 'is-inview', className)}
      data-nl-delay={delayAttr(delay)}
    >
      {children}
    </div>
  );
}

type KineticHeadlineProps = {
  words: Array<{ text: string; highlight?: boolean }>;
  className?: string;
  as?: 'h1' | 'h2';
  ariaLabel: string;
};

/** Word-mask reveal — SSR-safe: full text stays in DOM for SEO. */
export function KineticHeadline({
  words,
  className,
  as: Tag = 'h1',
  ariaLabel,
}: KineticHeadlineProps) {
  const reduce = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (reduce || !mounted) {
    return (
      <Tag className={className} aria-label={ariaLabel}>
        {words.map((w, i) => (
          <span key={`${w.text}-${i}`} className={w.highlight ? 'kinetic-hl' : undefined}>
            {w.text}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={cn(className)} aria-label={ariaLabel}>
      {words.map((w, i) => (
        <span key={`${w.text}-${i}`} className="inline-block overflow-hidden align-bottom">
          <span
            className={cn('nl-motion nl-kinetic-word', w.highlight && 'kinetic-hl')}
            data-nl-delay={delayAttr(0.12 + i * 0.055)}
          >
            {w.text}
          </span>
          {i < words.length - 1 ? '\u00A0' : null}
        </span>
      ))}
    </Tag>
  );
}

export function ProgressFill({
  className,
  percent = 68,
}: {
  className?: string;
  percent?: number;
}) {
  const { ref, inView, reduce } = useInView(true, 0.2);
  const gradId = useId().replace(/:/g, '');
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div ref={ref} className={cn('h-1 overflow-hidden rounded-full bg-surface-muted', className)}>
      <svg viewBox="0 0 100 4" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="#99f6e4" />
          </linearGradient>
        </defs>
        <g className={cn('nl-progress-fill-bar', (inView || reduce) && 'is-inview')}>
          <rect width={clamped} height="4" rx="2" fill={`url(#${gradId})`} />
        </g>
      </svg>
    </div>
  );
}

export function FadeUp({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div
      className={cn('nl-motion nl-fade-up', ready && 'is-inview', className)}
      data-nl-delay={delayAttr(delay)}
    >
      {children}
    </div>
  );
}

export function StageEnter({
  children,
  className,
  delay = 0,
  from = 'left' as 'left' | 'right',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: 'left' | 'right';
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div
      className={cn(
        'nl-motion nl-stage',
        from === 'left' ? 'nl-stage-left' : 'nl-stage-right',
        ready && 'is-inview',
        className
      )}
      data-nl-delay={delayAttr(delay)}
    >
      {children}
    </div>
  );
}

export function ZigReveal({
  children,
  className,
  index = 0,
  delay = 0,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
  delay?: number;
  once?: boolean;
}) {
  const fromLeft = index % 2 === 0;
  const { ref, inView } = useInView(once, 0.18, '0px 0px -6% 0px');

  return (
    <div className={cn('min-w-0 overflow-x-clip', className)}>
      <div
        ref={ref}
        className={cn(
          'nl-motion nl-zig h-full',
          fromLeft ? 'nl-zig-left' : 'nl-zig-right',
          inView && 'is-inview'
        )}
        data-nl-delay={delayAttr(delay + index * 0.06)}
      >
        {children}
      </div>
    </div>
  );
}

export function SoftTilt({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView(true, 0.2);

  return (
    <div
      ref={ref}
      className={cn(
        'nl-motion nl-soft-tilt [perspective:900px] [transform-style:preserve-3d]',
        inView && 'is-inview',
        className
      )}
      data-nl-delay={delayAttr(delay)}
    >
      {children}
    </div>
  );
}
