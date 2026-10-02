import { cn } from '../../utils/cn';

export function MessageMembershipDivider({
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
      className={cn('flex items-center gap-2', compact ? 'py-2.5' : 'py-4')}
      role="separator"
      aria-label={label}
    >
      <span className="h-px flex-1 bg-border/80" />
      <span
        className={cn(
          'shrink-0 px-2 text-center font-medium',
          compact ? 'text-[10px]' : 'text-[11px]',
          variant === 'leave' || variant === 'removed'
            ? 'text-muted-foreground'
            : variant === 'rejoin'
              ? 'text-primary/80'
              : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
      <span className="h-px flex-1 bg-border/80" />
    </li>
  );
}
