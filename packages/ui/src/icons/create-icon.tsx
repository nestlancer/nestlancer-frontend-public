import { forwardRef, type ReactNode, type SVGAttributes } from 'react';

import { cn } from '../utils/cn';

export type IconProps = SVGAttributes<SVGSVGElement> & {
  size?: number | string;
};

export function createIcon(displayName: string, paths: ReactNode) {
  const Icon = forwardRef<SVGSVGElement, IconProps>(({ className, size = 24, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    >
      {paths}
    </svg>
  ));
  Icon.displayName = displayName;
  return Icon;
}
