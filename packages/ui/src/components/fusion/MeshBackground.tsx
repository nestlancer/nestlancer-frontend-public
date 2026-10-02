import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../../utils/cn';

export type MeshBackgroundProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  /** `island` = Stripe light money mesh (forces light). `orbs` = dark hero wash. */
  variant?: 'island' | 'orbs';
  as?: 'div' | 'section';
};

export function MeshBackground({
  children,
  className,
  variant = 'orbs',
  as: Comp = 'section',
  ...props
}: MeshBackgroundProps) {
  return (
    <Comp className={cn(variant === 'island' ? 'mesh-island' : 'hero-orbs', className)} {...props}>
      {children}
    </Comp>
  );
}
