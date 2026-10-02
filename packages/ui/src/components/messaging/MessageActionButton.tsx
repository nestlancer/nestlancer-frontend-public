import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

export function MessageActionButton({
  className,
  variant: _variant = 'default',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'sent' | 'received';
}) {
  void _variant;
  return (
    <button
      type="button"
      className={cn(
        'text-xs font-medium transition-colors disabled:opacity-50',
        'text-muted-foreground hover:text-foreground',
        className
      )}
      {...props}
    />
  );
}
