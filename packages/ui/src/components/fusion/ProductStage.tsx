import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../../utils/cn';

export type ProductStageProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  trailing?: ReactNode;
  children: ReactNode;
  /** Show traffic-light dots (browser chrome). */
  trafficLights?: boolean;
};

/** Browser-chrome product mock for marketing / portal previews. */
export function ProductStage({
  title,
  trailing,
  children,
  trafficLights = true,
  className,
  ...props
}: ProductStageProps) {
  return (
    <div className={cn('product-stage', className)} {...props}>
      <div className="product-stage-chrome">
        {trafficLights ? (
          <>
            <span className="inline-block size-2 rounded-full bg-[#ff5f57]" aria-hidden />
            <span className="inline-block size-2 rounded-full bg-[#febc2e]" aria-hidden />
            <span className="inline-block size-2 rounded-full bg-[#28c840]" aria-hidden />
          </>
        ) : null}
        <span className="ml-1 font-mono text-[0.72rem] text-muted-foreground">{title}</span>
        {trailing ? <span className="ml-auto font-mono text-[0.72rem]">{trailing}</span> : null}
      </div>
      {children}
    </div>
  );
}
