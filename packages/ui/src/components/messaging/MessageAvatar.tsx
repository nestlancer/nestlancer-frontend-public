import { cn } from '../../utils/cn';
import { messageSenderInitials } from './message-time';

export function MessageAvatar({
  label,
  variant,
  className,
}: {
  label: string;
  variant: 'sent' | 'received';
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold',
        variant === 'sent'
          ? 'bg-primary/15 text-primary'
          : 'bg-muted text-muted-foreground',
        className
      )}
    >
      {messageSenderInitials(label)}
    </span>
  );
}
