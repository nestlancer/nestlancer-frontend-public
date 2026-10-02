import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../../utils/cn';

export type FigLabelProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

/** FIG-style section eyebrow: pill + teal dot + uppercase tracking. */
export function FigLabel({ children, className, ...props }: FigLabelProps) {
  return (
    <span className={cn('fig-label', className)} {...props}>
      {children}
    </span>
  );
}
