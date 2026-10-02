import React from 'react';

import { logoSrc, type LogoVariant } from './logo-assets';

export type NestlancerLogoProps = {
  variant: LogoVariant;
  /** `'auto'` = CSS dark-mode swap via `html.dark` (default) */
  theme?: 'light' | 'dark' | 'auto';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export const NestlancerLogo: React.FC<NestlancerLogoProps> = ({
  variant,
  theme = 'auto',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    icon: {
      sm: 'h-6 w-6 max-h-6 max-w-6',
      md: 'h-8 w-8 max-h-8 max-w-8',
      lg: 'h-12 w-12 max-h-12 max-w-12',
    },
    full: {
      // max-w clamps intrinsic SVG width if Tailwind utilities fail to load (NL-BUG-RESP-01).
      sm: 'h-6 w-auto max-h-6 max-w-[9rem]',
      md: 'h-8 w-auto max-h-8 max-w-[11rem]',
      lg: 'h-12 w-auto max-h-12 max-w-[16rem]',
    },
  };

  const dimensions = sizeClasses[variant][size];
  const lightSrc = logoSrc(variant, 'light');
  const darkSrc = logoSrc(variant, 'dark');
  const intrinsic =
    variant === 'icon'
      ? {
          width: size === 'lg' ? 48 : size === 'sm' ? 24 : 32,
          height: size === 'lg' ? 48 : size === 'sm' ? 24 : 32,
        }
      : {
          width: size === 'lg' ? 192 : size === 'sm' ? 108 : 144,
          height: size === 'lg' ? 48 : size === 'sm' ? 24 : 32,
        };

  return (
    <div className={`flex shrink-0 items-center overflow-hidden ${className}`}>
      {(theme === 'auto' || theme === 'light') && (
        <img
          src={lightSrc}
          alt="Nestlancer Studio Logo"
          width={intrinsic.width}
          height={intrinsic.height}
          className={`${dimensions} ${theme === 'auto' ? 'dark:hidden block' : ''}`}
        />
      )}
      {(theme === 'auto' || theme === 'dark') && (
        <img
          src={darkSrc}
          alt={theme === 'auto' ? '' : 'Nestlancer Studio Logo'}
          aria-hidden={theme === 'auto' || undefined}
          width={intrinsic.width}
          height={intrinsic.height}
          className={`${dimensions} ${theme === 'auto' ? 'hidden dark:block' : ''}`}
        />
      )}
    </div>
  );
};
