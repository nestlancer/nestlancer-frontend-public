import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../../utils/cn';

export type EngineeredPanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  lift?: boolean;
  accent?: boolean;
  as?: 'div' | 'article' | 'section' | 'aside';
};

/** Solid panel + hairline border + elevation — prefer over frosted glass cards. */
export function EngineeredPanel({
  children,
  className,
  lift = false,
  accent = false,
  as: Comp = 'div',
  ...props
}: EngineeredPanelProps) {
  return (
    <Comp
      className={cn(
        'engineered-panel min-w-0 overflow-x-clip',
        lift && 'engineered-panel-lift',
        accent && 'engineered-panel-accent',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
