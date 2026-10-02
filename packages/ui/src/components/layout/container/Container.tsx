'use client';

import type { HTMLAttributes } from 'react';

import { cn } from '../../../utils/cn';

export type ContainerVariant = 'default' | 'narrow' | 'article';

const variantClasses: Record<ContainerVariant, string> = {
  default: 'max-w-6xl',
  narrow: 'max-w-3xl lg:max-w-4xl',
  article: 'max-w-[720px]',
};

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  variant?: ContainerVariant;
};

export function Container({ className, variant = 'default', ...props }: ContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', variantClasses[variant], className)}
      {...props}
    />
  );
}
