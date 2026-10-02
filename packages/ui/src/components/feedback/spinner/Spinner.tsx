import { cn } from '../../../utils/cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary',
        className
      )}
    />
  );
}
