import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../../utils/cn';

export type StatusPillTone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export type StatusPillProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: StatusPillTone;
  mono?: boolean;
};

const toneClass: Record<StatusPillTone, string> = {
  default: 'border-border text-muted-foreground',
  primary: 'border-primary/35 bg-[hsl(var(--primary-dim))] text-primary',
  success:
    'border-[hsl(var(--success)/0.35)] bg-[hsl(var(--success)/0.08)] text-[hsl(var(--success))]',
  warning:
    'border-[hsl(var(--warning)/0.35)] bg-[hsl(var(--warning)/0.08)] text-[hsl(var(--warning))]',
  danger: 'border-[hsl(var(--danger)/0.35)] bg-[hsl(var(--danger)/0.08)] text-[hsl(var(--danger))]',
};

export function StatusPill({
  children,
  className,
  tone = 'default',
  mono = false,
  ...props
}: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold',
        toneClass[tone],
        mono && 'font-mono tabular-nums',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
