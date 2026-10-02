'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../utils/cn';
import { IconContainer, type IconContainerProps } from './IconContainer';

export type StatCardProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  iconVariant?: IconContainerProps['variant'];
  change?: ReactNode;
  changeTone?: 'positive' | 'negative' | 'neutral';
  stagger?: 1 | 2 | 3 | 4 | 5 | 6;
};

const staggerDelays: Record<NonNullable<StatCardProps['stagger']>, string> = {
  1: '[animation-delay:50ms]',
  2: '[animation-delay:100ms]',
  3: '[animation-delay:150ms]',
  4: '[animation-delay:200ms]',
  5: '[animation-delay:250ms]',
  6: '[animation-delay:300ms]',
};

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      label,
      value,
      hint,
      icon,
      iconVariant = 'default',
      change,
      changeTone = 'neutral',
      stagger,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        'rounded-[var(--radius-lg,0.875rem)] border border-border/80 bg-card p-6 shadow-sm transition-theme',
        'hover:border-border hover:shadow-md',
        stagger &&
          'animate-fade-in-up opacity-0 motion-reduce:animate-none motion-reduce:opacity-100',
        stagger && staggerDelays[stagger],
        className
      )}
      {...props}
    >
      {icon ? (
        <IconContainer variant={iconVariant} className="mb-4">
          {icon}
        </IconContainer>
      ) : null}
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      {change ? (
        <p
          className={cn(
            'mt-2 flex items-center gap-1 text-xs',
            changeTone === 'positive' && 'text-[hsl(var(--status-success))]',
            changeTone === 'negative' && 'text-[hsl(var(--status-error))]',
            changeTone === 'neutral' && 'text-muted-foreground'
          )}
        >
          {change}
        </p>
      ) : null}
    </div>
  )
);
StatCard.displayName = 'StatCard';
