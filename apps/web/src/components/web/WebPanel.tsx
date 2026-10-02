import type { ReactNode } from 'react';

import { cn } from '@nestlancer/ui';

import { webPanelClass } from '@/lib/tailadmin-classes';

type WebPanelProps = {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

const paddingClass = {
  none: '',
  sm: 'p-4',
  md: 'p-5 md:p-6',
  lg: 'p-6 md:p-8',
} as const;

/** TailAdmin flat card surface — replaces glass-panel / GlassPanel in web app. */
export function WebPanel({ children, className, padding = 'md' }: WebPanelProps) {
  return (
    <div className={cn(webPanelClass, paddingClass[padding], 'transition-theme', className)}>
      {children}
    </div>
  );
}
