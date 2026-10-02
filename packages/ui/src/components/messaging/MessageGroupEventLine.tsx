import { cn } from '../../utils/cn';

/** WhatsApp-style centered event pill for shared group updates (join/leave/remove). */
export function MessageGroupEventLine({
  label,
  compact,
  variant = 'neutral',
}: {
  label: string;
  compact?: boolean;
  variant?: 'neutral' | 'leave' | 'rejoin' | 'removed';
}) {
  return (
    <li
      className={cn('flex justify-center', compact ? 'py-2' : 'py-3')}
      role="status"
      aria-label={label}
    >
      <span
        className={cn(
          'max-w-[min(100%,18rem)] rounded-lg px-3 py-1.5 text-center text-[11px] leading-snug shadow-sm',
          variant === 'leave' || variant === 'removed'
            ? 'bg-muted/70 text-muted-foreground'
            : variant === 'rejoin'
              ? 'bg-primary/10 text-primary/90'
              : 'bg-muted/70 text-muted-foreground'
        )}
      >
        {label}
      </span>
    </li>
  );
}
